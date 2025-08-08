import Order from './Order.model.js';

const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      customerType,
      startDate,
      endDate,
      sortBy = 'placedAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query['payment.status'] = paymentStatus;
    }

    if (customerType) {
      query.customerType = customerType;
    }

    if (startDate || endDate) {
      query.placedAt = {};
      if (startDate) {
        query.placedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.placedAt.$lte = new Date(endDate);
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate([
        {
          path: 'user',
          select: 'name email phone',
        },
        {
          path: 'items.product',
          select: 'name slug images',
        },
      ])
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Calculate summary statistics
    const [statusStats, revenueStats] = await Promise.all([
      // Status distribution
      Order.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Revenue statistics
      Order.aggregate([
        { $match: { ...query, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.total' },
            averageOrderValue: { $avg: '$pricing.total' },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      ...order,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      customerName: order.user?.name || order.shippingAddress.fullName,
      customerEmail: order.user?.email || order.guestEmail,
      ageInDays: Math.floor(
        (new Date() - new Date(order.placedAt)) / (1000 * 60 * 60 * 24),
      ),
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
        summary: {
          statusDistribution: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          revenue: revenueStats[0] || {
            totalRevenue: 0,
            averageOrderValue: 0,
            totalOrders: 0,
          },
        },
      },
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getAllOrders;
