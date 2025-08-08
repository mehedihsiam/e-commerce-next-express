import Order from './Order.model.js';

const trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.user?.id;

    // Build query - allow tracking by order number for both users and guests
    const query = { orderNumber };

    // If user is logged in and not admin, restrict to their orders
    if (userId && !req.user.role?.includes('admin')) {
      query.user = userId;
    }

    const order = await Order.findOne(query)
      .select(
        'orderNumber status tracking placedAt confirmedAt shippedAt deliveredAt cancelledAt returnedAt shipping pricing',
      )
      .lean();

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Format tracking information
    const trackingInfo = {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      placedAt: order.placedAt,
      estimatedDelivery: order.shipping?.estimatedDelivery,
      actualDelivery: order.shipping?.actualDelivery,
      trackingNumber: order.shipping?.trackingNumber,
      carrier: order.shipping?.carrier,

      // Timeline of status changes
      timeline: order.tracking.map(track => ({
        status: track.status,
        timestamp: track.timestamp,
        note: track.note,
        isComplete: true,
      })),

      // Status milestones
      milestones: [
        {
          status: 'pending',
          label: 'Order Placed',
          timestamp: order.placedAt,
          isComplete: true,
          description: 'Your order has been received and is being processed',
        },
        {
          status: 'confirmed',
          label: 'Order Confirmed',
          timestamp: order.confirmedAt,
          isComplete: !!order.confirmedAt,
          description: 'Your order has been confirmed and is being prepared',
        },
        {
          status: 'processing',
          label: 'Processing',
          timestamp: order.tracking.find(t => t.status === 'processing')
            ?.timestamp,
          isComplete: [
            'processing',
            'shipped',
            'out_for_delivery',
            'delivered',
          ].includes(order.status),
          description: 'Your order is being prepared for shipment',
        },
        {
          status: 'shipped',
          label: 'Shipped',
          timestamp: order.shippedAt,
          isComplete: ['shipped', 'out_for_delivery', 'delivered'].includes(
            order.status,
          ),
          description: 'Your order has been shipped and is on its way',
        },
        {
          status: 'out_for_delivery',
          label: 'Out for Delivery',
          timestamp: order.tracking.find(t => t.status === 'out_for_delivery')
            ?.timestamp,
          isComplete: ['out_for_delivery', 'delivered'].includes(order.status),
          description: 'Your order is out for delivery',
        },
        {
          status: 'delivered',
          label: 'Delivered',
          timestamp: order.deliveredAt,
          isComplete: order.status === 'delivered',
          description: 'Your order has been delivered successfully',
        },
      ].filter(milestone => {
        // Filter out milestones that don't apply to cancelled/returned orders
        if (order.status === 'cancelled') {
          return ['pending', 'confirmed'].includes(milestone.status);
        }
        return true;
      }),

      // Current step in the process
      currentStep: getCurrentStep(order.status),
      totalSteps: order.status === 'cancelled' ? 2 : 6,

      // Order summary
      summary: {
        totalAmount: order.pricing?.total,
        itemCount: order.items?.length || 0,
        status: order.status,
        canBeCancelled: ['pending', 'confirmed', 'processing'].includes(
          order.status,
        ),
      },
    };

    // Add cancellation info if order is cancelled
    if (order.status === 'cancelled') {
      trackingInfo.milestones.push({
        status: 'cancelled',
        label: 'Order Cancelled',
        timestamp: order.cancelledAt,
        isComplete: true,
        description: 'Your order has been cancelled',
      });
      trackingInfo.currentStep = trackingInfo.milestones.length;
    }

    // Add return info if order is returned
    if (order.status === 'returned') {
      trackingInfo.milestones.push({
        status: 'returned',
        label: 'Order Returned',
        timestamp: order.returnedAt,
        isComplete: true,
        description: 'Your order has been returned',
      });
    }

    res.status(200).json({
      message: 'Order tracking information retrieved successfully',
      data: trackingInfo,
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Helper function to get current step number
const getCurrentStep = status => {
  const stepMap = {
    pending: 1,
    confirmed: 2,
    processing: 3,
    shipped: 4,
    out_for_delivery: 5,
    delivered: 6,
    cancelled: 'cancelled',
    returned: 'returned',
  };

  return stepMap[status] || 1;
};

export default trackOrder;
