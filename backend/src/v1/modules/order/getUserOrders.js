import Order from './Order.model.js';

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'placedAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .populate([
        {
          path: 'items.product',
          select: 'name slug images category',
        },
      ])
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      ...order,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      canBeCancelled: ['pending', 'confirmed', 'processing'].includes(
        order.status,
      ),
      canBeReturned:
        order.status === 'delivered' &&
        Math.floor(
          (new Date() - new Date(order.placedAt)) / (1000 * 60 * 60 * 24),
        ) <= 7,
    }));

    res.status(200).json({
      message: 'Orders retrieved successfully',
      data: {
        orders: formattedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getUserOrders;
