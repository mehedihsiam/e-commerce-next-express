import { z } from 'zod';
import Coupon from './Cupon.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for creating coupon
const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(20, 'Coupon code cannot exceed 20 characters')
    .regex(
      /^[A-Z0-9]+$/,
      'Coupon code can only contain uppercase letters and numbers',
    ),
  name: z
    .string()
    .min(1, 'Coupon name is required')
    .max(100, 'Coupon name cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  discountType: z.enum(['flat', 'percent'], {
    errorMap: () => ({
      message: 'Discount type must be either flat or percent',
    }),
  }),
  discountValue: z
    .number()
    .min(0, 'Discount value cannot be negative')
    .refine((value, ctx) => {
      if (ctx.parent.discountType === 'percent' && value > 100) {
        return false;
      }
      return true;
    }, 'Percentage discount cannot exceed 100%'),
  minPurchase: z
    .number()
    .min(0, 'Minimum purchase amount cannot be negative')
    .default(0),
  maxDiscount: z
    .number()
    .min(0, 'Maximum discount cannot be negative')
    .optional()
    .nullable(),
  startDate: z
    .string()
    .datetime()
    .optional()
    .transform(str => (str ? new Date(str) : new Date())),
  expiresAt: z
    .string()
    .datetime()
    .transform(str => new Date(str))
    .refine(date => date > new Date(), 'Expiration date must be in the future'),
  usageLimit: z
    .number()
    .int()
    .min(1, 'Usage limit must be at least 1')
    .optional()
    .nullable(),
  applicableCategories: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'))
    .optional()
    .default([]),
  applicableProducts: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'))
    .optional()
    .default([]),
  userRestrictions: z
    .object({
      firstTimeOnly: z.boolean().default(false),
      specificUsers: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'))
        .optional()
        .default([]),
    })
    .optional()
    .default({}),
});

const createCoupon = async (req, res) => {
  try {
    // Validate input
    const validationResult = createCouponSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      startDate,
      expiresAt,
      usageLimit,
      applicableCategories,
      applicableProducts,
      userRestrictions,
    } = validationResult.data;

    // Additional validations
    if (startDate >= expiresAt) {
      return res.status(400).json({
        message: 'Start date must be before expiration date',
      });
    }

    if (discountType === 'flat' && maxDiscount) {
      return res.status(400).json({
        message: 'Maximum discount is only applicable for percentage discounts',
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(409).json({
        message: 'Coupon code already exists',
      });
    }

    // Create coupon
    const couponData = {
      code: code.toUpperCase(),
      name,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount: discountType === 'percent' ? maxDiscount : null,
      startDate,
      expiresAt,
      usageLimit,
      applicableCategories,
      applicableProducts,
      userRestrictions,
      createdBy: req.user.id,
    };

    const coupon = new Coupon(couponData);
    await coupon.save();

    // Populate creator info for response
    await coupon.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
        startDate: coupon.startDate,
        expiresAt: coupon.expiresAt,
        usageLimit: coupon.usageLimit,
        usageCount: coupon.usageCount,
        isActive: coupon.isActive,
        isExpired: coupon.isExpired,
        isValid: coupon.isValid,
        remainingUses: coupon.remainingUses,
        applicableCategories: coupon.applicableCategories,
        applicableProducts: coupon.applicableProducts,
        userRestrictions: coupon.userRestrictions,
        createdBy: coupon.createdBy,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create coupon error:', error);

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
        message: 'Coupon code already exists',
      });
    }

    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default createCoupon;
