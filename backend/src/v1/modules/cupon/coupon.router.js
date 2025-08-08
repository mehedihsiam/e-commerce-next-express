import express from 'express';
import verifyToken from '../../middlewares/verifyToken.js';
import verifyAdmin from '../../middlewares/verifyAdmin.js';
import createCoupon from './createCoupon.js';
import getAllCoupons from './getAllCoupons.js';
import getCouponById from './getCouponById.js';
import updateCoupon from './updateCoupon.js';
import deleteCoupon from './deleteCoupon.js';
import validateCoupon from './validateCoupon.js';

const router = express.Router();

// Public route - validate coupon (used during checkout)
router.post('/validate', validateCoupon);

// Admin only routes
router.use(verifyToken, verifyAdmin); // All routes below require admin access

// Get all coupons with filtering and pagination
router.get('/', getAllCoupons);

// Get single coupon by ID
router.get('/:id', getCouponById);

// Create new coupon
router.post('/', createCoupon);

// Update coupon
router.patch('/:id', updateCoupon);

// Delete coupon
router.delete('/:id', deleteCoupon);

export default router;
