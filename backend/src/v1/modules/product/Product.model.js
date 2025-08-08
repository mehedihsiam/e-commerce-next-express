import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: String,
    images: [
      {
        url: String,
        alt: String,
        filename: String,
      },
    ],
    price: { type: Number, required: true }, // Base price
    discountPrice: Number, // Base discount price
    stock: { type: Number, default: 0 }, // Total stock (sum of all variants or standalone)
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tags: [String],

    // Enhanced variants system
    variants: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Unique variant ID
        sku: { type: String, trim: true }, // Unique SKU for this variant
        color: {
          type: String,
          trim: true,
          lowercase: true,
        }, // Optional color
        size: {
          type: String,
          trim: true,
          uppercase: true,
        }, // Optional size
        price: { type: Number }, // Variant-specific price (overrides base price)
        discountPrice: { type: Number }, // Variant-specific discount
        stock: { type: Number, default: 0, min: 0 }, // Variant stock
        images: [
          {
            url: String,
            alt: String,
            filename: String,
          },
        ], // Variant-specific images
        isActive: { type: Boolean, default: true }, // Can disable specific variants
        weight: { type: Number }, // For shipping calculations
        dimensions: {
          length: Number,
          width: Number,
          height: Number,
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    // Product type configuration
    hasVariants: { type: Boolean, default: false }, // Simple vs Variable product
    variationType: {
      type: String,
      enum: ['none', 'color', 'size', 'color_size', 'custom'],
      default: 'none',
    },

    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // SEO and metadata
    metaTitle: String,
    metaDescription: String,

    // Inventory tracking
    lowStockThreshold: { type: Number, default: 5 },
    trackInventory: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Pre-save middleware for slug generation and validation
productSchema.pre('save', function (next) {
  // Generate slug from name
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  }

  // Set hasVariants based on variants array
  this.hasVariants = this.variants && this.variants.length > 0;

  // Update variant timestamps
  if (this.variants && this.variants.length > 0) {
    this.variants.forEach(variant => {
      if (variant.isModified || variant.isNew) {
        variant.updatedAt = new Date();
      }
    });

    // Calculate total stock from variants
    if (this.trackInventory && this.hasVariants) {
      this.stock = this.variants.reduce((total, variant) => {
        return total + (variant.stock || 0);
      }, 0);
    }

    // Generate SKUs for variants without them
    this.variants.forEach((variant, index) => {
      if (!variant.sku) {
        const basesku = this.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const variantSuffix = [variant.color, variant.size]
          .filter(Boolean)
          .join('-')
          .toUpperCase();

        variant.sku = variantSuffix
          ? `${basesku}-${variantSuffix}`
          : `${basesku}-${index + 1}`;
      }
    });
  }

  next();
});

// Validation for variant combinations
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    const combinations = new Set();

    for (const variant of this.variants) {
      const combination = `${variant.color || 'none'}-${variant.size || 'none'}`;

      if (combinations.has(combination)) {
        return next(new Error(`Duplicate variant combination: ${combination}`));
      }

      combinations.add(combination);
    }
  }

  next();
});

// Virtual for low stock check
productSchema.virtual('isLowStock').get(function () {
  if (!this.trackInventory) return false;

  if (this.hasVariants) {
    return this.variants.some(
      variant => variant.isActive && variant.stock <= this.lowStockThreshold,
    );
  }

  return this.stock <= this.lowStockThreshold;
});

// Virtual for available variants
productSchema.virtual('availableVariants').get(function () {
  if (!this.hasVariants) return [];

  return this.variants.filter(variant => variant.isActive && variant.stock > 0);
});

// Instance method to get variant by ID
productSchema.methods.getVariantById = function (variantId) {
  return this.variants.id(variantId);
};

// Instance method to check if variant combination exists
productSchema.methods.hasVariantCombination = function (color, size) {
  return this.variants.some(
    variant =>
      variant.color === color && variant.size === size && variant.isActive,
  );
};

// Static method to find products with low stock
productSchema.statics.findLowStock = function () {
  return this.find({
    $or: [
      // Simple products with low stock
      {
        hasVariants: false,
        stock: { $lte: this.schema.paths.lowStockThreshold.default },
      },
      // Variable products with low stock variants
      {
        hasVariants: true,
        'variants.stock': { $lte: this.schema.paths.lowStockThreshold.default },
        'variants.isActive': true,
      },
    ],
  });
};

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // All text fields in text index
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ tags: 1 }); // Separate index for tags array
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'variants.color': 1 });
productSchema.index({ 'variants.size': 1 });

// Virtual populate for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  match: { status: 'approved' },
});

// Virtual for review statistics
productSchema.virtual('reviewStats').get(function () {
  // This will be calculated separately using aggregation
  // as virtuals can't perform async operations
  return {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
});

// Instance method to get review statistics
productSchema.methods.getReviewStats = async function () {
  const Review = mongoose.model('Review');
  return await Review.getProductReviewStats(this._id);
};

const Product = mongoose.model('Product', productSchema);
export default Product;
