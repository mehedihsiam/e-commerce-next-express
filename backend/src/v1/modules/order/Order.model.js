import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  variant: {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    color: {
      type: String,
      trim: true,
      lowercase: true,
    },
    size: {
      type: String,
      trim: true,
      uppercase: true,
    },
    sku: { type: String, trim: true },
  },
  // Price snapshot at time of order
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
  },
  effectivePrice: {
    type: Number,
    required: true,
  },
  lineTotal: {
    type: Number,
    required: true,
  },
  // Product snapshot for order history
  productSnapshot: {
    name: { type: String, required: true },
    image: String,
    category: String,
    slug: String,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: 'Bangladesh' },
  landmark: { type: String, trim: true },
  addressType: {
    type: String,
    enum: ['home', 'office', 'other'],
    default: 'home',
  },
});

const paymentInfoSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: [
      'cash_on_delivery',
      'bkash',
      'nagad',
      'rocket',
      'bank_transfer',
      'card',
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: { type: String, trim: true },
  gatewayResponse: mongoose.Schema.Types.Mixed,
  paidAt: Date,
  refundedAt: Date,
  refundAmount: { type: Number, default: 0 },
});

const orderTrackingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned',
    ],
    default: 'pending',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  note: String,
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    // Order identification
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Customer information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function () {
          return this.user || this.guestEmail;
        },
        message: 'Either user or guest email is required',
      },
    },
    guestPhone: {
      type: String,
      trim: true,
      validate: {
        validator: function () {
          return this.user || this.guestPhone;
        },
        message: 'Either user or guest phone is required',
      },
    },
    customerType: {
      type: String,
      enum: ['registered', 'guest'],
      default: function () {
        return this.user ? 'registered' : 'guest';
      },
    },

    // Order items
    items: [orderItemSchema],

    // Addresses
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    billingAddress: {
      type: shippingAddressSchema,
      required: false, // Can be same as shipping
    },
    sameAsBilling: { type: Boolean, default: true },

    // Payment information
    payment: paymentInfoSchema,

    // Order status and tracking
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'pending',
    },
    tracking: [orderTrackingSchema],

    // Pricing breakdown
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      itemDiscount: { type: Number, default: 0, min: 0 },
      couponDiscount: { type: Number, default: 0, min: 0 },
      shippingCost: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },

    // Coupon information
    coupon: {
      code: String,
      discountType: String,
      discountValue: Number,
      appliedDiscount: Number,
    },

    // Shipping information
    shipping: {
      method: {
        type: String,
        enum: ['standard', 'express', 'overnight', 'pickup'],
        default: 'standard',
      },
      cost: { type: Number, default: 0 },
      estimatedDelivery: Date,
      actualDelivery: Date,
      trackingNumber: String,
      carrier: String,
    },

    // Order metadata
    notes: String, // Customer notes
    adminNotes: String, // Internal admin notes
    cancellationReason: String,
    returnReason: String,

    // Timestamps
    placedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    returnedAt: Date,

    // Source tracking
    source: {
      type: String,
      enum: ['web', 'mobile', 'admin', 'pos'],
      default: 'web',
    },

    // Session information
    sessionId: String,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for total items count

// Virtual for total items count
orderSchema.virtual('totalItems').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order age
orderSchema.virtual('ageInDays').get(function () {
  return Math.floor((new Date() - this.placedAt) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function () {
  return ['pending', 'confirmed', 'processing'].includes(this.status);
});

// Virtual for checking if order can be returned
orderSchema.virtual('canBeReturned').get(function () {
  return this.status === 'delivered' && this.ageInDays <= 7; // 7 days return policy
});

// Virtual for current tracking status
orderSchema.virtual('currentTracking').get(function () {
  return this.tracking.length > 0
    ? this.tracking[this.tracking.length - 1]
    : null;
});

// Pre-save middleware for order number generation
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    try {
      this.orderNumber = await generateUniqueOrderNumber(this.constructor);
    } catch (error) {
      return next(error);
    }
  }

  // Calculate line totals for items
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      if (!item.lineTotal || item.isModified()) {
        item.lineTotal = item.effectivePrice * item.quantity;
      }
    });
  }

  // Set customer type based on user
  if (this.user && !this.customerType) {
    this.customerType = 'registered';
  } else if (!this.user && !this.customerType) {
    this.customerType = 'guest';
  }

  // Copy shipping address to billing if same
  if (this.sameAsBilling && this.shippingAddress) {
    this.billingAddress = this.shippingAddress.toObject();
  }

  next();
});

// Pre-save middleware for status tracking
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    // Add tracking entry for status change
    this.tracking.push({
      status: this.status,
      timestamp: new Date(),
    });

    // Set timestamp fields based on status
    const now = new Date();
    switch (this.status) {
      case 'confirmed':
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case 'shipped':
        if (!this.shippedAt) this.shippedAt = now;
        break;
      case 'delivered':
        if (!this.deliveredAt) this.deliveredAt = now;
        if (!this.shipping.actualDelivery) this.shipping.actualDelivery = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
      case 'returned':
        if (!this.returnedAt) this.returnedAt = now;
        break;
    }
  }
  next();
});

// Instance method to add tracking entry
orderSchema.methods.addTracking = function (status, note, updatedBy) {
  this.tracking.push({
    status,
    note,
    updatedBy,
    timestamp: new Date(),
  });

  this.status = status;
  return this.save();
};

// Instance method to calculate total
orderSchema.methods.calculateTotal = function () {
  let subtotal = 0;

  this.items.forEach(item => {
    subtotal += item.effectivePrice * item.quantity;
  });

  this.pricing = {
    subtotal,
    itemDiscount: this.pricing?.itemDiscount || 0,
    couponDiscount: this.pricing?.couponDiscount || 0,
    shippingCost: this.shipping?.cost || 0,
    tax: this.pricing?.tax || 0,
  };

  this.pricing.total =
    this.pricing.subtotal -
    this.pricing.itemDiscount -
    this.pricing.couponDiscount +
    this.pricing.shippingCost +
    this.pricing.tax;

  return this.pricing.total;
};

// Instance method to apply coupon
orderSchema.methods.applyCoupon = function (coupon) {
  if (!coupon || !coupon.isActive) {
    throw new Error('Invalid coupon');
  }

  const subtotal = this.pricing.subtotal;

  if (subtotal < coupon.minPurchase) {
    throw new Error(`Minimum purchase amount is $${coupon.minPurchase}`);
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

  this.coupon = {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    appliedDiscount: discount,
  };

  this.pricing.couponDiscount = discount;
  this.calculateTotal();

  return discount;
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function (status) {
  return this.find({ status });
};

// Static method to find recent orders
orderSchema.statics.findRecent = function (days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.find({
    placedAt: { $gte: cutoffDate },
  }).sort({ placedAt: -1 });
};

// Static method for order analytics
orderSchema.statics.getAnalytics = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        placedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        totalItems: { $sum: { $sum: '$items.quantity' } },
      },
    },
  ]);
};

// Indexes for better performance
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ placedAt: -1 });
orderSchema.index({ guestEmail: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
