import { z } from 'zod';
import Review from './Review.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for query parameters
const getProductReviewsSchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val))
    .pipe(z.number().int().min(1))
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val))
    .pipe(z.number().int().min(1).max(50))
    .default('10'),
  sortBy: z.enum(['createdAt', 'rating', 'helpfulVotes']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  rating: z
    .string()
    .transform(val => parseInt(val))
    .pipe(z.number().int().min(1).max(5))
    .optional(),
});

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid product ID',
      });
    }

    // Validate query parameters
    const validationResult = getProductReviewsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: formatZodError(validationResult.error),
      });
    }

    const { page, limit, sortBy, sortOrder, rating } = validationResult.data;

    // Build filter
    const filter = {
      product: productId,
      status: 'approved',
    };

    // Add rating filter if specified
    if (rating) {
      filter.rating = rating;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get reviews and total count
    const [reviews, totalReviews, reviewStats] = await Promise.all([
      Review.find(filter)
        .populate('user', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
      Review.getProductReviewStats(productId),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalReviews / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format reviews for response
    const formattedReviews = reviews.map(review => ({
      id: review._id,
      user: {
        name: `${review.user.firstName} ${review.user.lastName}`,
      },
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      isVerifiedPurchase: review.isVerifiedPurchase,
      helpfulVotes: review.helpfulVotes,
      createdAt: review.createdAt,
      isRecent:
        (Date.now() - new Date(review.createdAt).getTime()) /
          (1000 * 60 * 60 * 24) <=
        30,
    }));

    res.status(200).json({
      message: 'Product reviews retrieved successfully',
      reviews: formattedReviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      statistics: reviewStats,
      filters: {
        rating,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getProductReviews;
