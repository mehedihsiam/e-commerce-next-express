import { z } from 'zod';
import Review from './Review.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for query parameters
const getAllReviewsSchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val))
    .pipe(z.number().int().min(1))
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val))
    .pipe(z.number().int().min(1).max(100))
    .default('20'),
  status: z.enum(['all', 'pending', 'approved', 'rejected']).default('all'),
  sortBy: z.enum(['createdAt', 'rating', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

const getAllReviews = async (req, res) => {
  try {
    // Validate query parameters
    const validationResult = getAllReviewsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: formatZodError(validationResult.error),
      });
    }

    const { page, limit, status, sortBy, sortOrder, search } =
      validationResult.data;

    // Build filter
    const filter = {};

    // Add status filter if not 'all'
    if (status !== 'all') {
      filter.status = status;
    }

    // Add search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get reviews and total count
    const [reviews, totalReviews] = await Promise.all([
      Review.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('product', 'name images')
        .populate('approvedBy', 'firstName lastName')
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
      },
      user: {
        id: review.user._id,
        name: `${review.user.firstName} ${review.user.lastName}`,
        email: review.user.email,
      },
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      status: review.status,
      isVerifiedPurchase: review.isVerifiedPurchase,
      helpfulVotes: review.helpfulVotes,
      reportCount: review.reportCount,
      adminNotes: review.adminNotes || null,
      approvedBy: review.approvedBy
        ? {
            id: review.approvedBy._id,
            name: `${review.approvedBy.firstName} ${review.approvedBy.lastName}`,
          }
        : null,
      createdAt: review.createdAt,
      approvedAt: review.approvedAt || null,
      rejectedAt: review.rejectedAt || null,
    }));

    // Get summary statistics
    const statistics = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const stats = {
      total: totalReviews,
      pending: 0,
      approved: 0,
      rejected: 0,
      averageRating: 0,
    };

    statistics.forEach(stat => {
      stats[stat._id] = stat.count;
      if (stat._id === 'approved') {
        stats.averageRating = Math.round(stat.avgRating * 10) / 10;
      }
    });

    res.status(200).json({
      message: 'Reviews retrieved successfully',
      reviews: formattedReviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      statistics: stats,
      filters: {
        status,
        search,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getAllReviews;
