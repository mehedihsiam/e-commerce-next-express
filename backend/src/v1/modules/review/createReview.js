import { z } from 'zod';
import Review from './Review.model.js';
import Order from '../order/Order.model.js';
import Product from '../product/Product.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for creating review
const createReviewSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  title: z
    .string()
    .trim()
    .min(5, 'Review title must be at least 5 characters')
    .max(100, 'Review title cannot exceed 100 characters'),
  comment: z
    .string()
    .trim()
    .min(10, 'Review comment must be at least 10 characters')
    .max(1000, 'Review comment cannot exceed 1000 characters'),
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL'),
        alt: z
          .string()
          .max(100, 'Image alt text cannot exceed 100 characters')
          .optional(),
      }),
    )
    .max(5, 'Maximum 5 images allowed')
    .optional()
    .default([]),
});

const createReview = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const validationResult = createReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const { productId, rating, title, comment, images } = validationResult.data;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    // Check if user can review this product
    const reviewEligibility = await Review.canUserReviewProduct(
      userId,
      productId,
    );
    if (!reviewEligibility.canReview) {
      return res.status(400).json({
        message: reviewEligibility.reason,
      });
    }

    // Create review
    const reviewData = {
      product: productId,
      user: userId,
      order: reviewEligibility.orderId,
      rating,
      title,
      comment,
      images: images || [],
      status: 'pending', // All reviews need admin approval
    };

    const review = new Review(reviewData);
    await review.save();

    // Populate user info for response
    await review.populate('user', 'firstName lastName');
    await review.populate('product', 'name');

    res.status(201).json({
      message: 'Review submitted successfully and is pending admin approval',
      review: {
        id: review._id,
        product: {
          id: review.product._id,
          name: review.product.name,
        },
        user: {
          id: review.user._id,
          name: `${review.user.firstName} ${review.user.lastName}`,
        },
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        status: review.status,
        isVerifiedPurchase: review.isVerifiedPurchase,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    console.error('Create review error:', error);

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

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You have already reviewed this product',
      });
    }

    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default createReview;
