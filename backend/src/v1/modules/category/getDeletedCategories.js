import Category from './Category.model.js';

const getDeletedCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        message: 'Invalid page number',
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        message: 'Invalid limit. Must be between 1 and 100',
      });
    }

    // Calculate skip value for pagination
    const skip = (pageNum - 1) * limitNum;

    // Query for deleted categories only
    const [deletedCategories, totalCount] = await Promise.all([
      Category.find({ isDeleted: true })
        .populate('parent', 'name slug isDeleted')
        .sort({ deletedAt: -1 }) // Most recently deleted first
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Category.countDocuments({ isDeleted: true }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Transform the data to include additional info
    const transformedCategories = deletedCategories.map(category => ({
      ...category,
      canRestore: true, // We'll determine this based on business logic
      parentStatus: category.parent
        ? category.parent.isDeleted
          ? 'deleted'
          : 'active'
        : null,
      deletedDuration: category.deletedAt
        ? Math.floor(
            (new Date() - new Date(category.deletedAt)) / (1000 * 60 * 60 * 24),
          ) // Days since deletion
        : null,
    }));

    // Check for each category if it can be restored (name conflicts)
    for (const category of transformedCategories) {
      const nameConflict = await Category.findOne({
        name: category.name,
        _id: { $ne: category._id },
        isDeleted: { $ne: true },
      });

      category.canRestore = !nameConflict;
      if (nameConflict) {
        category.restoreIssue = 'Name conflict with existing category';
        category.conflictingCategoryId = nameConflict._id;
      }
    }

    res.status(200).json({
      message: 'Deleted categories retrieved successfully',
      data: {
        categories: transformedCategories,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? pageNum + 1 : null,
          prevPage: hasPrevPage ? pageNum - 1 : null,
        },
        summary: {
          totalDeleted: totalCount,
          canRestore: transformedCategories.filter(cat => cat.canRestore)
            .length,
          hasConflicts: transformedCategories.filter(cat => !cat.canRestore)
            .length,
        },
      },
    });
  } catch (error) {
    console.error('Get deleted categories error:', error);

    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(500).json({
        message: 'Database error while retrieving deleted categories',
        error: error.message,
      });
    }

    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid query parameter format',
      });
    }

    next(error);
  }
};

export default getDeletedCategories;
