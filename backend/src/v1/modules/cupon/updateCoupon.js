import { z } from 'zod';
import Coupon from './Cupon.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for updating coupon
const updateCouponSchema = z.object({
  name: z
    .string()
    .min(1, 'Coupon name is required')
    .max(100, 'Coupon name cannot exceed 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  discountValue: z
    .number()
    .min(0, 'Discount value cannot be negative')
    .optional(),
  minPurchase: z
    .number()
    .min(0, 'Minimum purchase amount cannot be negative')
    .optional(),
  maxDiscount: z
    .number()
    .min(0, 'Maximum discount cannot be negative')
    .optional()
    .nullable(),
  expiresAt: z
    .string()
    .datetime()
    .transform(str => new Date(str))
    .refine(date => date > new Date(), 'Expiration date must be in the future')
    .optional(),
  usageLimit: z
    .number()
    .int()
    .min(1, 'Usage limit must be at least 1')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
  applicableCategories: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'))
    .optional(),
  applicableProducts: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'))
    .optional(),
  userRestrictions: z
    .object({
      firstTimeOnly: z.boolean().optional(),
      specificUsers: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'))
        .optional(),
    })
    .optional(),
});

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid coupon ID',
      });
    }

    // Validate input
    const validationResult = updateCouponSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const updateData = validationResult.data;

    // Find existing coupon
    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({
        message: 'Coupon not found',
      });
    }

    // Additional validations based on existing coupon data
    if (updateData.discountValue !== undefined) {
      if (
        existingCoupon.discountType === 'percent' &&
        updateData.discountValue > 100
      ) {
        return res.status(400).json({
          message: 'Percentage discount cannot exceed 100%',
        });
      }
    }

    if (updateData.maxDiscount !== undefined) {
      if (existingCoupon.discountType === 'flat' && updateData.maxDiscount) {
        return res.status(400).json({
          message:
            'Maximum discount is only applicable for percentage discounts',
        });
      }
    }

    if (updateData.usageLimit !== undefined) {
      if (
        updateData.usageLimit &&
        updateData.usageLimit < existingCoupon.usageCount
      ) {
        return res.status(400).json({
          message: 'Usage limit cannot be less than current usage count',
        });
      }
    }

    // Update coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'name');

    if (!updatedCoupon) {
      return res.status(404).json({
        message: 'Coupon not found',
      });
    }

    res.status(200).json({
      message: 'Coupon updated successfully',
      coupon: {
        id: updatedCoupon._id,
        code: updatedCoupon.code,
        name: updatedCoupon.name,
        description: updatedCoupon.description,
        discountType: updatedCoupon.discountType,
        discountValue: updatedCoupon.discountValue,
        minPurchase: updatedCoupon.minPurchase,
        maxDiscount: updatedCoupon.maxDiscount,
        startDate: updatedCoupon.startDate,
        expiresAt: updatedCoupon.expiresAt,
        usageLimit: updatedCoupon.usageLimit,
        usageCount: updatedCoupon.usageCount,
        isActive: updatedCoupon.isActive,
        isExpired: updatedCoupon.isExpired,
        isValid: updatedCoupon.isValid,
        remainingUses: updatedCoupon.remainingUses,
        applicableCategories: updatedCoupon.applicableCategories,
        applicableProducts: updatedCoupon.applicableProducts,
        userRestrictions: updatedCoupon.userRestrictions,
        createdBy: updatedCoupon.createdBy,
        createdAt: updatedCoupon.createdAt,
        updatedAt: updatedCoupon.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update coupon error:', error);

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
        message: 'Invalid coupon ID',
      });
    }

    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default updateCoupon;
