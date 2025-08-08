# 📦 Backend Developer Guide - Order Module

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Controllers](#controllers)
5. [Business Logic](#business-logic)
6. [Validation & Error Handling](#validation--error-handling)
7. [Security Considerations](#security-considerations)
8. [Performance Optimization](#performance-optimization)
9. [Testing Guidelines](#testing-guidelines)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Order module handles the complete order lifecycle from placement to delivery, supporting both registered users and guest customers with comprehensive order management, tracking, and analytics.

### 🎯 Key Features

- ✅ Order placement from cart with validation
- ✅ Multi-status order tracking with timeline
- ✅ Support for both registered and guest customers
- ✅ Comprehensive pricing breakdown with coupons
- ✅ Multiple payment methods and shipping options
- ✅ Admin order management and status updates
- ✅ Order analytics and reporting
- ✅ Automated inventory management
- ✅ Order cancellation and return handling

---

## Architecture

### 📁 File Structure

```
src/v1/modules/order/
├── Order.model.js              # Mongoose schema and model
├── order.router.js             # Express router configuration
├── placeOrder.js               # Place new order controller
├── getUserOrders.js            # Get user's orders with pagination
├── getOrderDetails.js          # Get specific order details
├── cancelOrder.js              # Cancel order controller
├── trackOrder.js               # Order tracking controller
├── getAllOrders.js             # Admin - get all orders
├── updateOrderStatus.js        # Admin - update order status
├── getOrderAnalytics.js        # Admin - order analytics
├── BACKEND_GUIDE.md            # This file
└── FRONTEND_API_GUIDE.md       # API documentation for frontend
```

### 🔄 Data Flow

```
Cart → Validation → Order Creation → Payment → Inventory Update → Tracking
  ↓         ↓            ↓           ↓           ↓              ↓
User    Stock Check   Order Save   Process   Stock Reduce   Status Update
```

---

## Database Schema

### 🗄️ Order Model Structure

```javascript
// Main order document
{
  // Identification
  orderNumber: String,           // Unique order identifier

  // Customer information
  user: ObjectId,                // Reference to User (null for guests)
  guestEmail: String,            // Guest customer email
  guestPhone: String,            // Guest customer phone
  customerType: String,          // 'registered' | 'guest'

  // Order items with snapshots
  items: [OrderItemSchema],      // Array of ordered items

  // Addresses
  shippingAddress: AddressSchema, // Shipping details
  billingAddress: AddressSchema,  // Billing details (optional)
  sameAsBilling: Boolean,        // Use shipping as billing

  // Payment information
  payment: PaymentInfoSchema,    // Payment details and status

  // Order status and tracking
  status: String,                // Current order status
  tracking: [TrackingSchema],    // Status change history

  // Pricing breakdown
  pricing: {
    subtotal: Number,            // Items total
    itemDiscount: Number,        // Item-level discounts
    couponDiscount: Number,      // Coupon discount
    shippingCost: Number,        // Shipping cost
    tax: Number,                 // Tax amount
    total: Number               // Final total
  },

  // Coupon information
  coupon: CouponAppliedSchema,   // Applied coupon details

  // Shipping information
  shipping: ShippingInfoSchema,  // Shipping method and tracking

  // Metadata
  notes: String,                 // Customer notes
  adminNotes: String,           // Internal admin notes
  source: String,               // Order source (web, mobile, admin)
  sessionId: String,            // Session tracking

  // Timestamps for different stages
  placedAt: Date,               // Order placed
  confirmedAt: Date,            // Order confirmed
  shippedAt: Date,              // Order shipped
  deliveredAt: Date,            // Order delivered
  cancelledAt: Date,            // Order cancelled
  returnedAt: Date              // Order returned
}

// Order item subdocument
{
  product: ObjectId,            // Reference to Product
  quantity: Number,             // Ordered quantity
  variant: VariantSchema,       // Product variant details
  price: Number,                // Price at time of order
  discountPrice: Number,        // Discount price at time of order
  effectivePrice: Number,       // Final item price
  lineTotal: Number,            // Item total (price * quantity)
  productSnapshot: {            // Product info snapshot
    name: String,               // Product name
    image: String,              // Product image
    category: String,           // Category name
    slug: String                // Product slug
  }
}

// Tracking subdocument
{
  status: String,               // Status at this point
  updatedBy: ObjectId,          // User who made the change
  note: String,                 // Optional note
  timestamp: Date               // When status changed
}
```

### 🔗 Relationships

- **User ↔ Order**: One-to-Many (user can have multiple orders)
- **Order ↔ OrderItem**: One-to-Many (order contains multiple items)
- **OrderItem ↔ Product**: Many-to-One (items reference products)
- **Order ↔ Coupon**: Many-to-One (orders can use coupons)

### 📊 Indexes

```javascript
// Performance indexes
{ user: 1 }                    // User orders lookup
{ orderNumber: 1 }             // Order number lookup
{ status: 1 }                  // Status filtering
{ placedAt: -1 }               // Recent orders
{ guestEmail: 1 }              // Guest order lookup
{ 'payment.status': 1 }        // Payment status filtering
{ 'shipping.trackingNumber': 1 } // Tracking lookup
```

---

## Controllers

### 🎯 Controller Overview

#### **placeOrder.js**

- **Purpose**: Convert cart to order with validation and payment processing
- **Validation**: Cart validation, stock checking, coupon application
- **Business Logic**: Inventory updates, cart conversion, order creation

```javascript
// Key validation flow
1. Validate cart items and stock
2. Apply shipping and coupon discounts
3. Create order with payment info
4. Update product inventory
5. Clear cart and mark as converted
```

#### **getUserOrders.js**

- **Purpose**: Retrieve user's orders with pagination and filtering
- **Features**: Status filtering, pagination, order summary
- **Response**: Formatted orders with calculated fields

#### **getOrderDetails.js**

- **Purpose**: Get complete order information
- **Features**: Full order data with tracking, items, and calculations
- **Security**: User isolation, admin override

#### **cancelOrder.js**

- **Purpose**: Cancel orders with reason tracking
- **Validation**: Cancellation eligibility, status validation
- **Business Logic**: Refund processing, inventory restoration

#### **trackOrder.js**

- **Purpose**: Public order tracking with timeline
- **Features**: Status milestones, estimated delivery, tracking info
- **Response**: Formatted tracking timeline with progress indicators

#### **getAllOrders.js** (Admin)

- **Purpose**: Admin order management with filtering
- **Features**: Advanced search, status analytics, bulk operations
- **Response**: Orders with admin metadata and statistics

#### **updateOrderStatus.js** (Admin)

- **Purpose**: Admin order status management
- **Validation**: Status transition rules, required fields
- **Business Logic**: Automated timestamp updates, refund processing

#### **getOrderAnalytics.js** (Admin)

- **Purpose**: Order analytics and reporting
- **Features**: Revenue analysis, trend calculation, top products
- **Response**: Comprehensive analytics with growth metrics

---

## Business Logic

### 🔄 Order Placement Flow

#### **Cart to Order Conversion**

```javascript
// Order placement logic
1. Validate user authentication (or guest info)
2. Retrieve and validate cart contents
3. Check product availability and stock
4. Calculate pricing with discounts and shipping
5. Apply coupon if provided
6. Create order record
7. Process payment (if not COD)
8. Update product inventory
9. Clear cart and mark as converted
10. Send confirmation notifications
```

#### **Stock Management**

```javascript
// Inventory update logic
const updateInventory = async orderItems => {
  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (product.hasVariants && item.variant.variantId) {
      const variant = product.getVariantById(item.variant.variantId);
      variant.stock -= item.quantity;
    } else {
      product.stock -= item.quantity;
    }

    await product.save();
  }
};
```

#### **Coupon Application**

```javascript
// Coupon discount calculation
const applyCoupon = (subtotal, coupon) => {
  if (subtotal < coupon.minPurchase) {
    throw new Error('Minimum purchase not met');
  }

  let discount = 0;
  if (coupon.discountType === 'percent') {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }

  return discount;
};
```

### 📊 Order Status Management

#### **Status Transitions**

```javascript
const validTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['returned'],
  cancelled: [], // Terminal state
  returned: [], // Terminal state
};
```

#### **Automated Status Updates**

```javascript
// Pre-save middleware for status tracking
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    // Add tracking entry
    this.tracking.push({
      status: this.status,
      timestamp: new Date(),
      note: `Status updated to ${this.status}`,
    });

    // Set appropriate timestamps
    switch (this.status) {
      case 'confirmed':
        this.confirmedAt = new Date();
        break;
      case 'shipped':
        this.shippedAt = new Date();
        break;
      case 'delivered':
        this.deliveredAt = new Date();
        break;
    }
  }
  next();
});
```

### 💰 Pricing Calculations

#### **Total Calculation**

```javascript
const calculateOrderTotal = (items, shipping, couponDiscount, tax) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.effectivePrice * item.quantity,
    0,
  );

  const total = subtotal - couponDiscount + shipping + tax;

  return {
    subtotal,
    couponDiscount,
    shippingCost: shipping,
    tax,
    total,
  };
};
```

---

## Validation & Error Handling

### 🔍 Input Validation

#### **Order Placement Schema**

```javascript
const placeOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('Bangladesh'),
  }),
  paymentMethod: z.enum(['cash_on_delivery', 'bkash', 'nagad', 'rocket']),
  shippingMethod: z.enum(['standard', 'express', 'overnight']),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});
```

#### **Business Rule Validation**

```javascript
// Order cancellation validation
const validateCancellation = order => {
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new Error(`Cannot cancel order in "${order.status}" status`);
  }
};

// Stock availability validation
const validateStock = (product, variant, quantity) => {
  const availableStock = variant ? variant.stock : product.stock;
  if (product.trackInventory && availableStock < quantity) {
    throw new Error(`Insufficient stock. Only ${availableStock} available`);
  }
};
```

### 🚨 Error Categories

#### **Order Placement Errors**

```javascript
// Stock insufficient
{
  message: 'Insufficient stock for "iPhone 15 Pro". Only 3 available',
  availableStock: 3,
  requestedQuantity: 5
}

// Invalid coupon
{
  message: 'Coupon has expired',
  couponCode: 'SAVE20',
  expiryDate: '2024-01-01'
}
```

#### **Order Management Errors**

```javascript
// Invalid status transition
{
  message: 'Cannot change status from "delivered" to "processing"',
  currentStatus: 'delivered',
  requestedStatus: 'processing',
  validTransitions: ['returned']
}
```

---

## Security Considerations

### 🔐 Data Protection

#### **User Isolation**

```javascript
// Ensure users can only access their own orders
const getUserOrder = async (orderNumber, userId) => {
  return await Order.findOne({
    orderNumber,
    user: userId,
  });
};
```

#### **Guest Order Security**

```javascript
// Guest order validation
const validateGuestAccess = (order, guestEmail) => {
  if (order.customerType === 'guest' && order.guestEmail !== guestEmail) {
    throw new Error('Unauthorized access to order');
  }
};
```

### 🛡️ Payment Security

#### **Payment Method Validation**

```javascript
// Validate payment method
const validatePaymentMethod = method => {
  const allowedMethods = ['cash_on_delivery', 'bkash', 'nagad', 'rocket'];
  if (!allowedMethods.includes(method)) {
    throw new Error('Invalid payment method');
  }
};
```

### 🔍 Audit Trail

```javascript
// Order activity logging
const logOrderActivity = (orderNumber, action, userId, details) => {
  console.log({
    timestamp: new Date(),
    orderNumber,
    action,
    userId,
    details,
    ip: req.ip,
  });
};
```

---

## Performance Optimization

### ⚡ Database Optimization

#### **Efficient Queries**

```javascript
// Optimized order retrieval with selective population
const getOrdersOptimized = async (userId, page, limit) => {
  return await Order.find({ user: userId })
    .populate({
      path: 'items.product',
      select: 'name slug images category',
    })
    .select('-tracking -adminNotes') // Exclude heavy fields
    .sort({ placedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(); // Return plain objects for better performance
};
```

#### **Aggregation for Analytics**

```javascript
// Efficient revenue calculation
const getRevenueStats = async (startDate, endDate) => {
  return await Order.aggregate([
    {
      $match: {
        placedAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.total' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.total' },
      },
    },
  ]);
};
```

### 🔄 Caching Strategy

#### **Order Summary Caching**

```javascript
// Cache frequently accessed order summaries
const getCachedOrderSummary = async userId => {
  const cacheKey = `order_summary_${userId}`;
  let summary = await cache.get(cacheKey);

  if (!summary) {
    summary = await calculateOrderSummary(userId);
    await cache.set(cacheKey, summary, 300); // 5 minutes
  }

  return summary;
};
```

---

## Testing Guidelines

### 🧪 Unit Tests

#### **Order Model Testing**

```javascript
describe('Order Model', () => {
  test('should generate unique order number', async () => {
    const order = new Order({
      user: userId,
      items: [testItem],
      shippingAddress: testAddress,
      pricing: { total: 100 },
    });

    await order.save();

    expect(order.orderNumber).toMatch(/^ORD-\d+-\d{3}$/);
  });

  test('should calculate total correctly', () => {
    const order = new Order(testOrderData);
    const total = order.calculateTotal();

    expect(total).toBe(expectedTotal);
  });
});
```

#### **Controller Testing**

```javascript
describe('placeOrder Controller', () => {
  test('should place order successfully', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validOrderData);

    expect(response.status).toBe(201);
    expect(response.body.data.order.orderNumber).toBeDefined();
  });

  test('should handle insufficient stock', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send(insufficientStockOrderData);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Insufficient stock');
  });
});
```

### 🔄 Integration Tests

#### **Order Workflow Testing**

```javascript
describe('Order Workflow', () => {
  test('complete order lifecycle', async () => {
    // Place order
    const placeResponse = await placeOrder(orderData);
    expect(placeResponse.status).toBe(201);

    // Update status to confirmed
    const confirmResponse = await updateOrderStatus(
      placeResponse.data.orderNumber,
      'confirmed',
    );
    expect(confirmResponse.status).toBe(200);

    // Track order
    const trackResponse = await trackOrder(placeResponse.data.orderNumber);
    expect(trackResponse.data.currentStatus).toBe('confirmed');
  });
});
```

---

## Troubleshooting

### 🔍 Common Issues

#### **Order Placement Failures**

```javascript
// Debug stock issues
const debugStockIssue = async (productId, variantId, quantity) => {
  const product = await Product.findById(productId);
  console.log({
    productStock: product.stock,
    variantStock: variantId ? product.getVariantById(variantId)?.stock : null,
    requestedQuantity: quantity,
    trackInventory: product.trackInventory,
  });
};
```

#### **Payment Status Inconsistencies**

```javascript
// Check payment status
const validatePaymentStatus = order => {
  console.log({
    paymentMethod: order.payment.method,
    paymentStatus: order.payment.status,
    orderStatus: order.status,
    transactionId: order.payment.transactionId,
  });
};
```

#### **Status Transition Errors**

```javascript
// Debug status transitions
const debugStatusTransition = (order, newStatus) => {
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    // ... other transitions
  };

  console.log({
    currentStatus: order.status,
    requestedStatus: newStatus,
    validTransitions: validTransitions[order.status],
    isValidTransition: validTransitions[order.status]?.includes(newStatus),
  });
};
```

### 📊 Monitoring

#### **Order Metrics**

```javascript
// Key metrics to monitor
const orderMetrics = {
  orderPlacementRate: 'Orders per hour/day',
  paymentSuccessRate: 'Successful payments / total attempts',
  averageOrderValue: 'Total revenue / order count',
  orderFulfillmentTime: 'Average time from order to delivery',
  cancellationRate: 'Cancelled orders / total orders',
  returnRate: 'Returned orders / delivered orders',
};
```

#### **Health Checks**

```javascript
// Order system health
const orderHealthCheck = async () => {
  const recentOrders = await Order.countDocuments({
    placedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  const pendingPayments = await Order.countDocuments({
    'payment.status': 'pending',
  });

  return {
    status: 'healthy',
    recentOrders,
    pendingPayments,
    timestamp: new Date(),
  };
};
```

---

**🎯 Best Practices Summary:**

1. **Always validate cart** before order placement
2. **Update inventory** immediately after order confirmation
3. **Implement proper status transitions** with validation
4. **Log all order activities** for audit trail
5. **Handle payment failures** gracefully
6. **Monitor order metrics** for business insights
7. **Test order workflows** thoroughly
8. **Implement proper error handling** and recovery

Happy coding! 🚀
