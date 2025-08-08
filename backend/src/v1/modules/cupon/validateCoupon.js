import { z } from 'zod';
import Coupon from './Cupon.model.js';
import Order from '../order/Order.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for coupon validation
const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  subtotal: z.number().min(0, 'Subtotal must be a positive number'),
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')
    .optional(),
});

const validateCoupon = async (req, res) => {
  try {
    // Validate input
    const validationResult = validateCouponSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const { code, subtotal, userId } = validationResult.data;

    // Find coupon
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        message: 'Invalid coupon code',
        valid: false,
      });
    }

    // Get user order count if userId provided (for first-time user validation)
    let userOrderCount = 0;
    if (userId) {
      userOrderCount = await Order.countDocuments({
        user: userId,
        status: { $ne: 'cancelled' },
      });
    }

    // Validate coupon for the order
    const validation = coupon.validateForOrder(
      subtotal,
      userId,
      userOrderCount,
    );

    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.errors[0], // Return first error
        valid: false,
        errors: validation.errors,
      });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(subtotal);
    const finalAmount = Math.max(0, subtotal - discountAmount);

    res.status(200).json({
      message: 'Coupon is valid',
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
        remainingUses: coupon.remainingUses,
      },
      calculation: {
        subtotal,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100,
        savings: Math.round(discountAmount * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      message: 'Internal server error',
      valid: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default validateCoupon;
