import Review from './Review.model.js';

const checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Validate product ID
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid product ID',
      });
    }

    // Check if user can review this product
    const eligibility = await Review.canUserReviewProduct(userId, productId);

    res.status(200).json({
      message: 'Review eligibility checked',
      canReview: eligibility.canReview,
      reason: eligibility.reason || null,
      orderId: eligibility.orderId || null,
    });
  } catch (error) {
    console.error('Check review eligibility error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default checkReviewEligibility;
