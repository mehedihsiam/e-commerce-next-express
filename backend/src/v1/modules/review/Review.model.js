import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      validate: {
        validator: async function (orderId) {
          const Order = mongoose.model('Order');
          const order = await Order.findById(orderId);

          if (!order) return false;

          // Check if order belongs to the user
          if (!order.user || order.user.toString() !== this.user.toString()) {
            return false;
          }

          // Check if order is completed/delivered
          if (!['delivered', 'completed'].includes(order.status)) {
            return false;
          }

          // Check if the product exists in the order
          const productExists = order.items.some(
            item => item.product.toString() === this.product.toString(),
          );

          return productExists;
        },
        message: 'You can only review products from your completed orders',
      },
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      minlength: [5, 'Review title must be at least 5 characters'],
      maxlength: [100, 'Review title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Review comment must be at least 10 characters'],
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
    // Admin approval system
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status must be pending, approved, or rejected',
      },
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin notes cannot exceed 500 characters'],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    // Additional metadata
    isVerifiedPurchase: {
      type: Boolean,
      default: true, // Always true since we verify through order
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Images (optional)
    images: [
      {
        url: {
          type: String,
          trim: true,
        },
        alt: {
          type: String,
          trim: true,
          maxlength: [100, 'Image alt text cannot exceed 100 characters'],
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound index to ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Index for efficient querying
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

// Virtual for review age
reviewSchema.virtual('isRecent').get(function () {
  const daysDiff =
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 30; // Recent if within 30 days
});

// Instance method to approve review
reviewSchema.methods.approve = function (adminId, notes = '') {
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  this.adminNotes = notes;
  this.rejectedAt = undefined;
  return this.save();
};

// Instance method to reject review
reviewSchema.methods.reject = function (adminId, notes = '') {
  this.status = 'rejected';
  this.approvedBy = adminId;
  this.rejectedAt = new Date();
  this.adminNotes = notes;
  this.approvedAt = undefined;
  return this.save();
};

// Instance method to check if user can review product
reviewSchema.statics.canUserReviewProduct = async function (userId, productId) {
  const Order = mongoose.model('Order');

  // Check if user has already reviewed this product
  const existingReview = await this.findOne({
    user: userId,
    product: productId,
  });
  if (existingReview) {
    return {
      canReview: false,
      reason: 'You have already reviewed this product',
    };
  }

  // Check if user has purchased this product
  const order = await Order.findOne({
    user: userId,
    status: { $in: ['delivered', 'completed'] },
    'items.product': productId,
  });

  if (!order) {
    return {
      canReview: false,
      reason: 'You can only review products you have purchased',
    };
  }

  return {
    canReview: true,
    orderId: order._id,
  };
};

// Static method to get product reviews with pagination
reviewSchema.statics.getProductReviews = function (productId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  return this.find({
    product: productId,
    status: 'approved',
  })
    .populate('user', 'firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get review statistics for a product
reviewSchema.statics.getProductReviewStats = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved',
      },
    },
    {
      $group: {
        _id: '$product',
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (!stats.length) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const result = stats[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  result.ratingDistribution.forEach(rating => {
    distribution[rating]++;
  });

  return {
    totalReviews: result.totalReviews,
    averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal
    ratingDistribution: distribution,
  };
};

// Pre-save middleware
reviewSchema.pre('save', function (next) {
  // Set approval timestamp when status changes to approved
  if (this.isModified('status')) {
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = new Date();
    } else if (this.status === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = new Date();
    }
  }
  next();
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
