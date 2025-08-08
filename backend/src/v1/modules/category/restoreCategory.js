import Category from './Category.model.js';

const restoreCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid category ID format',
      });
    }

    // Find the deleted category (explicitly query for deleted categories)
    const deletedCategory = await Category.findOne({
      _id: id,
      isDeleted: true,
    });

    if (!deletedCategory) {
      return res.status(404).json({
        message: 'Deleted category not found',
        error: 'Category either does not exist or is not deleted',
      });
    }

    // Check if a category with the same name already exists (excluding this deleted one)
    const duplicateName = await Category.findOne({
      name: deletedCategory.name,
      _id: { $ne: id },
      isDeleted: { $ne: true },
    });

    if (duplicateName) {
      return res.status(400).json({
        message: 'Cannot restore category',
        error: `A category with the name "${deletedCategory.name}" already exists. Please rename the existing category first or restore with a different name.`,
        conflictingCategory: {
          _id: duplicateName._id,
          name: duplicateName.name,
          slug: duplicateName.slug,
        },
      });
    }

    // Check if parent category exists and is active (if this category has a parent)
    if (deletedCategory.parent) {
      const parentCategory = await Category.findOne({
        _id: deletedCategory.parent,
        isDeleted: { $ne: true },
        isActive: true,
      });

      if (!parentCategory) {
        return res.status(400).json({
          message: 'Cannot restore category',
          error:
            'Parent category is not available (deleted or inactive). Please assign a new parent category or restore the parent category first.',
          parentCategoryId: deletedCategory.parent,
        });
      }
    }

    // Restore the category
    const restoredCategory = await Category.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
        isActive: true, // Reactivate the category
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run mongoose validators
      },
    ).populate('parent', 'name slug');

    console.log(`Category restored: ${restoredCategory.name} (ID: ${id})`);

    res.status(200).json({
      message: 'Category restored successfully',
      category: restoredCategory,
    });
  } catch (error) {
    console.error('Restore category error:', error);

    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid category ID format',
      });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: 'Cannot restore category',
        error: `A category with this ${field} already exists`,
        field,
        value: error.keyValue[field],
      });
    }

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Category restoration validation failed',
        error: error.message,
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message,
          value: error.errors[key].value,
        })),
      });
    }

    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(400).json({
        message: 'Database error during restoration',
        error: error.message,
      });
    }

    next(error);
  }
};

export default restoreCategory;
