import { z } from 'zod';
import Order from './Order.model.js';
import formatZodError from '../../utils/formatZodError.js';

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'returned',
  ]),
  note: z.string().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  cancelReason: z.string().optional(),
  returnReason: z.string().optional(),
});

const updateOrderStatus = async (req, res) => {
  try {
    // Validate input
    const validationResult = updateOrderStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const {
      status,
      note,
      trackingNumber,
      carrier,
      cancelReason,
      returnReason,
    } = validationResult.data;
    const { orderNumber } = req.params;
    const adminUserId = req.user.id;

    // Find the order
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['out_for_delivery', 'delivered'],
      out_for_delivery: ['delivered'],
      delivered: ['returned'],
      cancelled: [], // No transitions from cancelled
      returned: [], // No transitions from returned
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from "${order.status}" to "${status}"`,
      });
    }

    // Update order status
    const previousStatus = order.status;
    order.status = status;

    // Add tracking entry
    const trackingEntry = {
      status,
      updatedBy: adminUserId,
      note:
        note ||
        `Status updated from "${previousStatus}" to "${status}" by admin`,
      timestamp: new Date(),
    };
    order.tracking.push(trackingEntry);

    // Handle specific status updates
    switch (status) {
      case 'shipped':
        if (trackingNumber) {
          order.shipping.trackingNumber = trackingNumber;
        }
        if (carrier) {
          order.shipping.carrier = carrier;
        }
        order.shippedAt = new Date();
        break;

      case 'delivered':
        order.deliveredAt = new Date();
        order.shipping.actualDelivery = new Date();
        // Mark payment as completed for COD orders
        if (order.payment.method === 'cash_on_delivery') {
          order.payment.status = 'completed';
          order.payment.paidAt = new Date();
        }
        break;

      case 'cancelled':
        order.cancelledAt = new Date();
        if (cancelReason) {
          order.cancellationReason = cancelReason;
        }
        // Handle refund for paid orders
        if (['completed', 'processing'].includes(order.payment.status)) {
          order.payment.status = 'refunded';
          order.payment.refundedAt = new Date();
          order.payment.refundAmount = order.pricing.total;
        }
        break;

      case 'returned':
        order.returnedAt = new Date();
        if (returnReason) {
          order.returnReason = returnReason;
        }
        // Process refund
        order.payment.status = 'refunded';
        order.payment.refundedAt = new Date();
        order.payment.refundAmount = order.pricing.total;
        break;

      case 'confirmed':
        order.confirmedAt = new Date();
        break;
    }

    await order.save();

    // TODO: Send notification email to customer
    // TODO: Update inventory for cancelled/returned orders
    // TODO: Process actual refund for payment gateway

    // Populate order for response
    await order.populate([
      {
        path: 'user',
        select: 'name email phone',
      },
      {
        path: 'tracking.updatedBy',
        select: 'name email',
      },
    ]);

    res.status(200).json({
      message: `Order status updated to "${status}" successfully`,
      data: {
        order: {
          orderNumber: order.orderNumber,
          previousStatus,
          currentStatus: order.status,
          tracking: order.tracking,
          shippingInfo: order.shipping,
          timestamps: {
            placedAt: order.placedAt,
            confirmedAt: order.confirmedAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            cancelledAt: order.cancelledAt,
            returnedAt: order.returnedAt,
          },
        },
      },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default updateOrderStatus;
