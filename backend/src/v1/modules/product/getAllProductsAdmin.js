import { z } from 'zod';
import Product from './Product.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for query parameters
const querySchema = z.object({
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
      val => !isNaN(val) && val > 0 && val <= 100,
      'Limit must be between 1 and 100',
    )
    .optional()
    .default('10'),

  // Sorting
  sortBy: z
    .enum([
      'name',
      'price',
      'stock',
      'createdAt',
      'updatedAt',
      'category',
      'isFeatured',
      'isActive',
      'discountPrice',
      'sales',
      'views',
    ])
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc', '1', '-1'])
    .transform(val => (val === 'asc' || val === '1' ? 1 : -1))
    .optional()
    .default(-1),

  // Filtering
  search: z.string().trim().optional(), // Search in name, description, tags
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
  minStock: z
    .string()
    .transform(val => parseInt(val))
    .refine(
      val => !isNaN(val) && val >= 0,
      'Min stock must be a positive number',
    )
    .optional(),
  maxStock: z
    .string()
    .transform(val => parseInt(val))
    .refine(
      val => !isNaN(val) && val >= 0,
      'Max stock must be a positive number',
    )
    .optional(),
  isActive: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  isFeatured: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  hasVariants: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  hasDiscount: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  lowStock: z
    .string()
    .transform(val => val === 'true')
    .optional(), // Products with stock below threshold
  outOfStock: z
    .string()
    .transform(val => val === 'true')
    .optional(), // Products with 0 stock
  variationType: z
    .enum(['none', 'color', 'size', 'color_size', 'custom'])
    .optional(),
  tags: z.string().optional(), // Comma-separated tags
  dateFrom: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO 8601 format.' })
    .optional(),
  dateTo: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO 8601 format.' })
    .optional(),
});

const getAllProductsAdmin = async (req, res, next) => {
  try {
    // Validate query parameters
    const validatedQuery = querySchema.parse(req.query);
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      category,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      isActive,
      isFeatured,
      hasVariants,
      hasDiscount,
      lowStock,
      outOfStock,
      variationType,
      tags,
      dateFrom,
      dateTo,
    } = validatedQuery;

    // Build MongoDB filter query
    const filter = {};

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Stock range filter
    if (minStock !== undefined || maxStock !== undefined) {
      filter.stock = {};
      if (minStock !== undefined) filter.stock.$gte = minStock;
      if (maxStock !== undefined) filter.stock.$lte = maxStock;
    }

    // Boolean filters
    if (isActive !== undefined) filter.isActive = isActive;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (hasVariants !== undefined) filter.hasVariants = hasVariants;
    if (variationType) filter.variationType = variationType;

    // Discount filter
    if (hasDiscount !== undefined) {
      if (hasDiscount) {
        filter.discountPrice = { $exists: true, $ne: null, $gt: 0 };
      } else {
        filter.$or = [
          { discountPrice: { $exists: false } },
          { discountPrice: null },
          { discountPrice: 0 },
        ];
      }
    }

    // Stock status filters
    if (outOfStock) {
      filter.stock = 0;
    } else if (lowStock) {
      // Products where stock is below lowStockThreshold or default threshold of 10
      filter.$expr = {
        $lt: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }],
      };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    console.log('Admin products filter:', JSON.stringify(filter, null, 2));
    console.log('Admin products sort:', sort);

    // Execute queries in parallel for better performance
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug description image')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance since we're just reading
      Product.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Enhanced products with calculated fields
    const enhancedProducts = products.map(product => {
      // Calculate total variant stock
      const totalVariantStock =
        product.variants?.reduce(
          (sum, variant) => sum + (variant.stock || 0),
          0,
        ) || 0;

      // Calculate effective stock (main stock + variant stock)
      const effectiveStock = product.hasVariants
        ? totalVariantStock
        : product.stock || 0;

      // Calculate discount percentage
      const discountPercentage =
        product.discountPrice && product.price
          ? Math.round(
              ((product.price - product.discountPrice) / product.price) * 100,
            )
          : 0;

      // Stock status
      const stockStatus =
        effectiveStock === 0
          ? 'out_of_stock'
          : effectiveStock <= (product.lowStockThreshold || 10)
            ? 'low_stock'
            : 'in_stock';

      // Active variants count
      const activeVariantsCount =
        product.variants?.filter(v => v.isActive !== false).length || 0;

      return {
        ...product,
        effectiveStock,
        totalVariantStock,
        discountPercentage,
        stockStatus,
        activeVariantsCount,
        hasImages: product.images && product.images.length > 0,
        variantImagesCount:
          product.variants?.reduce(
            (sum, variant) => sum + (variant.images?.length || 0),
            0,
          ) || 0,
      };
    });

    // Calculate statistics for the current filter
    const stats = {
      totalProducts: totalCount,
      activeProducts: await Product.countDocuments({
        ...filter,
        isActive: true,
      }),
      featuredProducts: await Product.countDocuments({
        ...filter,
        isFeatured: true,
      }),
      outOfStockProducts: await Product.countDocuments({
        ...filter,
        $or: [
          { stock: 0 },
          { hasVariants: true, 'variants.0': { $exists: false } },
        ],
      }),
      lowStockProducts: await Product.countDocuments({
        ...filter,
        $expr: {
          $lt: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }],
        },
      }),
      productsWithDiscount: await Product.countDocuments({
        ...filter,
        discountPrice: { $exists: true, $ne: null, $gt: 0 },
      }),
    };

    res.status(200).json({
      message: 'Products retrieved successfully',
      data: {
        products: enhancedProducts,
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
          applied: Object.keys(req.query).length > 0 ? req.query : null,
          available: {
            sortBy: [
              'name',
              'price',
              'stock',
              'createdAt',
              'updatedAt',
              'category',
              'isFeatured',
              'isActive',
            ],
            sortOrder: ['asc', 'desc'],
            variationType: ['none', 'color', 'size', 'color_size', 'custom'],
          },
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Get all products admin error:', error);

    // Handle Zod validation errors
    const zodErrors = formatZodError(error);
    if (zodErrors) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: zodErrors,
      });
    }

    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(400).json({
        message: 'Database query error',
        error: error.message,
      });
    }

    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid parameter format',
        error: `Invalid ${error.path}: ${error.value}`,
      });
    }

    // Pass other errors to error handling middleware
    next(error);
  }
};

export default getAllProductsAdmin;
