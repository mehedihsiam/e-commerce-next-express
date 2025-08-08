import Coupon from './Cupon.model.js';

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid coupon ID',
      });
    }

    // Find and check if coupon exists
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        message: 'Coupon not found',
      });
    }

    // Check if coupon has been used
    if (coupon.usageCount > 0) {
      return res.status(400).json({
        message:
          'Cannot delete coupon that has been used. You can deactivate it instead.',
        suggestion: 'Set isActive to false to deactivate the coupon',
      });
    }

    // Delete coupon
    await Coupon.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Coupon deleted successfully',
      deletedCoupon: {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
      },
    });
  } catch (error) {
    console.error('Delete coupon error:', error);

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

export default deleteCoupon;
