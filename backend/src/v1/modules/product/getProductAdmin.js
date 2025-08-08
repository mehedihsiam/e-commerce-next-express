import Product from './Product.model.js';

const getProductAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid product ID format',
      });
    }

    // Find product (admin can see all products, including inactive)
    const product = await Product.findById(id)
      .populate('category', 'name slug description image isActive createdAt')
      .lean(); // All fields for admin

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    // Enhanced product data for admin
    const adminProduct = {
      ...product,
    };

    // Calculate enhanced analytics for admin
    adminProduct.analytics = {
      effectivePrice: product.discountPrice || product.price,
      discountPercentage:
        product.discountPrice && product.price
          ? Math.round(
              ((product.price - product.discountPrice) / product.price) * 100,
            )
          : 0,
      profitMargin:
        product.costPrice && product.price
          ? Math.round(
              ((product.price - product.costPrice) / product.price) * 100,
            )
          : null,
      views: product.views || 0,
      averageRating: product.averageRating || 0,
      totalReviews: product.totalReviews || 0,
      conversionRate:
        product.views > 0 && product.sales
          ? Math.round((product.sales / product.views) * 100 * 100) / 100 // 2 decimal places
          : 0,
    };

    // Calculate stock analytics
    if (
      product.hasVariants &&
      product.variants &&
      product.variants.length > 0
    ) {
      const totalVariantStock = product.variants.reduce(
        (sum, variant) => sum + (variant.stock || 0),
        0,
      );

      const activeVariants = product.variants.filter(v => v.isActive !== false);
      const inStockVariants = product.variants.filter(v => v.stock > 0);
      const lowStockVariants = product.variants.filter(
        v => v.stock > 0 && v.stock <= (product.lowStockThreshold || 10),
      );

      adminProduct.stockAnalytics = {
        mainStock: product.stock || 0,
        totalVariantStock,
        effectiveStock: totalVariantStock,
        totalVariants: product.variants.length,
        activeVariants: activeVariants.length,
        inStockVariants: inStockVariants.length,
        outOfStockVariants: product.variants.length - inStockVariants.length,
        lowStockVariants: lowStockVariants.length,
        stockStatus:
          totalVariantStock === 0
            ? 'out_of_stock'
            : totalVariantStock <= (product.lowStockThreshold || 10)
              ? 'low_stock'
              : 'in_stock',
      };

      // Enhanced variant data for admin
      adminProduct.variants = product.variants.map(variant => ({
        ...variant,
        effectivePrice: variant.discountPrice || variant.price || product.price,
        discountPercentage:
          variant.discountPrice && (variant.price || product.price)
            ? Math.round(
                (((variant.price || product.price) - variant.discountPrice) /
                  (variant.price || product.price)) *
                  100,
              )
            : 0,
        stockStatus:
          variant.stock === 0
            ? 'out_of_stock'
            : variant.stock <= (product.lowStockThreshold || 10)
              ? 'low_stock'
              : 'in_stock',
        profitMargin:
          variant.costPrice && (variant.price || product.price)
            ? Math.round(
                (((variant.price || product.price) - variant.costPrice) /
                  (variant.price || product.price)) *
                  100,
              )
            : null,
      }));
    } else {
      adminProduct.stockAnalytics = {
        mainStock: product.stock || 0,
        totalVariantStock: 0,
        effectiveStock: product.stock || 0,
        stockStatus:
          product.stock === 0
            ? 'out_of_stock'
            : product.stock <= (product.lowStockThreshold || 10)
              ? 'low_stock'
              : 'in_stock',
      };
    }

    // SEO analysis
    adminProduct.seoAnalysis = {
      hasMetaTitle: !!product.metaTitle,
      metaTitleLength: product.metaTitle ? product.metaTitle.length : 0,
      hasMetaDescription: !!product.metaDescription,
      metaDescriptionLength: product.metaDescription
        ? product.metaDescription.length
        : 0,
      hasImages: product.images && product.images.length > 0,
      imageCount: product.images ? product.images.length : 0,
      hasDescription: !!product.description,
      descriptionLength: product.description ? product.description.length : 0,
      hasTags: product.tags && product.tags.length > 0,
      tagCount: product.tags ? product.tags.length : 0,
      seoScore: 0, // Will calculate below
    };

    // Calculate SEO score (out of 100)
    let seoScore = 0;
    if (adminProduct.seoAnalysis.hasMetaTitle) seoScore += 20;
    if (
      adminProduct.seoAnalysis.metaTitleLength >= 30 &&
      adminProduct.seoAnalysis.metaTitleLength <= 60
    )
      seoScore += 10;
    if (adminProduct.seoAnalysis.hasMetaDescription) seoScore += 20;
    if (
      adminProduct.seoAnalysis.metaDescriptionLength >= 120 &&
      adminProduct.seoAnalysis.metaDescriptionLength <= 160
    )
      seoScore += 10;
    if (adminProduct.seoAnalysis.hasImages) seoScore += 15;
    if (
      adminProduct.seoAnalysis.hasDescription &&
      adminProduct.seoAnalysis.descriptionLength >= 100
    )
      seoScore += 15;
    if (
      adminProduct.seoAnalysis.hasTags &&
      adminProduct.seoAnalysis.tagCount >= 3
    )
      seoScore += 10;

    adminProduct.seoAnalysis.seoScore = seoScore;

    // Get similar products for admin analysis
    const similarProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
    })
      .select(
        'name price discountPrice stock isActive averageRating views sales',
      )
      .limit(10)
      .lean();

    // Performance comparison with similar products
    const performanceComparison = {
      averagePrice: 0,
      averageRating: 0,
      averageViews: 0,
      averageSales: 0,
      betterThanAverage: {
        price: false,
        rating: false,
        views: false,
        sales: false,
      },
    };

    if (similarProducts.length > 0) {
      performanceComparison.averagePrice =
        similarProducts.reduce(
          (sum, p) => sum + (p.discountPrice || p.price || 0),
          0,
        ) / similarProducts.length;

      performanceComparison.averageRating =
        similarProducts.reduce((sum, p) => sum + (p.averageRating || 0), 0) /
        similarProducts.length;

      performanceComparison.averageViews =
        similarProducts.reduce((sum, p) => sum + (p.views || 0), 0) /
        similarProducts.length;

      performanceComparison.averageSales =
        similarProducts.reduce((sum, p) => sum + (p.sales || 0), 0) /
        similarProducts.length;

      // Compare this product with averages
      const thisEffectivePrice = product.discountPrice || product.price || 0;
      performanceComparison.betterThanAverage = {
        price: thisEffectivePrice <= performanceComparison.averagePrice, // Lower price is better
        rating:
          (product.averageRating || 0) >= performanceComparison.averageRating,
        views: (product.views || 0) >= performanceComparison.averageViews,
        sales: (product.sales || 0) >= performanceComparison.averageSales,
      };
    }

    // Business insights
    const businessInsights = [];

    if (adminProduct.stockAnalytics.stockStatus === 'low_stock') {
      businessInsights.push({
        type: 'warning',
        message: 'Low stock alert - Consider restocking soon',
        priority: 'high',
      });
    }

    if (adminProduct.stockAnalytics.stockStatus === 'out_of_stock') {
      businessInsights.push({
        type: 'error',
        message: 'Product is out of stock - Lost sales opportunity',
        priority: 'critical',
      });
    }

    if (adminProduct.seoAnalysis.seoScore < 60) {
      businessInsights.push({
        type: 'info',
        message: 'SEO score is low - Improve meta tags and description',
        priority: 'medium',
      });
    }

    if (product.views > 100 && (product.sales || 0) < 5) {
      businessInsights.push({
        type: 'warning',
        message: 'High views but low sales - Review pricing or description',
        priority: 'medium',
      });
    }

    if (!product.isActive) {
      businessInsights.push({
        type: 'info',
        message: 'Product is inactive - Not visible to customers',
        priority: 'low',
      });
    }

    res.status(200).json({
      message: 'Product details retrieved successfully',
      data: {
        product: adminProduct,
        performanceComparison,
        businessInsights,
        similarProducts: similarProducts.map(p => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          discountPrice: p.discountPrice,
          effectivePrice: p.discountPrice || p.price,
          stock: p.stock,
          isActive: p.isActive,
          averageRating: p.averageRating || 0,
          views: p.views || 0,
          sales: p.sales || 0,
        })),
        metadata: {
          lastModified: product.updatedAt,
          created: product.createdAt,
          totalDataPoints: Object.keys(product).length,
        },
      },
    });
  } catch (error) {
    console.error('Get product admin error:', error);

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid product ID format',
        error: `Invalid product ID: ${req.params.id}`,
      });
    }

    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(400).json({
        message: 'Database error',
        error: error.message,
        code: error.code,
      });
    }

    // Pass other errors to error handling middleware
    next(error);
  }
};

export default getProductAdmin;
