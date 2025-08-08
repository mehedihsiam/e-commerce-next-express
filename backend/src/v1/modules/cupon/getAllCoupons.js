import { z } from 'zod';
import Coupon from './Cupon.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for query parameters
const getCouponsQuerySchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val))
    .pipe(z.number().int().min(1))
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val))
    .pipe(z.number().int().min(1).max(100))
    .default('10'),
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive', 'expired']).default('all'),
  discountType: z.enum(['all', 'flat', 'percent']).default('all'),
  sortBy: z
    .enum(['createdAt', 'expiresAt', 'code', 'usageCount'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const getAllCoupons = async (req, res) => {
  try {
    // Validate query parameters
    const validationResult = getCouponsQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: formatZodError(validationResult.error),
      });
    }

    const { page, limit, search, status, discountType, sortBy, sortOrder } =
      validationResult.data;

    // Build filter object
    const filter = {};

    // Search filter (code, name, or description)
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    const now = new Date();
    switch (status) {
      case 'active':
        filter.isActive = true;
        filter.expiresAt = { $gt: now };
        break;
      case 'inactive':
        filter.isActive = false;
        break;
      case 'expired':
        filter.expiresAt = { $lte: now };
        break;
      // 'all' - no additional filter
    }

    // Discount type filter
    if (discountType !== 'all') {
      filter.discountType = discountType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [coupons, totalCoupons] = await Promise.all([
      Coupon.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('applicableCategories', 'name')
        .populate('applicableProducts', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    // Add computed fields to coupons
    const enrichedCoupons = coupons.map(coupon => ({
      ...coupon,
      isExpired: coupon.expiresAt < now,
      isValid:
        coupon.isActive &&
        coupon.expiresAt > now &&
        (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit),
      remainingUses: coupon.usageLimit
        ? Math.max(0, coupon.usageLimit - coupon.usageCount)
        : 'Unlimited',
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCoupons / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary statistics
    const stats = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $gt: ['$expiresAt', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          expiredCoupons: {
            $sum: {
              $cond: [{ $lte: ['$expiresAt', now] }, 1, 0],
            },
          },
          totalUsage: { $sum: '$usageCount' },
        },
      },
    ]);

    res.status(200).json({
      message: 'Coupons retrieved successfully',
      coupons: enrichedCoupons,
      pagination: {
        currentPage: page,
        totalPages,
        totalCoupons,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      statistics: stats[0] || {
        totalCoupons: 0,
        activeCoupons: 0,
        expiredCoupons: 0,
        totalUsage: 0,
      },
      filters: {
        search,
        status,
        discountType,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getAllCoupons;
