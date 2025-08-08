import express from 'express';
import verifyToken from '../../middlewares/verifyToken.js';
import verifyAdmin from '../../middlewares/verifyAdmin.js';
import createReview from './createReview.js';
import getProductReviews from './getProductReviews.js';
import getUserReviews from './getUserReviews.js';
import getAllReviews from './getAllReviews.js';
import moderateReview from './moderateReview.js';
import checkReviewEligibility from './checkReviewEligibility.js';

const router = express.Router();

// Public routes - Get product reviews
router.get('/product/:productId', getProductReviews);

// Protected routes - Require authentication
router.use(verifyToken);

// User routes
router.post('/', createReview); // Create review
router.get('/my-reviews', getUserReviews); // Get user's own reviews
router.get('/eligibility/:productId', checkReviewEligibility); // Check if user can review product

// Admin routes
router.use(verifyAdmin); // All routes below require admin access

// Admin: Get all reviews with moderation tools
router.get('/', getAllReviews);

// Admin: Moderate review (approve/reject)
router.patch('/:id/moderate', moderateReview);

export default router;
