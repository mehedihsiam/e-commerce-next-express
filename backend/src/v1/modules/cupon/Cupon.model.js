import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
      match: [
        /^[A-Z0-9]+$/,
        'Coupon code can only contain uppercase letters and numbers',
      ],
    },
    name: {
      type: String,
      required: [true, 'Coupon name is required'],
      trim: true,
      maxlength: [100, 'Coupon name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    discountType: {
      type: String,
      enum: {
        values: ['flat', 'percent'],
        message: 'Discount type must be either flat or percent',
      },
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
      validate: {
        validator: function (value) {
          if (this.discountType === 'percent' && value > 100) {
            return false;
          }
          return true;
        },
        message: 'Percentage discount cannot exceed 100%',
      },
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase amount cannot be negative'],
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: [0, 'Maximum discount cannot be negative'],
      validate: {
        validator: function (value) {
          // Only validate if value is provided and discountType is percent
          if (value !== null && this.discountType === 'flat') {
            return false;
          }
          return true;
        },
        message: 'Maximum discount is only applicable for percentage discounts',
      },
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: 'Expiration date must be in the future',
      },
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
    },
    usageLimit: {
      type: Number,
      min: [1, 'Usage limit must be at least 1'],
      validate: {
        validator: function (value) {
          if (
            value !== null &&
            value !== undefined &&
            this.usageCount > value
          ) {
            return false;
          }
          return true;
        },
        message: 'Usage limit cannot be less than current usage count',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Admin who created the coupon
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    // Categories or products this coupon applies to (if empty, applies to all)
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    // User restrictions
    userRestrictions: {
      firstTimeOnly: {
        type: Boolean,
        default: false,
      },
      specificUsers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for checking if coupon is expired
couponSchema.virtual('isExpired').get(function () {
  return this.expiresAt < new Date();
});

// Virtual for checking if coupon is valid
couponSchema.virtual('isValid').get(function () {
  return (
    this.isActive &&
    !this.isExpired &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
});

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function () {
  if (!this.usageLimit) return 'Unlimited';
  return Math.max(0, this.usageLimit - this.usageCount);
});

// Index for efficient querying
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ createdBy: 1 });

// Instance method to check if coupon is applicable to a user
couponSchema.methods.isApplicableToUser = function (userId) {
  // If no user restrictions, applicable to all
  if (
    !this.userRestrictions.specificUsers.length &&
    !this.userRestrictions.firstTimeOnly
  ) {
    return true;
  }

  // Check specific user restriction
  if (this.userRestrictions.specificUsers.length > 0) {
    return this.userRestrictions.specificUsers.includes(userId);
  }

  return true; // Will need additional logic for first time users in controller
};

// Instance method to validate coupon for order
couponSchema.methods.validateForOrder = function (
  orderSubtotal,
  userId = null,
  userOrderCount = 0,
) {
  const errors = [];

  if (!this.isActive) {
    errors.push('Coupon is not active');
  }

  if (this.isExpired) {
    errors.push('Coupon has expired');
  }

  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    errors.push('Coupon usage limit exceeded');
  }

  if (orderSubtotal < this.minPurchase) {
    errors.push(`Minimum purchase amount is $${this.minPurchase}`);
  }

  if (this.userRestrictions.firstTimeOnly && userOrderCount > 0) {
    errors.push('This coupon is only for first-time customers');
  }

  if (userId && !this.isApplicableToUser(userId)) {
    errors.push('This coupon is not applicable to your account');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Instance method to calculate discount
couponSchema.methods.calculateDiscount = function (subtotal) {
  let discount = 0;

  if (this.discountType === 'percent') {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = Math.min(this.discountValue, subtotal);
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

// Pre-save middleware
couponSchema.pre('save', function (next) {
  // Ensure code is uppercase
  if (this.code) {
    this.code = this.code.toUpperCase();
  }

  // Validate dates
  if (this.startDate && this.expiresAt && this.startDate >= this.expiresAt) {
    return next(new Error('Start date must be before expiration date'));
  }

  next();
});

// Static method to find valid coupons
couponSchema.statics.findValidCoupons = function () {
  return this.find({
    isActive: true,
    expiresAt: { $gt: new Date() },
    $or: [
      { usageLimit: { $exists: false } },
      { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
    ],
  });
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
