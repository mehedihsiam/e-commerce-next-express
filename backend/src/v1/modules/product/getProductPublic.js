import Product from './Product.model.js';

const getProductPublic = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Find product (only active products for public)
    const product = await Product.findOne({
      slug,
      isActive: true, // Only show active products to public
    })
      .populate('category', 'name slug description image')
      .select(
        // Only select public-safe fields
        'name description images price discountPrice category tags ' +
          'hasVariants variants isFeatured averageRating totalReviews ' +
          'views metaTitle metaDescription weight dimensions createdAt updatedAt',
      )
      .lean();

    if (!product) {
      return res.status(404).json({
        message: 'Product not found or unavailable',
      });
    }

    // Increment views count (fire and forget - don't wait for response)
    Product.findByIdAndUpdate(
      slug,
      { $inc: { views: 1 } },
      { new: false },
    ).catch(err => console.log('View count update failed:', err));

    // Transform product for public consumption
    const publicProduct = {
      _id: product._id,
      name: product.name,
      description: product.description,
      images: product.images || [],
      price: product.price,
      discountPrice: product.discountPrice,
      category: product.category,
      tags: product.tags || [],
      hasVariants: product.hasVariants,
      isFeatured: product.isFeatured,
      averageRating: product.averageRating || 0,
      totalReviews: product.totalReviews || 0,
      views: (product.views || 0) + 1, // Include the incremented view
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      weight: product.weight,
      dimensions: product.dimensions,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    // Calculate effective price and discount
    publicProduct.effectivePrice = product.discountPrice || product.price;
    publicProduct.discountPercentage =
      product.discountPrice && product.price
        ? Math.round(
            ((product.price - product.discountPrice) / product.price) * 100,
          )
        : 0;

    // Handle variants (only show available ones)
    if (
      product.hasVariants &&
      product.variants &&
      product.variants.length > 0
    ) {
      // Filter only active variants with stock
      const availableVariants = product.variants.filter(
        variant => variant.isActive !== false && variant.stock > 0,
      );

      publicProduct.isInStock = availableVariants.length > 0;
      publicProduct.hasMultipleOptions = availableVariants.length > 1;

      // Calculate variant price range
      if (availableVariants.length > 0) {
        const variantPrices = availableVariants.map(
          v => v.discountPrice || v.price || product.price,
        );
        const minPrice = Math.min(...variantPrices);
        const maxPrice = Math.max(...variantPrices);

        if (minPrice !== maxPrice) {
          publicProduct.priceRange = { min: minPrice, max: maxPrice };
        }

        // Get available colors and sizes
        const availableColors = [
          ...new Set(availableVariants.filter(v => v.color).map(v => v.color)),
        ];

        const availableSizes = [
          ...new Set(availableVariants.filter(v => v.size).map(v => v.size)),
        ];

        if (availableColors.length > 0)
          publicProduct.availableColors = availableColors;
        if (availableSizes.length > 0)
          publicProduct.availableSizes = availableSizes;
      }

      // Transform variants for public (remove sensitive data)
      publicProduct.variants = availableVariants.map(variant => ({
        _id: variant._id,
        color: variant.color,
        size: variant.size,
        price: variant.price,
        discountPrice: variant.discountPrice,
        effectivePrice: variant.discountPrice || variant.price || product.price,
        images: variant.images || [],
        weight: variant.weight,
        dimensions: variant.dimensions,
        sku: variant.sku, // Public can see SKU for ordering
        isAvailable: variant.stock > 0,
        discountPercentage:
          variant.discountPrice && (variant.price || product.price)
            ? Math.round(
                (((variant.price || product.price) - variant.discountPrice) /
                  (variant.price || product.price)) *
                  100,
              )
            : 0,
      }));
    } else {
      // For non-variant products, we can't show exact stock for security
      // but we can indicate availability
      publicProduct.isInStock = product.stock > 0;
      publicProduct.hasMultipleOptions = false;
    }

    // Calculate shipping info (if weight/dimensions available)
    let shippingInfo = null;
    if (product.weight || product.dimensions) {
      shippingInfo = {
        weight: product.weight,
        dimensions: product.dimensions,
        estimatedShipping: 'Calculated at checkout', // Generic message
      };
    }

    // Get related products (same category, excluding current product)
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true,
    })
      .select('name images price discountPrice averageRating totalReviews')
      .limit(6)
      .lean();

    // Transform related products
    const transformedRelatedProducts = relatedProducts.map(related => ({
      _id: related._id,
      name: related.name,
      images: related.images || [],
      price: related.price,
      discountPrice: related.discountPrice,
      effectivePrice: related.discountPrice || related.price,
      averageRating: related.averageRating || 0,
      totalReviews: related.totalReviews || 0,
      discountPercentage:
        related.discountPrice && related.price
          ? Math.round(
              ((related.price - related.discountPrice) / related.price) * 100,
            )
          : 0,
    }));

    res.status(200).json({
      message: 'Product details retrieved successfully',
      data: {
        product: publicProduct,
        shippingInfo,
        relatedProducts: transformedRelatedProducts,
        seo: {
          title: product.metaTitle || product.name,
          description:
            product.metaDescription || product.description?.substring(0, 160),
          canonicalUrl: `/products/${product._id}`,
        },
      },
    });
  } catch (error) {
    console.error('Get product public error:', error);

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid product ID',
      });
    }

    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(500).json({
        message: 'Product temporarily unavailable',
      });
    }

    // Pass other errors to error handling middleware
    next(error);
  }
};

export default getProductPublic;
