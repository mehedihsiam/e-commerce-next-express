import Order from './Order.model.js';

const getOrderDetails = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.user?.id;

    // Build query - users can only see their own orders, admins can see all
    const query = { orderNumber };

    // If not admin, restrict to user's orders
    if (userId && !req.user.role.includes('admin')) {
      query.user = userId;
    }

    const order = await Order.findOne(query).populate([
      {
        path: 'items.product',
        select: 'name slug images category price discountPrice',
      },
      {
        path: 'user',
        select: 'name email phone',
      },
    ]);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Calculate additional order info
    const orderInfo = {
      ...order.toObject(),
      itemCount: order.totalItems,
      canBeCancelled: order.canBeCancelled,
      canBeReturned: order.canBeReturned,
      currentTracking: order.currentTracking,
      ageInDays: order.ageInDays,
    };

    res.status(200).json({
      message: 'Order details retrieved successfully',
      data: {
        order: orderInfo,
      },
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getOrderDetails;
