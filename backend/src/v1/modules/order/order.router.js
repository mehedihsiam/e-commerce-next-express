import express from 'express';
import verifyToken from '../../middlewares/verifyToken.js';
import verifyAdmin from '../../middlewares/verifyAdmin.js';
import verifyAdminOrModerator from '../../middlewares/verifyAdminOrModerator.js';

// Import order controllers
import placeOrder from './placeOrder.js';
import getUserOrders from './getUserOrders.js';
import getOrderDetails from './getOrderDetails.js';
import cancelOrder from './cancelOrder.js';
import trackOrder from './trackOrder.js';
import getAllOrders from './getAllOrders.js';
import updateOrderStatus from './updateOrderStatus.js';
import getOrderAnalytics from './getOrderAnalytics.js';

const orderRouter = express.Router();

// Public routes (with optional authentication)
orderRouter.get('/track/:orderNumber', trackOrder); // GET /orders/track/:orderNumber - Track order (public)

// Customer routes (authentication required)
orderRouter.use(verifyToken); // All routes below require authentication

orderRouter.post('/', placeOrder); // POST /orders - Place new order
orderRouter.get('/my-orders', getUserOrders); // GET /orders/my-orders - Get user's orders
orderRouter.get('/:orderNumber', getOrderDetails); // GET /orders/:orderNumber - Get order details
orderRouter.patch('/:orderNumber/cancel', cancelOrder); // PATCH /orders/:orderNumber/cancel - Cancel order

// Admin routes (admin/moderator access required)
orderRouter.get('/', verifyAdminOrModerator, getAllOrders); // GET /orders - Get all orders (admin)
orderRouter.put(
  '/:orderNumber/status',
  verifyAdminOrModerator,
  updateOrderStatus,
); // PUT /orders/:orderNumber/status - Update order status
orderRouter.get('/analytics/summary', verifyAdmin, getOrderAnalytics); // GET /orders/analytics/summary - Order analytics

export default orderRouter;
