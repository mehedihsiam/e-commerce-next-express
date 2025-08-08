import Order from './Order.model.js';

const getOrderAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      period = 'daily', // daily, weekly, monthly
      status,
    } = req.query;

    // Set default date range (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const queryStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const queryEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // Build base query
    const baseQuery = {
      placedAt: {
        $gte: queryStartDate,
        $lte: queryEndDate,
      },
    };

    if (status) {
      baseQuery.status = status;
    }

    // Get overall statistics
    const [overallStats, statusDistribution, revenueByPeriod] =
      await Promise.all([
        // Overall statistics
        Order.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: '$pricing.total' },
              averageOrderValue: { $avg: '$pricing.total' },
              totalItems: { $sum: { $sum: '$items.quantity' } },
              totalCustomers: {
                $addToSet: { $ifNull: ['$user', '$guestEmail'] },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalOrders: 1,
              totalRevenue: { $round: ['$totalRevenue', 2] },
              averageOrderValue: { $round: ['$averageOrderValue', 2] },
              totalItems: 1,
              uniqueCustomers: { $size: '$totalCustomers' },
            },
          },
        ]),

        // Status distribution
        Order.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              revenue: { $sum: '$pricing.total' },
            },
          },
          {
            $project: {
              _id: 0,
              status: '$_id',
              orderCount: '$count',
              revenue: { $round: ['$revenue', 2] },
            },
          },
        ]),

        // Revenue by time period
        Order.aggregate([
          { $match: { ...baseQuery, status: { $ne: 'cancelled' } } },
          {
            $group: {
              _id: getDateGrouping(period),
              orders: { $sum: 1 },
              revenue: { $sum: '$pricing.total' },
              averageOrderValue: { $avg: '$pricing.total' },
            },
          },
          {
            $project: {
              _id: 0,
              period: '$_id',
              orders: 1,
              revenue: { $round: ['$revenue', 2] },
              averageOrderValue: { $round: ['$averageOrderValue', 2] },
            },
          },
          { $sort: { period: 1 } },
        ]),
      ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      { $match: { ...baseQuery, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.lineTotal' },
          orderCount: { $sum: 1 },
          productName: { $first: '$items.productSnapshot.name' },
        },
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: 1,
          totalQuantity: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderCount: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    // Get payment method distribution
    const paymentMethods = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$payment.method',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
        },
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          orderCount: '$count',
          revenue: { $round: ['$revenue', 2] },
        },
      },
    ]);

    // Get customer type distribution
    const customerTypes = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$customerType',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
        },
      },
      {
        $project: {
          _id: 0,
          type: '$_id',
          orderCount: '$count',
          revenue: { $round: ['$revenue', 2] },
        },
      },
    ]);

    // Calculate conversion rates and trends
    const previousPeriodStart = new Date(queryStartDate);
    const periodDiff = queryEndDate - queryStartDate;
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDiff);

    const previousPeriodStats = await Order.aggregate([
      {
        $match: {
          placedAt: {
            $gte: previousPeriodStart,
            $lt: queryStartDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
        },
      },
    ]);

    // Calculate growth rates
    const currentStats = overallStats[0] || { totalOrders: 0, totalRevenue: 0 };
    const prevStats = previousPeriodStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
    };

    const orderGrowthRate =
      prevStats.totalOrders > 0
        ? ((currentStats.totalOrders - prevStats.totalOrders) /
            prevStats.totalOrders) *
          100
        : 0;

    const revenueGrowthRate =
      prevStats.totalRevenue > 0
        ? ((currentStats.totalRevenue - prevStats.totalRevenue) /
            prevStats.totalRevenue) *
          100
        : 0;

    res.status(200).json({
      message: 'Order analytics retrieved successfully',
      data: {
        dateRange: {
          startDate: queryStartDate,
          endDate: queryEndDate,
          period,
        },
        overall: {
          ...currentStats,
          orderGrowthRate: Math.round(orderGrowthRate * 100) / 100,
          revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
        },
        statusDistribution,
        revenueByPeriod,
        topProducts,
        paymentMethods,
        customerTypes,
      },
    });
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Helper function to get date grouping based on period
const getDateGrouping = period => {
  switch (period) {
    case 'daily':
      return {
        year: { $year: '$placedAt' },
        month: { $month: '$placedAt' },
        day: { $dayOfMonth: '$placedAt' },
      };
    case 'weekly':
      return {
        year: { $year: '$placedAt' },
        week: { $week: '$placedAt' },
      };
    case 'monthly':
      return {
        year: { $year: '$placedAt' },
        month: { $month: '$placedAt' },
      };
    default:
      return {
        year: { $year: '$placedAt' },
        month: { $month: '$placedAt' },
        day: { $dayOfMonth: '$placedAt' },
      };
  }
};

export default getOrderAnalytics;
