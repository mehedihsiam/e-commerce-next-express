import { z } from 'zod';
import Order from './Order.model.js';
import formatZodError from '../../utils/formatZodError.js';

const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(1, 'Cancellation reason is required')
    .max(500, 'Reason must be less than 500 characters'),
});

const cancelOrder = async (req, res) => {
  try {
    // Validate input
    const validationResult = cancelOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const { reason } = validationResult.data;
    const { orderNumber } = req.params;
    const userId = req.user.id;

    // Find the order
    const order = await Order.findOne({
      orderNumber,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled) {
      return res.status(400).json({
        message: `Cannot cancel order in "${order.status}" status`,
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();

    // Add tracking entry
    order.tracking.push({
      status: 'cancelled',
      note: `Order cancelled by customer. Reason: ${reason}`,
      timestamp: new Date(),
    });

    // If payment was made, mark for refund
    if (['completed', 'processing'].includes(order.payment.status)) {
      order.payment.status = 'refunded';
      order.payment.refundedAt = new Date();
      order.payment.refundAmount = order.pricing.total;
    }

    await order.save();

    // TODO: Restore product stock
    // TODO: Send cancellation email
    // TODO: Process refund if payment was made

    res.status(200).json({
      message: 'Order cancelled successfully',
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        cancellationReason: order.cancellationReason,
        refundInfo:
          order.payment.status === 'refunded'
            ? {
                amount: order.payment.refundAmount,
                refundedAt: order.payment.refundedAt,
              }
            : null,
      },
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default cancelOrder;
