# 🔧 Backend Developer Guidelines - Products Module

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Code Structure](#code-structure)
3. [Development Guidelines](#development-guidelines)
4. [Security Considerations](#security-considerations)
5. [Performance Best Practices](#performance-best-practices)
6. [Error Handling](#error-handling)
7. [Testing Guidelines](#testing-guidelines)
8. [Deployment & Monitoring](#deployment--monitoring)

---

## Architecture Overview

### 📁 Module Structure

```
src/v1/modules/product/
├── Product.model.js           # Mongoose schema & model
├── product.router.js          # Express routes
├── createProduct.js           # Product creation controller
├── updateProduct.js           # Product update controller
├── deleteProduct.js           # Product deletion (soft delete)
├── toggleProductStatus.js     # Quick status toggle
├── updateStock.js             # Stock management
├── getAllProductsPublic.js    # Public product listing
├── getAllProductsAdmin.js     # Admin product listing
├── getProductPublic.js        # Public product details
├── getProductAdmin.js         # Admin product details
├── getFeaturedProducts.js     # Featured products
├── getRelatedProducts.js      # Related products
└── uploadImages.js            # Image upload handler
```

### 🏗️ Design Patterns Used

- **Controller Pattern**: Each operation in separate file
- **Repository Pattern**: Model abstracts database operations
- **Middleware Pattern**: Authentication, validation, file upload
- **Factory Pattern**: Zod schema reuse across controllers

---

## Code Structure

### 🎯 Controller Structure Template

```javascript
import { z } from 'zod';
import Product from './Product.model.js';
import formatZodError from '../../utils/formatZodError.js';

// 1. Validation Schema
const schema = z.object({
  // Define validation rules
});

// 2. Main Controller Function
const controllerName = async (req, res, next) => {
  try {
    // 3. Input Validation
    const validatedData = schema.parse(req.body / req.query);

    // 4. Business Logic
    // Database operations, calculations, etc.

    // 5. Response
    res.status(200).json({
      message: 'Success message',
      data: transformedData,
    });
  } catch (error) {
    // 6. Error Handling
    console.error('Controller error:', error);

    const zodErrors = formatZodError(error);
    if (zodErrors) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: zodErrors,
      });
    }

    next(error);
  }
};

export default controllerName;
```

### 📊 Database Model Guidelines

#### Model Structure

```javascript
const productSchema = new mongoose.Schema(
  {
    // Core fields
    name: { type: String, required: true, index: true },
    description: String,

    // Pricing
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },

    // Inventory
    stock: { type: Number, default: 0, min: 0 },

    // Variants (complex subdocuments)
    variants: [variantSchema],

    // Indexes for performance
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
```

#### Index Strategy

```javascript
// Text search index
productSchema.index({ name: 'text', description: 'text' });

// Performance indexes
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
```

---

## Development Guidelines

### 🔒 Security First

```javascript
// Input Validation
const schema = z.object({
  price: z.number().min(0.01).max(999999),
  name: z.string().min(1).max(200).trim(),
});

// MongoDB ObjectId Validation
if (!id.match(/^[0-9a-fA-F]{24}$/)) {
  return res.status(400).json({ message: 'Invalid ID format' });
}

// File Upload Security
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxFileSize = 5 * 1024 * 1024; // 5MB
```

### 📝 Data Validation Patterns

#### Zod Schema Best Practices

```javascript
// Transform and validate
price: z.string()
  .transform(val => parseFloat(val))
  .refine(val => !isNaN(val) && val > 0, 'Invalid price'),

// Custom refinements for business logic
.refine(data => {
  if (data.discountPrice && data.price) {
    return data.discountPrice < data.price;
  }
  return true;
}, {
  message: 'Discount price must be less than regular price',
  path: ['discountPrice'],
});
```

#### Input Sanitization

```javascript
// Always sanitize user input
name: z.string().trim().min(1).max(200),
description: z.string().max(2000).optional(),
tags: z.array(z.string().trim()).max(20),
```

### 🚀 Performance Optimization

#### Database Queries

```javascript
// Use lean() for read-only operations
const products = await Product.find(filter)
  .lean() // Faster, returns plain objects
  .populate('category', 'name slug')
  .select('name price images category')
  .limit(20);

// Parallel queries for better performance
const [products, totalCount] = await Promise.all([
  Product.find(filter).limit(20),
  Product.countDocuments(filter),
]);

// Pagination with skip/limit
const skip = (page - 1) * limit;
Product.find(filter).skip(skip).limit(limit);
```

#### Aggregation for Complex Queries

```javascript
// Use aggregation for complex filtering
const relatedProducts = await Product.aggregate([
  { $match: filter },
  {
    $addFields: {
      relevanceScore: {
        $add: [
          { $cond: [{ $eq: ['$category', targetCategory] }, 3, 0] },
          { $size: { $setIntersection: ['$tags', targetTags] } },
        ],
      },
    },
  },
  { $sort: { relevanceScore: -1 } },
  { $limit: 10 },
]);
```

---

## Error Handling

### 🛡️ Error Handling Strategy

```javascript
// Consistent error response format
const handleError = (error, req, res, next) => {
  console.error('Error:', error);

  // Zod validation errors
  const zodErrors = formatZodError(error);
  if (zodErrors) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: zodErrors,
    });
  }

  // MongoDB errors
  if (error.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate entry',
      field: Object.keys(error.keyPattern)[0],
    });
  }

  // Cast errors
  if (error.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid data format',
    });
  }

  // Default error
  res.status(500).json({
    message: 'Internal server error',
  });
};
```

### 📋 Logging Best Practices

```javascript
// Structured logging
console.log('Product created:', {
  productId: product._id,
  name: product.name,
  userId: req.user.id,
  timestamp: new Date().toISOString(),
});

// Error logging with context
console.error('Product creation failed:', {
  error: error.message,
  stack: error.stack,
  body: req.body,
  userId: req.user?.id,
});
```

---

## Testing Guidelines

### 🧪 Unit Testing Structure

```javascript
describe('Product Controller', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        price: 99.99,
        category: categoryId,
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.product.name).toBe('Test Product');
    });

    it('should reject invalid price', async () => {
      const productData = {
        name: 'Test Product',
        price: -10, // Invalid
        category: categoryId,
      };

      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(400);
    });
  });
});
```

### 📊 Integration Testing

```javascript
describe('Product Integration', () => {
  it('should handle complete product lifecycle', async () => {
    // 1. Create product
    const createResponse = await createProduct(productData);
    const productId = createResponse.body.product._id;

    // 2. Update product
    await updateProduct(productId, updateData);

    // 3. Get product details
    const getResponse = await getProduct(productId);
    expect(getResponse.body.product.name).toBe(updateData.name);

    // 4. Delete product
    await deleteProduct(productId);

    // 5. Verify deletion
    await getProduct(productId).expect(404);
  });
});
```

---

## Deployment & Monitoring

### 🚀 Environment Configuration

```javascript
// config/database.js
const dbConfig = {
  development: {
    uri: process.env.DB_URI_DEV,
    options: { maxPoolSize: 10 },
  },
  production: {
    uri: process.env.DB_URI_PROD,
    options: {
      maxPoolSize: 50,
      retryWrites: true,
      w: 'majority',
    },
  },
};
```

### 📈 Performance Monitoring

```javascript
// Add performance monitoring
const startTime = Date.now();

// Your controller logic here

const duration = Date.now() - startTime;
console.log(`Product query took ${duration}ms`);

// Log slow queries
if (duration > 1000) {
  console.warn('Slow query detected:', {
    operation: 'getProducts',
    duration,
    filter: req.query,
  });
}
```

### 🔍 Health Checks

```javascript
// Add to your health check endpoint
const healthCheck = async () => {
  try {
    // Test database connection
    await Product.findOne().limit(1);

    // Test file upload directory
    await fs.access(uploadDirectory);

    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};
```

---

## 🛠️ Maintenance Tasks

### Regular Maintenance

1. **Database Indexes**: Monitor and optimize indexes monthly
2. **Image Cleanup**: Remove unused images weekly
3. **Performance Review**: Analyze slow queries monthly
4. **Error Monitoring**: Review error logs daily
5. **Security Updates**: Update dependencies weekly

### Database Maintenance

```javascript
// Clean up orphaned images
const cleanupOrphanedImages = async () => {
  const allImages = await getAllUploadedImages();
  const usedImages = await Product.distinct('images.url');
  const orphanedImages = allImages.filter(img => !usedImages.includes(img));

  for (const image of orphanedImages) {
    await deleteImage(image);
  }
};

// Update search indexes
db.products.reIndex();
```

---

## 📚 Additional Resources

### Documentation

- [Mongoose Documentation](https://mongoosejs.com/)
- [Zod Validation](https://zod.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Multer File Upload](https://github.com/expressjs/multer)

### Code Quality Tools

- ESLint configuration for consistent code style
- Prettier for code formatting
- Husky for pre-commit hooks
- Jest for testing

---

**Remember**: Always prioritize security, performance, and maintainability. When in doubt, refer to this guide and ask for code reviews from senior developers.
