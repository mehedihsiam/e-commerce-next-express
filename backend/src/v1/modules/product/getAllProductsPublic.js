import { z } from 'zod';
import Product from './Product.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for public query parameters (more restricted)
const publicQuerySchema = z.object({
  // Pagination
  page: z
    .string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val > 0, 'Page must be a positive number')
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val))
    .refine(
      val => !isNaN(val) && val > 0 && val <= 50,
      'Limit must be between 1 and 50',
    )
    .optional()
    .default('12'),

  // Sorting (limited options for public)
  sortBy: z
    .enum(['name', 'price', 'createdAt', 'popularity', 'rating', 'featured'])
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc', '1', '-1'])
    .transform(val => (val === 'asc' || val === '1' ? 1 : -1))
    .optional()
    .default(-1),

  // Public filtering options
  search: z.string().trim().min(1).max(100).optional(),
  category: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
    .optional(),
  minPrice: z
    .string()
    .transform(val => parseFloat(val))
    .refine(
      val => !isNaN(val) && val >= 0,
      'Min price must be a positive number',
    )
    .optional(),
  maxPrice: z
    .string()
    .transform(val => parseFloat(val))
    .refine(
      val => !isNaN(val) && val >= 0,
      'Max price must be a positive number',
    )
    .optional(),
  featured: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  onSale: z
    .string()
    .transform(val => val === 'true')
    .optional(), // Products with discount
  inStock: z
    .string()
    .transform(val => val === 'true')
    .optional(), // Only products in stock
  variationType: z.enum(['color', 'size', 'color_size']).optional(),
  tags: z.string().max(200).optional(), // Comma-separated tags
  priceRange: z
    .enum(['under_25', '25_50', '50_100', '100_200', 'over_200'])
    .optional(),
});

const getAllProductsPublic = async (req, res, next) => {
  try {
    // Validate query parameters
    const validatedQuery = publicQuerySchema.parse(req.query);
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      category,
      minPrice,
      maxPrice,
      featured,
      onSale,
      inStock,
      variationType,
      tags,
      priceRange,
    } = validatedQuery;

    // Build MongoDB filter query (only show active products to public)
    const filter = {
      isActive: true, // Only show active products
    };

    // Search functionality (public-safe fields only)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filters
    if (priceRange) {
      switch (priceRange) {
        case 'under_25':
          filter.price = { $lt: 25 };
          break;
        case '25_50':
          filter.price = { $gte: 25, $lt: 50 };
          break;
        case '50_100':
          filter.price = { $gte: 50, $lt: 100 };
          break;
        case '100_200':
          filter.price = { $gte: 100, $lt: 200 };
          break;
        case 'over_200':
          filter.price = { $gte: 200 };
          break;
      }
    } else {
      // Custom price range
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
      }
    }

    // Featured filter
    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    // On sale filter (has discount)
    if (onSale !== undefined) {
      if (onSale) {
        filter.discountPrice = { $exists: true, $ne: null, $gt: 0 };
      }
    }

    // In stock filter
    if (inStock !== undefined && inStock) {
      filter.$or = [
        { hasVariants: false, stock: { $gt: 0 } },
        { hasVariants: true, 'variants.stock': { $gt: 0 } },
      ];
    }

    // Variant type filter
    if (variationType) {
      filter.variationType = variationType;
      filter.hasVariants = true;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .slice(0, 10); // Limit to 10 tags
      filter.tags = { $in: tagArray };
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'popularity') {
      sort.views = sortOrder;
    } else if (sortBy === 'rating') {
      sort.averageRating = sortOrder;
    } else if (sortBy === 'featured') {
      sort.isFeatured = -1; // Featured first
      sort.createdAt = -1; // Then by newest
    } else {
      sort[sortBy] = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    console.log('Public products filter:', JSON.stringify(filter, null, 2));
    console.log('Public products sort:', sort);

    // Execute queries in parallel
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug') // Limited category info
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(
          // Only select public-safe fields
          'name description images price discountPrice category tags ' +
            'hasVariants variants isFeatured averageRating totalReviews ' +
            'views metaTitle metaDescription createdAt',
        )
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Transform products for public consumption
    const publicProducts = products.map(product => {
      // Calculate effective price (use discount price if available)
      const effectivePrice = product.discountPrice || product.price;

      // Calculate discount percentage
      const discountPercentage =
        product.discountPrice && product.price
          ? Math.round(
              ((product.price - product.discountPrice) / product.price) * 100,
            )
          : 0;

      // Calculate stock availability for variants
      let isInStock = false;
      let hasMultipleOptions = false;
      let priceRange = null;

      if (
        product.hasVariants &&
        product.variants &&
        product.variants.length > 0
      ) {
        // Filter only active variants with stock
        const availableVariants = product.variants.filter(
          variant => variant.isActive !== false && variant.stock > 0,
        );

        isInStock = availableVariants.length > 0;
        hasMultipleOptions = availableVariants.length > 1;

        // Calculate price range for variants
        if (availableVariants.length > 0) {
          const variantPrices = availableVariants.map(
            v => v.discountPrice || v.price || product.price,
          );
          const minVariantPrice = Math.min(...variantPrices);
          const maxVariantPrice = Math.max(...variantPrices);

          if (minVariantPrice !== maxVariantPrice) {
            priceRange = {
              min: minVariantPrice,
              max: maxVariantPrice,
            };
          }
        }

        // Transform variants for public (remove sensitive data)
        product.variants = availableVariants.map(variant => ({
          _id: variant._id,
          color: variant.color,
          size: variant.size,
          price: variant.price,
          discountPrice: variant.discountPrice,
          images: variant.images || [],
          isAvailable: variant.stock > 0,
        }));
      } else {
        // For non-variant products, check main stock
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
        variants: product.variants || [],
        isFeatured: product.isFeatured,
        isInStock,
        hasMultipleOptions,
        priceRange,
        averageRating: product.averageRating || 0,
        totalReviews: product.totalReviews || 0,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        createdAt: product.createdAt,
      };
    });

    // Calculate filter statistics for frontend
    const filterStats = await Promise.all([
      Product.countDocuments({ ...filter, isFeatured: true }),
      Product.countDocuments({
        ...filter,
        discountPrice: { $exists: true, $ne: null, $gt: 0 },
      }),
      Product.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
      ]),
    ]);

    const [featuredCount, onSaleCount, priceStats] = filterStats;

    res.status(200).json({
      message: 'Products retrieved successfully',
      data: {
        products: publicProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
        },
        filters: {
          applied:
            Object.keys(req.query).filter(
              key => !['page', 'limit', 'sortBy', 'sortOrder'].includes(key),
            ).length > 0
              ? req.query
              : null,
          stats: {
            featured: featuredCount,
            onSale: onSaleCount,
            priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 },
          },
          options: {
            sortBy: [
              'name',
              'price',
              'createdAt',
              'popularity',
              'rating',
              'featured',
            ],
            priceRanges: [
              { key: 'under_25', label: 'Under $25' },
              { key: '25_50', label: '$25 - $50' },
              { key: '50_100', label: '$50 - $100' },
              { key: '100_200', label: '$100 - $200' },
              { key: 'over_200', label: 'Over $200' },
            ],
          },
        },
      },
    });
  } catch (error) {
    console.error('Get public products error:', error);

    // Handle Zod validation errors
    const zodErrors = formatZodError(error);
    if (zodErrors) {
      return res.status(400).json({
        message: 'Invalid search parameters',
        errors: zodErrors,
      });
    }

    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(500).json({
        message: 'Search temporarily unavailable',
      });
    }

    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid search format',
      });
    }

    // Pass other errors to error handling middleware
    next(error);
  }
};

export default getAllProductsPublic;
