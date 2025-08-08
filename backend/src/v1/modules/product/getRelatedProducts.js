import Product from './Product.model.js';

const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = '6' } = req.query;

    // Validate product ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid product ID format',
      });
    }

    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
      return res.status(400).json({
        message: 'Limit must be between 1 and 20',
      });
    }

    // Find the main product
    const mainProduct = await Product.findOne({
      _id: id,
      isActive: true,
    })
      .select('category tags price name')
      .lean();

    if (!mainProduct) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    // Build related products query
    const relatedFilter = {
      _id: { $ne: id }, // Exclude the main product
      isActive: true,
      $or: [
        { category: mainProduct.category }, // Same category
        { tags: { $in: mainProduct.tags || [] } }, // Shared tags
      ],
    };

    // Get related products with scoring for relevance
    const relatedProducts = await Product.aggregate([
      { $match: relatedFilter },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              // Same category = 3 points
              { $cond: [{ $eq: ['$category', mainProduct.category] }, 3, 0] },
              // Shared tags = 1 point per tag
              {
                $size: {
                  $ifNull: [
                    { $setIntersection: ['$tags', mainProduct.tags || []] },
                    [],
                  ],
                },
              },
              // Similar price range = 2 points
              {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$price', mainProduct.price * 0.7] },
                      { $lte: ['$price', mainProduct.price * 1.3] },
                    ],
                  },
                  2,
                  0,
                ],
              },
            ],
          },
        },
      },
      { $sort: { relevanceScore: -1, averageRating: -1, views: -1 } },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1, slug: 1 } }],
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          description: 1,
          images: 1,
          price: 1,
          discountPrice: 1,
          category: 1,
          tags: 1,
          hasVariants: 1,
          variants: 1,
          stock: 1,
          averageRating: 1,
          totalReviews: 1,
          relevanceScore: 1,
        },
      },
    ]);

    // Transform for public consumption
    const transformedProducts = relatedProducts.map(product => {
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
        relevanceScore: product.relevanceScore,
      };
    });

    res.status(200).json({
      message: 'Related products retrieved successfully',
      data: {
        mainProduct: {
          _id: mainProduct._id,
          name: mainProduct.name,
        },
        relatedProducts: transformedProducts,
        count: transformedProducts.length,
        algorithm: 'category + tags + price similarity',
      },
    });
  } catch (error) {
    console.error('Get related products error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid product ID format',
      });
    }

    next(error);
  }
};

export default getRelatedProducts;
