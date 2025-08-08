import { z } from 'zod';
import Category from './Category.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for query parameters
const getCategoriesSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .refine(val => val > 0, 'Page must be a positive number'),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  parent: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID format')
    .optional(),
  search: z.string().trim().optional(),
  includeChildren: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default('false'),
});

const getCategories = async (req, res, next) => {
  try {
    // Validate query parameters
    const validatedQuery = getCategoriesSchema.parse(req.query);
    const { page, limit, parent, search, includeChildren } = validatedQuery;

    // Build filter object
    const filter = {};

    // Filter by parent category
    if (parent !== undefined) {
      filter.parent = parent;
    }

    // Search by name
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'categories',
          localField: 'parent',
          foreignField: '_id',
          as: 'parentCategory',
        },
      },
      {
        $addFields: {
          parent: { $arrayElemAt: ['$parentCategory', 0] },
        },
      },
      {
        $project: {
          parentCategory: 0,
        },
      },
    ];

    // Add children lookup if requested
    if (includeChildren) {
      pipeline.push({
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parent',
          as: 'children',
          pipeline: [
            {
              $project: {
                name: 1,
                slug: 1,
                _id: 1,
              },
            },
          ],
        },
      });
    }

    // Add sorting, skip, and limit
    pipeline.push({ $sort: { name: 1 } }, { $skip: skip }, { $limit: limit });

    // Execute aggregation
    const categories = await Category.aggregate(pipeline);

    // Get total count for pagination
    const totalCount = await Category.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      message: 'Categories retrieved successfully',
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    // Handle Zod validation errors
    const zodErrors = formatZodError(error);
    if (zodErrors) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: zodErrors,
      });
    }

    // Pass other errors to the error handling middleware
    next(error);
  }
};

export default getCategories;
