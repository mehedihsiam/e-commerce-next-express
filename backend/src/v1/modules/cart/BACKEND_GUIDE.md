# 🛒 Backend Developer Guide - Cart Module

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

The Cart module provides comprehensive shopping cart functionality for the e-commerce platform, supporting:

- **Multi-variant Products**: Handle products with different colors, sizes, and custom attributes
- **Real-time Validation**: Automatic stock checking and price synchronization
- **Smart Cart Management**: Automatic cleanup of invalid items and price updates
- **Session Persistence**: Cart data persists across user sessions
- **Performance Optimized**: Efficient queries and calculated totals

### 🎯 Key Features

- ✅ Add/Remove items with variant support
- ✅ Real-time stock validation
- ✅ Automatic price synchronization
- ✅ Cart totals calculation
- ✅ Item validation and cleanup
- ✅ User-specific cart isolation
- ✅ Cart abandonment tracking

---

## Architecture

### 📁 File Structure

```
src/v1/modules/cart/
├── Cart.model.js           # Mongoose schema and model
├── cart.router.js          # Express router configuration
├── addToCart.js            # Add item to cart controller
├── getCart.js              # Retrieve cart with validation
├── updateCartItem.js       # Update item quantity
├── removeFromCart.js       # Remove specific item
├── clearCart.js            # Clear entire cart
├── getCartSummary.js       # Get cart totals only
├── validateCart.js         # Validate cart contents
├── BACKEND_GUIDE.md        # This file
└── FRONTEND_API_GUIDE.md   # API documentation for frontend
```

### 🔄 Data Flow

```
Client Request → Authentication → Validation → Business Logic → Database → Response
                     ↓               ↓             ↓            ↓
                 verifyToken → Zod Schema → Stock Check → MongoDB → JSON Response
```

---

## Database Schema

### 🗄️ Cart Model Structure

```javascript
// Main cart document (one per user)
{
  user: ObjectId,              // Reference to User
  items: [CartItemSchema],     // Array of cart items
  totals: {                    // Calculated totals
    itemCount: Number,
    subtotal: Number,
    totalDiscount: Number,
    finalTotal: Number
  },
  status: String,              // 'active', 'processing', 'converted', 'abandoned'
  sessionId: String,           // Session tracking
  lastActivity: Date,          // For abandonment detection
  convertedAt: Date,           // When converted to order
  abandonedAt: Date            // When marked as abandoned
}

// Cart item subdocument
{
  product: ObjectId,           // Reference to Product
  quantity: Number,            // Item quantity
  variant: {                   // Product variant details
    variantId: ObjectId,       // Specific variant ID
    color: String,             // Variant color
    size: String,              // Variant size
    sku: String                // SKU for quick reference
  },
  price: Number,               // Price at time of adding
  discountPrice: Number,       // Discount price at time of adding
  effectivePrice: Number,      // Final price used for calculations
  productSnapshot: {           // Product info snapshot
    name: String,              // Product name
    image: String,             // Primary image URL
    category: String           // Category name
  },
  addedAt: Date,               // When added to cart
  updatedAt: Date              // Last updated
}
```

### 🔗 Relationships

- **User ↔ Cart**: One-to-One (user can have only one active cart)
- **Cart ↔ CartItem**: One-to-Many (cart contains multiple items)
- **CartItem ↔ Product**: Many-to-One (items reference products)
- **CartItem ↔ Variant**: Many-to-One (items reference specific variants)

### 📊 Indexes

```javascript
// Performance indexes
{ user: 1 }                    // Find cart by user
{ sessionId: 1 }               // Session-based lookup
{ status: 1 }                  // Status filtering
{ lastActivity: 1 }            // Abandonment queries
{ 'items.product': 1 }         // Product-based queries
```

---

## Controllers

### 🎯 Controller Overview

#### **addToCart.js**

- **Purpose**: Add items to user's cart with variant support
- **Validation**: Product existence, stock availability, variant validation
- **Business Logic**: Quantity merging, price capture, stock verification

```javascript
// Key validation logic
const product = await Product.findById(productId);
if (product.hasVariants && !variantId) {
  throw new Error('Variant selection required');
}

// Stock checking
if (product.trackInventory && availableStock < quantity) {
  throw new Error(`Insufficient stock`);
}
```

#### **getCart.js**

- **Purpose**: Retrieve cart with real-time validation
- **Features**: Automatic cleanup, price synchronization, stock verification
- **Response**: Cart data with validation issues report

```javascript
// Validation issues detection
const validationIssues = [];
for (const item of cart.items) {
  if (!item.product || !item.product.isActive) {
    validationIssues.push({
      issue: 'product_unavailable',
      action: 'removed',
    });
  }
}
```

#### **updateCartItem.js**

- **Purpose**: Update item quantities with stock validation
- **Validation**: Stock availability, product/variant status
- **Business Logic**: Quantity adjustment, stock verification

#### **removeFromCart.js**

- **Purpose**: Remove specific items from cart
- **Features**: Item identification, cart recalculation
- **Response**: Updated cart with removal confirmation

#### **clearCart.js**

- **Purpose**: Empty entire cart
- **Features**: Complete cart reset, summary report
- **Use Cases**: User checkout completion, cart reset

#### **getCartSummary.js**

- **Purpose**: Get cart totals without full item details
- **Performance**: Lightweight response for UI updates
- **Data**: Totals, counts, basic item info

#### **validateCart.js**

- **Purpose**: Comprehensive cart validation
- **Features**: Stock checking, price verification, availability validation
- **Response**: Detailed validation report with issue categorization

---

## Business Logic

### 🔄 Cart Item Management

#### **Adding Items**

```javascript
// Logic flow for adding items
1. Validate product existence and availability
2. Handle variant selection (if applicable)
3. Check stock availability
4. Find existing cart item (same product + variant)
5. Either merge quantities or create new item
6. Store price information at time of adding
7. Calculate and update cart totals
```

#### **Stock Validation**

```javascript
// Multi-level stock checking
const getAvailableStock = (product, variantId) => {
  if (!product.hasVariants) {
    return product.stock;
  }

  const variant = product.getVariantById(variantId);
  return variant ? variant.stock : 0;
};
```

#### **Price Management**

```javascript
// Price capture strategy
const capturePrice = (product, variant) => {
  const basePrice = variant?.price || product.price;
  const discount = variant?.discountPrice || product.discountPrice;

  return {
    price: basePrice,
    discountPrice: discount,
    effectivePrice: discount || basePrice,
  };
};
```

### 📊 Cart Calculations

#### **Automatic Totals**

```javascript
// Pre-save middleware calculates totals
cartSchema.pre('save', function (next) {
  let itemCount = 0;
  let subtotal = 0;
  let totalDiscount = 0;

  this.items.forEach(item => {
    itemCount += item.quantity;
    const itemSubtotal = item.price * item.quantity;
    const itemEffectiveTotal = item.effectivePrice * item.quantity;

    subtotal += itemSubtotal;
    totalDiscount += itemSubtotal - itemEffectiveTotal;
  });

  this.totals = {
    itemCount,
    subtotal,
    totalDiscount,
    finalTotal: subtotal - totalDiscount,
  };

  next();
});
```

### 🔄 Real-time Synchronization

#### **Price Updates**

```javascript
// Detect and handle price changes
const checkPriceChanges = async (cartItem, product, variant) => {
  const currentPrice = variant?.price || product.price;
  const currentDiscount = variant?.discountPrice || product.discountPrice;
  const currentEffective = currentDiscount || currentPrice;

  if (cartItem.effectivePrice !== currentEffective) {
    return {
      type: 'price_changed',
      oldPrice: cartItem.effectivePrice,
      newPrice: currentEffective,
      item: cartItem,
    };
  }

  return null;
};
```

#### **Stock Synchronization**

```javascript
// Handle stock changes
const validateStock = async (cartItem, product, variant) => {
  const availableStock = variant?.stock || product.stock;

  if (availableStock === 0) {
    return { action: 'remove', reason: 'out_of_stock' };
  }

  if (availableStock < cartItem.quantity) {
    return {
      action: 'adjust_quantity',
      newQuantity: availableStock,
      reason: 'insufficient_stock',
    };
  }

  return { action: 'none' };
};
```

---

## Validation & Error Handling

### 🔍 Input Validation

#### **Zod Schemas**

```javascript
// Add to cart validation
const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  variantId: z.string().optional(),
  variant: z
    .object({
      color: z.string().optional(),
      size: z.string().optional(),
    })
    .optional(),
});

// Update quantity validation
const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});
```

#### **Business Rule Validation**

```javascript
// Variant requirement checking
if (product.hasVariants && !variantId && !variant) {
  throw new ValidationError('Variant selection required for this product');
}

// Stock availability
if (product.trackInventory && availableStock < quantity) {
  throw new StockError(`Insufficient stock. Only ${availableStock} available`);
}
```

### 🚨 Error Categories

#### **Validation Errors (400)**

```javascript
{
  message: 'Validation failed',
  errors: [
    {
      field: 'quantity',
      message: 'Quantity must be at least 1',
      value: 0
    }
  ]
}
```

#### **Business Logic Errors (400)**

```javascript
{
  message: 'Insufficient stock',
  error: 'Only 5 items available',
  availableStock: 5,
  requestedQuantity: 10
}
```

#### **Not Found Errors (404)**

```javascript
{
  message: 'Cart not found';
}

{
  message: 'Item not found in cart';
}
```

### 🛡️ Error Handling Middleware

```javascript
// Centralized error handling
const handleCartError = (error, req, res, next) => {
  console.error('Cart operation error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: formatZodError(error),
    });
  }

  if (error.name === 'StockError') {
    return res.status(400).json({
      message: error.message,
      availableStock: error.availableStock,
    });
  }

  res.status(500).json({
    message: 'Internal server error',
  });
};
```

---

## Security Considerations

### 🔐 Authentication & Authorization

#### **User Isolation**

```javascript
// Ensure users can only access their own cart
const cart = await Cart.findOne({ user: req.user.id });
```

#### **Input Sanitization**

```javascript
// Zod validation prevents injection
const validationResult = addToCartSchema.safeParse(req.body);
```

### 🛡️ Data Protection

#### **Price Integrity**

- Store prices at time of adding to cart
- Validate against current prices during checkout
- Log price changes for audit trail

#### **Stock Protection**

- Real-time stock validation
- Optimistic locking for stock updates
- Transaction safety for concurrent operations

### 🔍 Audit Trail

```javascript
// Cart activity logging
const logCartActivity = (userId, action, details) => {
  console.log({
    timestamp: new Date(),
    userId,
    action,
    details,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
};
```

---

## Performance Optimization

### ⚡ Database Optimization

#### **Indexes**

```javascript
// Essential indexes for cart operations
cartSchema.index({ user: 1 }); // User cart lookup
cartSchema.index({ sessionId: 1 }); // Session tracking
cartSchema.index({ lastActivity: 1 }); // Abandonment queries
cartSchema.index({ 'items.product': 1 }); // Product filtering
```

#### **Population Strategy**

```javascript
// Selective population to minimize data transfer
const cart = await Cart.findOne({ user: userId }).populate({
  path: 'items.product',
  select:
    'name slug images price discountPrice isActive hasVariants variants stock',
  populate: {
    path: 'category',
    select: 'name slug',
  },
});
```

### 🔄 Caching Strategy

#### **Cart Totals Caching**

```javascript
// Store calculated totals in database
cartSchema.pre('save', function (next) {
  // Calculate and store totals
  this.totals = calculateTotals(this.items);
  next();
});
```

#### **Product Data Caching**

```javascript
// Cache frequently accessed product data
const getProductCache = async productId => {
  // Implement Redis caching here
  return await Product.findById(productId).lean();
};
```

### 📊 Query Optimization

#### **Efficient Cart Retrieval**

```javascript
// Single query with all necessary data
const getOptimizedCart = async userId => {
  return await Cart.aggregate([
    { $match: { user: new ObjectId(userId) } },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDetails',
      },
    },
    {
      $project: {
        // Select only needed fields
        items: 1,
        totals: 1,
        lastActivity: 1,
        productDetails: 1,
      },
    },
  ]);
};
```

---

## Testing Guidelines

### 🧪 Unit Tests

#### **Model Testing**

```javascript
describe('Cart Model', () => {
  test('should calculate totals correctly', async () => {
    const cart = new Cart({
      user: userId,
      items: [
        {
          product: productId,
          quantity: 2,
          price: 100,
          effectivePrice: 80,
        },
      ],
    });

    await cart.save();

    expect(cart.totals.subtotal).toBe(200);
    expect(cart.totals.totalDiscount).toBe(40);
    expect(cart.totals.finalTotal).toBe(160);
  });
});
```

#### **Controller Testing**

```javascript
describe('addToCart Controller', () => {
  test('should add item to cart successfully', async () => {
    const response = await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: productId,
        quantity: 2,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.cart.items).toHaveLength(1);
  });

  test('should handle insufficient stock', async () => {
    const response = await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: productId,
        quantity: 1000,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Insufficient stock');
  });
});
```

### 🔄 Integration Tests

#### **End-to-End Cart Flow**

```javascript
describe('Cart Flow Integration', () => {
  test('complete cart workflow', async () => {
    // Add item
    const addResponse = await addItemToCart(productId, 2);
    expect(addResponse.status).toBe(200);

    // Get cart
    const getResponse = await getCart();
    expect(getResponse.data.cart.items).toHaveLength(1);

    // Update quantity
    const updateResponse = await updateCartItem(itemId, 3);
    expect(updateResponse.status).toBe(200);

    // Remove item
    const removeResponse = await removeFromCart(itemId);
    expect(removeResponse.status).toBe(200);
    expect(removeResponse.data.cart.items).toHaveLength(0);
  });
});
```

### 📊 Performance Testing

```javascript
describe('Cart Performance', () => {
  test('should handle large cart efficiently', async () => {
    const startTime = Date.now();

    // Add 50 items to cart
    for (let i = 0; i < 50; i++) {
      await addItemToCart(productIds[i], 1);
    }

    const getStartTime = Date.now();
    const cart = await getCart();
    const getEndTime = Date.now();

    expect(getEndTime - getStartTime).toBeLessThan(500); // Under 500ms
    expect(cart.data.cart.items).toHaveLength(50);
  });
});
```

---

## Troubleshooting

### 🔍 Common Issues

#### **Cart Items Disappearing**

```javascript
// Debugging steps
1. Check if products are still active: `product.isActive`
2. Verify variant availability: `variant.isActive`
3. Check stock levels: `product.stock` or `variant.stock`
4. Review cart validation logs

// Prevention
- Implement soft delete for products
- Add proper error logging
- Use transaction for critical operations
```

#### **Price Discrepancies**

```javascript
// Issue: Cart total doesn't match sum of items
// Debug: Check effective price calculation
cart.items.forEach(item => {
  console.log({
    price: item.price,
    discountPrice: item.discountPrice,
    effectivePrice: item.effectivePrice,
    lineTotal: item.effectivePrice * item.quantity,
  });
});

// Solution: Recalculate cart totals
await cart.save(); // Triggers pre-save middleware
```

#### **Stock Validation Failures**

```javascript
// Issue: Users can add items beyond available stock
// Debug: Check product tracking settings
const product = await Product.findById(productId);
console.log({
  trackInventory: product.trackInventory,
  hasVariants: product.hasVariants,
  stock: product.stock,
  variants: product.variants.map(v => ({
    id: v._id,
    stock: v.stock,
    isActive: v.isActive,
  })),
});
```

### 🚨 Error Debugging

#### **Enable Debug Logging**

```javascript
// In development environment
const debugCart = {
  logCartOperation: (operation, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CART DEBUG] ${operation}:`, JSON.stringify(data, null, 2));
    }
  },
};
```

#### **Database Query Debugging**

```javascript
// Enable mongoose debug mode
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}
```

### 📊 Monitoring

#### **Cart Metrics to Track**

```javascript
// Key performance indicators
const cartMetrics = {
  averageCartSize: 'Average number of items per cart',
  cartConversionRate: 'Percentage of carts converted to orders',
  cartAbandonmentRate: 'Percentage of carts abandoned',
  averageCartValue: 'Average monetary value of carts',
  stockValidationFailures: 'Number of stock-related cart issues',
};
```

#### **Health Checks**

```javascript
// Cart system health endpoint
const healthCheck = async () => {
  const activeCartsCount = await Cart.countDocuments({ status: 'active' });
  const abandonedCartsCount = await Cart.countDocuments({
    status: 'abandoned',
  });

  return {
    status: 'healthy',
    activeCarts: activeCartsCount,
    abandonedCarts: abandonedCartsCount,
    timestamp: new Date(),
  };
};
```

---

**🎯 Best Practices Summary:**

1. **Always validate stock** before cart operations
2. **Store prices at time of adding** for consistency
3. **Implement real-time validation** for cart integrity
4. **Use transactions** for critical operations
5. **Monitor cart performance** and abandonment rates
6. **Implement proper error handling** and logging
7. **Test thoroughly** including edge cases
8. **Optimize database queries** with proper indexing

Happy coding! 🚀
