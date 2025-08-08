import { z } from 'zod';
import Review from './Review.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for query parameters
const getUserReviewsSchema = z.object({
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
  status: z.enum(['all', 'pending', 'approved', 'rejected']).default('all'),
  sortBy: z.enum(['createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate query parameters
    const validationResult = getUserReviewsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: formatZodError(validationResult.error),
      });
    }

    const { page, limit, status, sortBy, sortOrder } = validationResult.data;

    // Build filter
    const filter = { user: userId };

    // Add status filter if not 'all'
    if (status !== 'all') {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get reviews and total count
    const [reviews, totalReviews] = await Promise.all([
      Review.find(filter)
        .populate('product', 'name images price')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalReviews / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format reviews for response
    const formattedReviews = reviews.map(review => ({
      id: review._id,
      product: {
        id: review.product._id,
        name: review.product.name,
        image: review.product.images?.[0]?.url || null,
        price: review.product.price,
      },
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      status: review.status,
      isVerifiedPurchase: review.isVerifiedPurchase,
      helpfulVotes: review.helpfulVotes,
      adminNotes: review.adminNotes || null,
      createdAt: review.createdAt,
      approvedAt: review.approvedAt || null,
      rejectedAt: review.rejectedAt || null,
    }));

    // Get summary statistics
    const statusCounts = await Review.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statistics = {
      total: totalReviews,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    statusCounts.forEach(item => {
      statistics[item._id] = item.count;
    });

    res.status(200).json({
      message: 'User reviews retrieved successfully',
      reviews: formattedReviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      statistics,
      filters: {
        status,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getUserReviews;
