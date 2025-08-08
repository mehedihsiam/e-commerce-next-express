# 📁 File Upload System Guide

This guide explains how to use the modular file upload system implemented in this e-commerce backend project.

## 🏗️ Architecture Overview

The file upload system is designed with modularity and future scalability in mind:

```
src/v1/utils/
├── uploadImage.js      # Core upload logic (supports multiple storage providers)
└── multerConfig.js     # Multer middleware configuration
```

### Current Storage Support:

- ✅ **Local Storage** (implemented)
- 🔄 **Cloudinary** (ready for implementation)
- 🔄 **Google Cloud Storage** (ready for implementation)

---

## 🚀 Quick Start

### 1. Basic Setup

Import the required modules:

```javascript
import { uploadSingle, handleMulterError } from '../../utils/multerConfig.js';
import { uploadImage } from '../../utils/uploadImage.js';
```

### 2. Add to Router

```javascript
import express from 'express';
import { uploadSingle, handleMulterError } from '../../utils/multerConfig.js';

const router = express.Router();

// Single file upload
router.post(
  '/upload',
  uploadSingle('image'), // Field name: 'image'
  handleMulterError, // Handle multer errors
  yourControllerFunction,
);
```

### 3. Process Upload in Controller

```javascript
const yourController = async (req, res, next) => {
  try {
    if (req.file) {
      const uploadResult = await uploadImage(req.file, {
        folder: 'your-folder', // e.g., 'products', 'categories'
        prefix: 'your-prefix', // e.g., 'product', 'category'
        storage: 'local', // 'local', 'cloudinary', 'gcs'
      });

      if (!uploadResult.success) {
        return res.status(400).json({
          message: 'Upload failed',
          errors: uploadResult.errors,
        });
      }

      // Use uploadResult.url for database storage
      console.log('File URL:', uploadResult.url);
    }
  } catch (error) {
    next(error);
  }
};
```

---

## 📝 Detailed Usage Examples

### Example 1: Single Image Upload (Category)

**Router Setup:**

```javascript
// category.router.js
import { uploadSingle, handleMulterError } from '../../utils/multerConfig.js';

categoryRouter.post(
  '/',
  verifyAdminOrModerator,
  uploadSingle('image'), // HTML form field name
  handleMulterError,
  createCategory,
);
```

**Controller Implementation:**

```javascript
// createCategory.js
const createCategory = async (req, res, next) => {
  try {
    // ... validation logic ...

    let imageData = null;
    if (req.file) {
      const uploadResult = await uploadImage(req.file, {
        folder: 'categories',
        prefix: 'category',
        storage: 'local',
      });

      if (!uploadResult.success) {
        return res.status(400).json({
          message: 'Image upload failed',
          errors: uploadResult.errors,
        });
      }

      imageData = {
        url: uploadResult.url, // "/uploads/categories/category_1691234567_abc123.jpg"
        filename: uploadResult.filename, // "category_1691234567_abc123.jpg"
        alt: `${name} category image`,
      };
    }

    // Save to database
    const category = new Category({
      name,
      image: imageData,
    });
  } catch (error) {
    next(error);
  }
};
```

**Frontend Form (HTML):**

```html
<form action="/api/v1/categories" method="POST" enctype="multipart/form-data">
  <input type="text" name="name" placeholder="Category Name" required />
  <input type="file" name="image" accept="image/*" />
  <button type="submit">Create Category</button>
</form>
```

### Example 2: Multiple Images Upload (Product Gallery)

**Router Setup:**

```javascript
// product.router.js
import { uploadMultiple, handleMulterError } from '../../utils/multerConfig.js';

productRouter.post(
  '/',
  verifyAdminOrModerator,
  uploadMultiple('images', 5), // Field name: 'images', max 5 files
  handleMulterError,
  createProduct,
);
```

**Controller Implementation:**

```javascript
// createProduct.js
const createProduct = async (req, res, next) => {
  try {
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadImage(file, {
          folder: 'products',
          prefix: 'product',
          storage: 'local',
        });

        if (uploadResult.success) {
          imageUrls.push({
            url: uploadResult.url,
            filename: uploadResult.filename,
            alt: `${productName} image`,
          });
        }
      }
    }

    const product = new Product({
      name: productName,
      images: imageUrls,
    });
  } catch (error) {
    next(error);
  }
};
```

### Example 3: Mixed Fields Upload

**Router Setup:**

```javascript
// product.router.js
import { uploadFields, handleMulterError } from '../../utils/multerConfig.js';

productRouter.post(
  '/',
  uploadFields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'gallery', maxCount: 5 },
  ]),
  handleMulterError,
  createProduct,
);
```

**Controller Implementation:**

```javascript
const createProduct = async (req, res, next) => {
  try {
    let thumbnailData = null;
    let galleryImages = [];

    // Handle thumbnail (single file)
    if (req.files.thumbnail) {
      const uploadResult = await uploadImage(req.files.thumbnail[0], {
        folder: 'products/thumbnails',
        prefix: 'thumb',
      });
      thumbnailData = uploadResult.success ? uploadResult : null;
    }

    // Handle gallery (multiple files)
    if (req.files.gallery) {
      for (const file of req.files.gallery) {
        const uploadResult = await uploadImage(file, {
          folder: 'products/gallery',
          prefix: 'gallery',
        });
        if (uploadResult.success) {
          galleryImages.push(uploadResult);
        }
      }
    }
  } catch (error) {
    next(error);
  }
};
```

---

## ⚙️ Configuration Options

### Upload Options

```javascript
const uploadResult = await uploadImage(file, {
  folder: 'your-folder', // Required: Subfolder name
  prefix: 'your-prefix', // Optional: Filename prefix
  storage: 'local', // Required: Storage method
});
```

### Multer Options

```javascript
const upload = uploadSingle('fieldName', {
  maxSize: 10 * 1024 * 1024, // 10MB (default: 5MB)
  allowedTypes: [
    // Allowed MIME types
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
});
```

### Default Configuration

```javascript
// Located in uploadImage.js
const UPLOAD_CONFIG = {
  local: {
    baseDir: 'public/uploads',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
};
```

---

## 🗂️ File Organization

### Directory Structure

```
project-root/
└── public/
    └── uploads/
        ├── categories/
        │   ├── category_1691234567_abc123.jpg
        │   └── category_1691234568_def456.png
        ├── products/
        │   ├── product_1691234569_ghi789.jpg
        │   └── product_1691234570_jkl012.webp
        └── users/
            └── avatar_1691234571_mno345.png
```

### URL Access

Files are accessible via HTTP:

```
http://localhost:3000/uploads/categories/category_1691234567_abc123.jpg
http://localhost:3000/uploads/products/product_1691234569_ghi789.jpg
```

### Filename Generation

Pattern: `{prefix}_{timestamp}_{random}.{extension}`

Examples:

- `category_1691234567_abc123.jpg`
- `product_1691234568_def456.png`
- `avatar_1691234569_ghi789.webp`

---

## 🛡️ Security & Validation

### File Type Validation

- **MIME Type Check:** Validates `image/jpeg`, `image/png`, etc.
- **Extension Check:** Validates `.jpg`, `.png`, `.webp`, etc.
- **Double Validation:** Both MIME and extension must match

### File Size Limits

- **Default:** 5MB per file
- **Configurable:** Can be changed per upload
- **Multer Level:** Rejected before processing
- **Custom Level:** Additional validation in `uploadImage`

### Security Headers

```javascript
// Recommended: Add to your main app.js
app.use(
  '/uploads',
  express.static('public/uploads', {
    setHeaders: (res, path) => {
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Cache-Control', 'public, max-age=31536000');
    },
  }),
);
```

---

## 🔄 Future Storage Migration

The system is designed for easy migration to cloud storage:

### Cloudinary Setup (Future)

```javascript
// When implementing Cloudinary
const uploadResult = await uploadImage(req.file, {
  folder: 'categories',
  prefix: 'category',
  storage: 'cloudinary', // Just change this!
});

// No other code changes needed!
```

### Google Cloud Storage Setup (Future)

```javascript
const uploadResult = await uploadImage(req.file, {
  folder: 'categories',
  prefix: 'category',
  storage: 'gcs', // Just change this!
});
```

### Implementation Steps for Cloud Storage:

1. **Add credentials to environment variables**
2. **Implement the cloud-specific upload function**
3. **Update the storage switch statement**
4. **Change storage parameter in controllers**

---

## 🚨 Error Handling

### Multer Errors

```javascript
// Handled by handleMulterError middleware
{
  "message": "File size too large",
  "error": "Maximum file size is 5MB"
}
```

### Upload Errors

```javascript
// Returned by uploadImage function
{
  "success": false,
  "errors": [
    "File type image/gif is not allowed. Allowed types: image/jpeg, image/png"
  ]
}
```

### Controller Error Handling

```javascript
if (req.file) {
  const uploadResult = await uploadImage(req.file, options);

  if (!uploadResult.success) {
    return res.status(400).json({
      message: 'Upload failed',
      errors: uploadResult.errors,
    });
  }

  // Success - use uploadResult.url
}
```

---

## 🧪 Testing Examples

### Using Postman

1. **Set Method:** POST
2. **Set URL:** `http://localhost:3000/api/v1/categories`
3. **Set Headers:** Remove `Content-Type` (let Postman set it)
4. **Body Type:** form-data
5. **Add Fields:**
   - `name` (text): "Electronics"
   - `description` (text): "Electronic devices"
   - `image` (file): Select your image file

### Using cURL

```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Electronics" \
  -F "description=Electronic devices and accessories" \
  -F "image=@/path/to/your/image.jpg"
```

### Using JavaScript Fetch

```javascript
const formData = new FormData();
formData.append('name', 'Electronics');
formData.append('description', 'Electronic devices');
formData.append('image', fileInput.files[0]);

fetch('/api/v1/categories', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + token,
  },
  body: formData,
});
```

---

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot read property 'buffer' of undefined"**
   - Ensure multer middleware is added before your controller
   - Check that the form field name matches `uploadSingle('fieldName')`

2. **"File type not allowed"**
   - Verify file MIME type and extension
   - Check UPLOAD_CONFIG.allowedTypes and allowedExtensions

3. **"File size too large"**
   - Check multer limits configuration
   - Verify UPLOAD_CONFIG.maxSize setting

4. **"ENOENT: no such file or directory"**
   - Ensure public/uploads directory exists
   - Check file permissions

### Debug Mode

Add logging to track upload process:

```javascript
if (req.file) {
  console.log('File received:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });

  const uploadResult = await uploadImage(req.file, options);
  console.log('Upload result:', uploadResult);
}
```

---

## 📚 Additional Resources

- [Multer Documentation](https://github.com/expressjs/multer)
- [File Upload Best Practices](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [Image Optimization Techniques](https://web.dev/fast/#optimize-your-images)

---

## 🎯 Best Practices

1. **Always validate file types** both client and server-side
2. **Set appropriate file size limits** based on your use case
3. **Use meaningful folder structures** for organization
4. **Implement proper error handling** for user feedback
5. **Consider image optimization** for web performance
6. **Add virus scanning** for production environments
7. **Implement rate limiting** to prevent abuse
8. **Use CDN** for better performance in production

---

_This file upload system is designed to be flexible, secure, and easily extensible for future cloud storage implementations._
