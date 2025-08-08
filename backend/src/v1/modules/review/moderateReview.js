import { z } from 'zod';
import Review from './Review.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for review moderation
const moderateReviewSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be either approve or reject' }),
  }),
  notes: z
    .string()
    .trim()
    .max(500, 'Admin notes cannot exceed 500 characters')
    .optional()
    .default(''),
});

const moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Validate review ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid review ID',
      });
    }

    // Validate input
    const validationResult = moderateReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const { action, notes } = validationResult.data;

    // Find review
    const review = await Review.findById(id)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name');

    if (!review) {
      return res.status(404).json({
        message: 'Review not found',
      });
    }

    // Check if review is already processed
    if (review.status !== 'pending') {
      return res.status(400).json({
        message: `Review has already been ${review.status}`,
        currentStatus: review.status,
      });
    }

    // Moderate review
    let updatedReview;
    if (action === 'approve') {
      updatedReview = await review.approve(adminId, notes);
    } else {
      updatedReview = await review.reject(adminId, notes);
    }

    // Populate for response
    await updatedReview.populate('approvedBy', 'firstName lastName');

    res.status(200).json({
      message: `Review ${action}d successfully`,
      review: {
        id: updatedReview._id,
        product: {
          id: updatedReview.product._id,
          name: updatedReview.product.name,
        },
        user: {
          id: updatedReview.user._id,
          name: `${updatedReview.user.firstName} ${updatedReview.user.lastName}`,
          email: updatedReview.user.email,
        },
        rating: updatedReview.rating,
        title: updatedReview.title,
        comment: updatedReview.comment,
        status: updatedReview.status,
        adminNotes: updatedReview.adminNotes,
        moderatedBy: {
          id: updatedReview.approvedBy._id,
          name: `${updatedReview.approvedBy.firstName} ${updatedReview.approvedBy.lastName}`,
        },
        createdAt: updatedReview.createdAt,
        moderatedAt:
          action === 'approve'
            ? updatedReview.approvedAt
            : updatedReview.rejectedAt,
      },
    });
  } catch (error) {
    console.error('Moderate review error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid review ID',
      });
    }

    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default moderateReview;
