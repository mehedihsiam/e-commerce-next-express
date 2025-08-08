import Product from './Product.model.js';

const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = '8', category } = req.query;

    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
      return res.status(400).json({
        message: 'Limit must be between 1 and 20',
      });
    }

    // Build filter
    const filter = {
      isActive: true,
      isFeatured: true,
    };

    // Add category filter if provided
    if (category && category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    }

    // Get featured products
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .select(
        'name description images price discountPrice isFeatured ' +
          'averageRating totalReviews hasVariants variants tags createdAt',
      )
      .sort({ createdAt: -1 }) // Newest featured first
      .limit(limitNum)
      .lean();

    // Transform for public consumption
    const featuredProducts = products.map(product => {
      const effectivePrice = product.discountPrice || product.price;
      const discountPercentage =
        product.discountPrice && product.price
          ? Math.round(
              ((product.price - product.discountPrice) / product.price) * 100,
            )
          : 0;

      // Check stock availability
      let isInStock = false;
      if (
        product.hasVariants &&
        product.variants &&
        product.variants.length > 0
      ) {
        isInStock = product.variants.some(
          variant => variant.isActive !== false && variant.stock > 0,
        );
      } else {
        isInStock = product.stock > 0;
      }

      return {
        _id: product._id,
        name: product.name,
        description: product.description,
        images: product.images || [],
        price: product.price,
        discountPrice: product.discountPrice,
        effectivePrice,
        discountPercentage,
        category: product.category,
        tags: product.tags || [],
        hasVariants: product.hasVariants,
        isInStock,
        averageRating: product.averageRating || 0,
        totalReviews: product.totalReviews || 0,
        isFeatured: true,
        createdAt: product.createdAt,
      };
    });

    res.status(200).json({
      message: 'Featured products retrieved successfully',
      data: {
        products: featuredProducts,
        count: featuredProducts.length,
        filters: {
          category: category || null,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Get featured products error:', error);

    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(500).json({
        message: 'Featured products temporarily unavailable',
      });
    }

    next(error);
  }
};

export default getFeaturedProducts;
