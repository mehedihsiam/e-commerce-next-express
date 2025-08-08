import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number',
    },
  },
  variant: {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return this.color || this.size;
      },
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
    sku: { type: String, trim: true }, // Store SKU for faster access
  },
  // Price information stored at time of adding to cart
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
  },
  // Calculate effective price (discountPrice if available, otherwise price)
  effectivePrice: {
    type: Number,
    required: true,
  },
  // Store product snapshot for order history
  productSnapshot: {
    name: String,
    image: String, // Primary image URL
    category: String,
  },
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [cartItemSchema],

    // Cart totals (calculated virtuals and stored for performance)
    totals: {
      itemCount: { type: Number, default: 0, min: 0 },
      subtotal: { type: Number, default: 0, min: 0 },
      totalDiscount: { type: Number, default: 0, min: 0 },
      finalTotal: { type: Number, default: 0, min: 0 },
    },

    // Cart status
    status: {
      type: String,
      enum: ['active', 'processing', 'converted', 'abandoned'],
      default: 'active',
    },

    // Shopping session tracking
    sessionId: String,

    // Metadata
    lastActivity: { type: Date, default: Date.now },
    convertedAt: Date, // When cart was converted to order
    abandonedAt: Date, // When cart was marked as abandoned
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for total number of items
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for checking if cart is empty
cartSchema.virtual('isEmpty').get(function () {
  return this.items.length === 0;
});

// Virtual for cart age in days
cartSchema.virtual('ageInDays').get(function () {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
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
  } else {
    this.totals = {
      itemCount: 0,
      subtotal: 0,
      totalDiscount: 0,
      finalTotal: 0,
    };
  }

  // Update last activity
  this.lastActivity = new Date();

  // Update item timestamps
  this.items.forEach(item => {
    if (item.isModified() || item.isNew) {
      item.updatedAt = new Date();
    }
  });

  next();
});

// Instance method to add item to cart
cartSchema.methods.addItem = function (itemData) {
  const {
    productId,
    variantId,
    quantity = 1,
    price,
    discountPrice,
    productSnapshot,
    variant,
  } = itemData;

  // Check if item already exists
  const existingItemIndex = this.items.findIndex(item => {
    const productMatch = item.product.toString() === productId.toString();
    const variantMatch =
      !variantId || item.variant.variantId?.toString() === variantId.toString();
    return productMatch && variantMatch;
  });

  const effectivePrice = discountPrice || price;

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].price = price;
    this.items[existingItemIndex].discountPrice = discountPrice;
    this.items[existingItemIndex].effectivePrice = effectivePrice;
    this.items[existingItemIndex].updatedAt = new Date();
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      variant: variant || {},
      price,
      discountPrice,
      effectivePrice,
      productSnapshot,
    });
  }

  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function (itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    return this.removeItem(itemId);
  }

  item.quantity = quantity;
  item.updatedAt = new Date();
  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function (itemId) {
  this.items.pull(itemId);
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

// Instance method to mark cart as converted
cartSchema.methods.markAsConverted = function () {
  this.status = 'converted';
  this.convertedAt = new Date();
  return this.save();
};

// Static method to find abandoned carts
cartSchema.statics.findAbandoned = function (daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.find({
    status: 'active',
    lastActivity: { $lt: cutoffDate },
    'items.0': { $exists: true }, // Has items
  });
};

// Static method to cleanup empty carts
cartSchema.statics.cleanupEmpty = function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    items: { $size: 0 },
    updatedAt: { $lt: cutoffDate },
  });
};

// Index for performance
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ status: 1 });
cartSchema.index({ lastActivity: 1 });
cartSchema.index({ 'items.product': 1 });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
