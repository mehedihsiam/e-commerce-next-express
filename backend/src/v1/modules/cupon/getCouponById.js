import Coupon from './Cupon.model.js';

const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid coupon ID',
      });
    }

    // Find coupon
    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'name');

    if (!coupon) {
      return res.status(404).json({
        message: 'Coupon not found',
      });
    }

    res.status(200).json({
      message: 'Coupon retrieved successfully',
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
    console.error('Get coupon error:', error);

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

export default getCouponById;
