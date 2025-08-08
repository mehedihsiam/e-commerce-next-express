import Category from './Category.model.js';

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid category ID format',
      });
    }

    // Check if category exists and is not already deleted
    const category = await Category.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    // Check if category has child categories
    const childCategories = await Category.find({
      parent: id,
      isDeleted: { $ne: true },
    });

    if (childCategories.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete category with subcategories',
        error: `This category has ${childCategories.length} subcategory(ies). Please delete or move the subcategories first.`,
        childCategories: childCategories.map(child => ({
          _id: child._id,
          name: child.name,
          slug: child.slug,
        })),
      });
    }

    // TODO: Check if category has products assigned
    // Uncomment and modify this when you have the Product model relationship
    /*
    const Product = require('../product/Product.model.js'); // Adjust path as needed
    const productsInCategory = await Product.find({
      category: id,
      isDeleted: { $ne: true },
    });

    if (productsInCategory.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete category with products',
        error: `This category has ${productsInCategory.length} product(s). Please move or delete the products first.`,
        productCount: productsInCategory.length,
      });
    }
    */

    // Perform soft delete
    const deletedCategory = await Category.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false, // Also deactivate the category
      },
      { new: true },
    );

    console.log(`Category soft deleted: ${category.name} (ID: ${id})`);

    res.status(200).json({
      message: 'Category deleted successfully',
      category: {
        _id: deletedCategory._id,
        name: deletedCategory.name,
        slug: deletedCategory.slug,
        isDeleted: deletedCategory.isDeleted,
        deletedAt: deletedCategory.deletedAt,
      },
    });
  } catch (error) {
    console.error('Delete category error:', error);

    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid category ID format',
      });
    }

    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(400).json({
        message: 'Database error during deletion',
        error: error.message,
      });
    }

    next(error);
  }
};

export default deleteCategory;
