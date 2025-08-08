# 🔧 Backend Developer Guidelines - Category Module

## Table of Contents

1. [Module Overview](#module-overview)
2. [Architecture & Structure](#architecture--structure)
3. [Database Design](#database-design)
4. [Development Guidelines](#development-guidelines)
5. [Security & Validation](#security--validation)
6. [Error Handling](#error-handling)
7. [Testing Guidelines](#testing-guidelines)
8. [Performance Optimization](#performance-optimization)

---

## Module Overview

### 📁 Module Structure

```
src/v1/modules/category/
├── Category.model.js          # Mongoose schema with soft delete
├── category.router.js         # Express routes
├── createCategory.js          # Category creation
├── updateCategory.js          # Category updates
├── deleteCategory.js          # Soft delete with safety checks
├── restoreCategory.js         # Category restoration
├── getCategories.js           # Public category listing
├── getDeletedCategories.js    # Admin deleted categories
├── BACKEND_GUIDE.md          # This file
└── FRONTEND_API_GUIDE.md     # Frontend integration guide
```

### 🎯 Core Features

- **Hierarchical Categories**: Parent-child relationships
- **Soft Delete System**: Safe deletion with restoration
- **Image Management**: Category images with alt text
- **Slug Generation**: SEO-friendly URLs
- **Circular Reference Prevention**: Safe parent assignment
- **Audit Trail**: Track deletions and restorations

---

## Architecture & Structure

### 🏗️ Model Design Patterns

#### Soft Delete Implementation

```javascript
// Model fields for soft delete
isActive: { type: Boolean, default: true },
isDeleted: { type: Boolean, default: false },
deletedAt: { type: Date, default: null },

// Query middleware to exclude deleted by default
categorySchema.pre(/^find/, function (next) {
  if (!this.getQuery().hasOwnProperty('isDeleted')) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});
```

#### Hierarchical Structure

```javascript
// Parent-child relationship
parent: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category',
  default: null,
}

// Prevent circular references
const checkCircularReference = async (parentId, targetId) => {
  if (parentId === targetId) return true;
  const parentCat = await Category.findById(parentId);
  if (parentCat && parentCat.parent) {
    return await checkCircularReference(parentCat.parent.toString(), targetId);
  }
  return false;
};
```

### 🎛️ Controller Architecture

#### Standard Controller Template

```javascript
import { z } from 'zod';
import Category from './Category.model.js';
import formatZodError from '../../utils/formatZodError.js';

// 1. Validation Schema
const schema = z.object({
  // Define validation rules
});

// 2. Main Controller
const controllerName = async (req, res, next) => {
  try {
    // 3. Input Validation
    const validatedData = schema.parse(req.body);

    // 4. Business Logic Checks
    // - Check existence
    // - Validate relationships
    // - Prevent conflicts

    // 5. Database Operations
    // - Use transactions for complex operations
    // - Handle file uploads

    // 6. Response
    res.status(200).json({
      message: 'Success message',
      category: result,
    });
  } catch (error) {
    // 7. Error Handling
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
```

---

## Database Design

### 📊 Schema Structure

```javascript
const categorySchema = new mongoose.Schema(
  {
    // Core fields
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    description: { type: String, maxlength: 500, trim: true },

    // Image management
    image: {
      url: { type: String },
      filename: { type: String },
      alt: { type: String },
    },

    // Hierarchical structure
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    // Soft delete & status
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);
```

### 🔍 Index Strategy

```javascript
// Performance indexes
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isDeleted: 1 });

// Compound indexes for common queries
categorySchema.index({ parent: 1, isActive: 1, isDeleted: 1 });
categorySchema.index({ isDeleted: 1, deletedAt: -1 }); // For deleted categories
```

### 🔄 Pre-save Hooks

```javascript
// Auto-generate slug
categorySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
  next();
});
```

---

## Development Guidelines

### 🛡️ Business Logic Rules

#### Category Deletion Rules

```javascript
// 1. Check for child categories
const childCategories = await Category.find({
  parent: id,
  isDeleted: { $ne: true },
});

if (childCategories.length > 0) {
  return res.status(400).json({
    message: 'Cannot delete category with subcategories',
    childCategories: childCategories.map(child => ({
      _id: child._id,
      name: child.name,
    })),
  });
}

// 2. Check for products (when integrated)
const productsInCategory = await Product.find({
  category: id,
  isDeleted: { $ne: true },
});

if (productsInCategory.length > 0) {
  return res.status(400).json({
    message: 'Cannot delete category with products',
    productCount: productsInCategory.length,
  });
}
```

#### Category Restoration Rules

```javascript
// 1. Check name conflicts
const duplicateName = await Category.findOne({
  name: deletedCategory.name,
  _id: { $ne: id },
  isDeleted: { $ne: true },
});

// 2. Validate parent availability
if (deletedCategory.parent) {
  const parentCategory = await Category.findOne({
    _id: deletedCategory.parent,
    isDeleted: { $ne: true },
    isActive: true,
  });

  if (!parentCategory) {
    return res.status(400).json({
      message: 'Parent category is not available',
    });
  }
}
```

### 📝 Validation Patterns

#### Zod Schema Examples

```javascript
// Create category schema
const createCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  imageAlt: z.string().min(1).trim().optional(),
  parent: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .nullable(),
});

// Update category schema (all optional)
const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  imageAlt: z.string().min(1).trim().optional(),
  parent: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});
```

#### Image Upload Validation

```javascript
// Validate image upload
if (req.file) {
  if (!imageAlt) {
    return res.status(400).json({
      message: 'Image alt text is required when uploading an image',
    });
  }

  const imageResult = await uploadImage(req.file, {
    alt: imageAlt,
    directory: 'categories',
  });

  updateData.image = {
    url: imageResult.url,
    filename: imageResult.filename,
    alt: imageAlt,
  };
}
```

---

## Security & Validation

### 🔒 Input Sanitization

```javascript
// Always validate ObjectId format
if (!id.match(/^[0-9a-fA-F]{24}$/)) {
  return res.status(400).json({
    message: 'Invalid category ID format',
  });
}

// Sanitize string inputs
name: z.string().trim().min(1).max(100),
description: z.string().trim().max(500),
```

### 🛡️ Authorization Checks

```javascript
// All admin operations require authentication
categoryRouter.post('/', verifyAdminOrModerator, createCategory);
categoryRouter.put('/:id', verifyAdminOrModerator, updateCategory);
categoryRouter.delete('/:id', verifyAdminOrModerator, deleteCategory);
```

### 🚫 Prevent Data Corruption

```javascript
// Circular reference prevention
const isCircular = await checkCircularReference(parent, id);
if (isCircular) {
  return res.status(400).json({
    message: 'Invalid parent category: This would create a circular reference',
  });
}

// Unique name enforcement
const duplicateName = await Category.findOne({
  name,
  _id: { $ne: id },
  isDeleted: { $ne: true },
});
```

---

## Error Handling

### 🚨 Error Response Standards

```javascript
// Validation errors (400)
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Category name is required",
      "value": ""
    }
  ]
}

// Business logic errors (400)
{
  "message": "Cannot delete category with subcategories",
  "error": "This category has 3 subcategory(ies)",
  "childCategories": [...]
}

// Not found errors (404)
{
  "message": "Category not found"
}
```

### 📋 Logging Standards

```javascript
// Success operations
console.log(`Category created: ${category.name} (ID: ${category._id})`);
console.log(`Category restored: ${restoredCategory.name} (ID: ${id})`);

// Error operations with context
console.error('Category update error:', {
  error: error.message,
  categoryId: req.params.id,
  userId: req.user?.id,
  body: req.body,
});
```

---

## Testing Guidelines

### 🧪 Unit Testing Structure

```javascript
describe('Category Controllers', () => {
  beforeEach(async () => {
    await Category.deleteMany({});
  });

  describe('createCategory', () => {
    it('should create category with valid data', async () => {
      const categoryData = {
        name: 'Electronics',
        description: 'Electronic products',
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.category.name).toBe('Electronics');
      expect(response.body.category.slug).toBe('electronics');
    });

    it('should reject duplicate category names', async () => {
      await Category.create({ name: 'Electronics' });

      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Electronics' })
        .expect(400);
    });
  });

  describe('deleteCategory', () => {
    it('should prevent deletion of category with subcategories', async () => {
      const parent = await Category.create({ name: 'Electronics' });
      await Category.create({ name: 'Laptops', parent: parent._id });

      await request(app)
        .delete(`/api/v1/categories/${parent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});
```

### 📊 Integration Testing

```javascript
describe('Category Lifecycle', () => {
  it('should handle complete category lifecycle', async () => {
    // 1. Create category
    const createResponse = await createCategory({
      name: 'Test Category',
      description: 'Test description',
    });
    const categoryId = createResponse.body.category._id;

    // 2. Update category
    await updateCategory(categoryId, { name: 'Updated Category' });

    // 3. Verify update
    const getResponse = await getCategory(categoryId);
    expect(getResponse.body.category.name).toBe('Updated Category');

    // 4. Delete category
    await deleteCategory(categoryId);

    // 5. Verify soft deletion
    const deletedCategory = await Category.findById(categoryId);
    expect(deletedCategory.isDeleted).toBe(true);

    // 6. Restore category
    await restoreCategory(categoryId);

    // 7. Verify restoration
    const restoredCategory = await Category.findById(categoryId);
    expect(restoredCategory.isDeleted).toBe(false);
    expect(restoredCategory.isActive).toBe(true);
  });
});
```

---

## Performance Optimization

### 🚀 Database Queries

```javascript
// Use lean() for read-only operations
const categories = await Category.find({ isActive: true })
  .lean()
  .populate('parent', 'name slug')
  .sort({ name: 1 });

// Parallel queries for better performance
const [activeCategories, deletedCount] = await Promise.all([
  Category.find({ isActive: true }),
  Category.countDocuments({ isDeleted: true }),
]);

// Efficient hierarchical queries
const categoriesWithChildren = await Category.aggregate([
  { $match: { isDeleted: { $ne: true } } },
  {
    $lookup: {
      from: 'categories',
      localField: '_id',
      foreignField: 'parent',
      as: 'children',
      pipeline: [
        { $match: { isDeleted: { $ne: true } } },
        { $project: { name: 1, slug: 1 } },
      ],
    },
  },
]);
```

### 💾 Caching Strategies

```javascript
// Cache category hierarchy
const getCachedCategoryTree = async () => {
  const cacheKey = 'category-tree';
  let categoryTree = cache.get(cacheKey);

  if (!categoryTree) {
    categoryTree = await buildCategoryTree();
    cache.set(cacheKey, categoryTree, 300); // 5 minutes
  }

  return categoryTree;
};

// Invalidate cache on updates
const invalidateCategoryCache = () => {
  cache.del('category-tree');
  cache.del('active-categories');
};
```

---

## 🛠️ Maintenance & Operations

### Regular Maintenance Tasks

1. **Monitor Soft Deletes**: Review deleted categories monthly
2. **Clean Old Deletions**: Archive categories deleted > 6 months
3. **Optimize Indexes**: Monitor query performance monthly
4. **Image Cleanup**: Remove orphaned category images
5. **Hierarchy Validation**: Check for broken parent references

### Database Maintenance Scripts

```javascript
// Clean up orphaned images
const cleanupOrphanedImages = async () => {
  const allImages = await getAllUploadedImages('categories');
  const usedImages = await Category.distinct('image.filename');
  const orphanedImages = allImages.filter(img => !usedImages.includes(img));

  for (const image of orphanedImages) {
    await deleteImage(image);
  }
};

// Validate category hierarchy
const validateHierarchy = async () => {
  const categories = await Category.find({});
  const issues = [];

  for (const category of categories) {
    if (category.parent) {
      const parent = await Category.findById(category.parent);
      if (!parent) {
        issues.push({
          categoryId: category._id,
          issue: 'Parent category not found',
          parentId: category.parent,
        });
      }
    }
  }

  return issues;
};
```

---

## 📚 Additional Resources

### Documentation Links

- [Mongoose Middleware](https://mongoosejs.com/docs/middleware.html)
- [Zod Validation](https://zod.dev/)
- [Express Router](https://expressjs.com/en/guide/routing.html)
- [Multer File Upload](https://github.com/expressjs/multer)

### Code Quality Tools

- ESLint rules for consistent code style
- Prettier for code formatting
- Husky for pre-commit hooks
- Jest for comprehensive testing

---

**Remember**: Always prioritize data integrity, user safety, and system performance. When in doubt, implement additional safety checks rather than risk data corruption.
