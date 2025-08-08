# 🎨 Frontend Developer API Guide - Category Module

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Public Endpoints](#public-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Code Examples](#code-examples)

---

## API Overview

### 🌐 Base URL

```
Development: http://localhost:5000/api/v1/categories
Production: https://your-domain.com/api/v1/categories
```

### 📋 Complete Endpoint List

```
// PUBLIC ENDPOINTS (No Authentication)
GET    /categories                    // List active categories

// ADMIN ENDPOINTS (Authentication Required)
GET    /categories/deleted            // List deleted categories
POST   /categories                    // Create category
PUT    /categories/:id                // Update category
DELETE /categories/:id                // Delete category (soft)
PATCH  /categories/:id/restore        // Restore deleted category
```

---

## Authentication

### 🔐 Admin Authentication

```javascript
// Required headers for admin endpoints
const headers = {
  Authorization: `Bearer ${adminToken}`,
  'Content-Type': 'application/json',
};

// For file uploads, don't set Content-Type (let browser set it)
const headersForUpload = {
  Authorization: `Bearer ${adminToken}`,
  // Don't set Content-Type for FormData
};
```

---

## Public Endpoints

### 🛍️ Get Categories

**Endpoint**: `GET /categories`

#### Usage

```javascript
// Get all active categories
const getCategories = async () => {
  const response = await fetch('/api/v1/categories');
  const data = await response.json();
  return data;
};

// Categories are automatically hierarchical
const buildCategoryTree = categories => {
  const categoryMap = new Map();
  const rootCategories = [];

  // First pass: create map
  categories.forEach(category => {
    categoryMap.set(category._id, { ...category, children: [] });
  });

  // Second pass: build hierarchy
  categories.forEach(category => {
    if (category.parent) {
      const parent = categoryMap.get(category.parent._id || category.parent);
      if (parent) {
        parent.children.push(categoryMap.get(category._id));
      }
    } else {
      rootCategories.push(categoryMap.get(category._id));
    }
  });

  return rootCategories;
};
```

#### Response Structure

```javascript
{
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic products and accessories",
        "image": {
          "url": "/uploads/categories/electronics.jpg",
          "filename": "electronics.jpg",
          "alt": "Electronics category"
        },
        "parent": null,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Laptops",
        "slug": "laptops",
        "description": "Laptop computers",
        "image": null,
        "parent": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Electronics",
          "slug": "electronics"
        },
        "isActive": true,
        "createdAt": "2024-01-15T11:00:00Z",
        "updatedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "count": 2,
    "hierarchy": {
      "totalCategories": 15,
      "rootCategories": 5,
      "maxDepth": 3
    }
  }
}
```

---

## Admin Endpoints

### 📋 Get Deleted Categories

**Endpoint**: `GET /categories/deleted`

#### Query Parameters

```javascript
page: 1,     // Page number (default: 1)
limit: 10,   // Items per page (max: 100, default: 10)
```

#### Usage

```javascript
const getDeletedCategories = async (page = 1, limit = 10) => {
  const response = await fetch(
    `/api/v1/categories/deleted?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    },
  );
  return response.json();
};
```

#### Response Structure

```javascript
{
  "message": "Deleted categories retrieved successfully",
  "data": {
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Outdated Category",
        "slug": "outdated-category",
        "deletedAt": "2024-01-10T10:30:00Z",
        "canRestore": false,
        "restoreIssue": "Name conflict with existing category",
        "conflictingCategoryId": "507f1f77bcf86cd799439014",
        "parentStatus": "active",
        "deletedDuration": 5 // days since deletion
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalCount": 15,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "summary": {
      "totalDeleted": 15,
      "canRestore": 10,
      "hasConflicts": 5
    }
  }
}
```

### ➕ Create Category

**Endpoint**: `POST /categories`

#### Usage

```javascript
// Create category without image
const createCategory = async categoryData => {
  const response = await fetch('/api/v1/categories', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Create category with image
const createCategoryWithImage = async (categoryData, imageFile) => {
  const formData = new FormData();

  // Add text fields
  Object.keys(categoryData).forEach(key => {
    if (categoryData[key] !== null && categoryData[key] !== undefined) {
      formData.append(key, categoryData[key]);
    }
  });

  // Add image file
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch('/api/v1/categories', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      // Don't set Content-Type for FormData
    },
    body: formData,
  });

  return response.json();
};

// Example usage
const newCategory = {
  name: 'Gaming',
  description: 'Gaming products and accessories',
  imageAlt: 'Gaming category banner',
  parent: '507f1f77bcf86cd799439011', // Optional parent ID
};

// With image
await createCategoryWithImage(newCategory, selectedImageFile);

// Without image
await createCategory({
  name: 'Books',
  description: 'All kinds of books',
});
```

### ✏️ Update Category

**Endpoint**: `PUT /categories/:id`

#### Usage

```javascript
// Update category fields only
const updateCategory = async (categoryId, updateData) => {
  const response = await fetch(`/api/v1/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  return response.json();
};

// Update category with new image
const updateCategoryWithImage = async (categoryId, updateData, imageFile) => {
  const formData = new FormData();

  // Add update fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== null && updateData[key] !== undefined) {
      formData.append(key, updateData[key]);
    }
  });

  // Add new image if provided
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`/api/v1/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  return response.json();
};

// Example updates
// Update name and description only
await updateCategory(categoryId, {
  name: 'Updated Electronics',
  description: 'Updated description',
});

// Update with new image
await updateCategoryWithImage(
  categoryId,
  {
    name: 'Gaming Hub',
    imageAlt: 'New gaming banner',
  },
  newImageFile,
);

// Move category to different parent
await updateCategory(categoryId, {
  parent: '507f1f77bcf86cd799439015', // New parent ID
});

// Make category root (no parent)
await updateCategory(categoryId, {
  parent: null,
});
```

### 🗑️ Delete Category

**Endpoint**: `DELETE /categories/:id`

#### Usage

```javascript
const deleteCategory = async categoryId => {
  const response = await fetch(`/api/v1/categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Handle deletion with confirmation
const handleDeleteCategory = async category => {
  const confirmMessage = `Are you sure you want to delete "${category.name}"?`;

  if (confirm(confirmMessage)) {
    try {
      await deleteCategory(category._id);
      toast.success('Category deleted successfully');
      // Refresh category list
      loadCategories();
    } catch (error) {
      if (error.message.includes('subcategories')) {
        toast.error('Cannot delete category with subcategories');
      } else if (error.message.includes('products')) {
        toast.error('Cannot delete category with products');
      } else {
        toast.error('Failed to delete category');
      }
    }
  }
};
```

### 🔄 Restore Category

**Endpoint**: `PATCH /categories/:id/restore`

#### Usage

```javascript
const restoreCategory = async categoryId => {
  const response = await fetch(`/api/v1/categories/${categoryId}/restore`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Handle restoration with error handling
const handleRestoreCategory = async deletedCategory => {
  try {
    await restoreCategory(deletedCategory._id);
    toast.success('Category restored successfully');
    // Refresh both active and deleted category lists
    loadCategories();
    loadDeletedCategories();
  } catch (error) {
    if (error.message.includes('Name conflict')) {
      toast.error('Cannot restore: Category name already exists');
    } else if (error.message.includes('Parent category')) {
      toast.error('Cannot restore: Parent category is not available');
    } else {
      toast.error('Failed to restore category');
    }
  }
};
```

---

## Error Handling

### 🚨 Error Response Formats

```javascript
// Validation Error (400)
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

// Business Logic Error (400)
{
  "message": "Cannot delete category with subcategories",
  "error": "This category has 3 subcategory(ies). Please delete or move the subcategories first.",
  "childCategories": [
    {
      "_id": "507f...",
      "name": "Laptops",
      "slug": "laptops"
    }
  ]
}

// Conflict Error (400)
{
  "message": "A category with this name already exists",
  "field": "name",
  "value": "Electronics"
}

// Not Found Error (404)
{
  "message": "Category not found"
}
```

### 🛡️ Error Handling Utilities

```javascript
// Generic error handler for category operations
const handleCategoryError = (error, operation = '') => {
  console.error(`Category ${operation} error:`, error);

  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        if (data.errors) {
          // Validation errors
          return {
            type: 'validation',
            message: 'Please check your input',
            errors: data.errors,
          };
        }
        // Business logic errors
        return {
          type: 'business',
          message: data.message,
          details: data.error,
        };

      case 401:
        return {
          type: 'auth',
          message: 'Authentication required',
        };

      case 403:
        return {
          type: 'permission',
          message: 'Insufficient permissions',
        };

      case 404:
        return {
          type: 'notFound',
          message: 'Category not found',
        };

      default:
        return {
          type: 'server',
          message: 'Server error occurred',
        };
    }
  }

  return {
    type: 'network',
    message: 'Network error. Please check your connection.',
  };
};
```

---

## Best Practices

### 🎯 State Management

#### React Category Management Hook

```javascript
const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load active categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCategories();
      setCategories(data.data.categories);
    } catch (err) {
      setError(handleCategoryError(err, 'loading'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load deleted categories (admin only)
  const loadDeletedCategories = useCallback(async (page = 1) => {
    try {
      const data = await getDeletedCategories(page);
      setDeletedCategories(data.data.categories);
      return data.data.pagination;
    } catch (err) {
      setError(handleCategoryError(err, 'loading deleted'));
    }
  }, []);

  // Create category
  const createCategory = useCallback(
    async (categoryData, imageFile) => {
      try {
        const result = imageFile
          ? await createCategoryWithImage(categoryData, imageFile)
          : await createCategory(categoryData);

        await loadCategories(); // Refresh list
        return result;
      } catch (err) {
        const error = handleCategoryError(err, 'creating');
        setError(error);
        throw error;
      }
    },
    [loadCategories],
  );

  // Update category
  const updateCategory = useCallback(
    async (categoryId, updateData, imageFile) => {
      try {
        const result = imageFile
          ? await updateCategoryWithImage(categoryId, updateData, imageFile)
          : await updateCategory(categoryId, updateData);

        await loadCategories(); // Refresh list
        return result;
      } catch (err) {
        const error = handleCategoryError(err, 'updating');
        setError(error);
        throw error;
      }
    },
    [loadCategories],
  );

  // Delete category
  const deleteCategory = useCallback(
    async categoryId => {
      try {
        const result = await deleteCategory(categoryId);
        await loadCategories(); // Refresh list
        return result;
      } catch (err) {
        const error = handleCategoryError(err, 'deleting');
        setError(error);
        throw error;
      }
    },
    [loadCategories],
  );

  // Restore category
  const restoreCategory = useCallback(
    async categoryId => {
      try {
        const result = await restoreCategory(categoryId);
        await Promise.all([loadCategories(), loadDeletedCategories()]);
        return result;
      } catch (err) {
        const error = handleCategoryError(err, 'restoring');
        setError(error);
        throw error;
      }
    },
    [loadCategories, loadDeletedCategories],
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    deletedCategories,
    loading,
    error,
    loadCategories,
    loadDeletedCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    clearError: () => setError(null),
  };
};
```

### 🌳 Category Tree Building

```javascript
// Build hierarchical category tree
const buildCategoryTree = categories => {
  const categoryMap = new Map();
  const rootCategories = [];

  // Create map of all categories
  categories.forEach(category => {
    categoryMap.set(category._id, {
      ...category,
      children: [],
    });
  });

  // Build hierarchy
  categories.forEach(category => {
    const categoryNode = categoryMap.get(category._id);

    if (category.parent && category.parent._id) {
      const parent = categoryMap.get(category.parent._id);
      if (parent) {
        parent.children.push(categoryNode);
      } else {
        // Parent not found, treat as root
        rootCategories.push(categoryNode);
      }
    } else {
      rootCategories.push(categoryNode);
    }
  });

  return rootCategories;
};

// Category tree component
const CategoryTree = ({ categories, onCategoryClick, level = 0 }) => {
  return (
    <ul className={`category-tree level-${level}`}>
      {categories.map(category => (
        <li key={category._id} className='category-item'>
          <div
            className='category-content'
            onClick={() => onCategoryClick(category)}
          >
            <span className='category-name'>{category.name}</span>
            {category.children.length > 0 && (
              <span className='child-count'>({category.children.length})</span>
            )}
          </div>

          {category.children.length > 0 && (
            <CategoryTree
              categories={category.children}
              onCategoryClick={onCategoryClick}
              level={level + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
};
```

### 📱 Image Handling

```javascript
// Image upload with preview
const CategoryImageUpload = ({
  currentImage,
  onImageChange,
  altText,
  onAltChange,
}) => {
  const [preview, setPreview] = useState(currentImage?.url);
  const fileInputRef = useRef(null);

  const handleFileSelect = event => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(file);

      onImageChange(file);
    }
  };

  return (
    <div className='image-upload'>
      <div className='image-preview'>
        {preview ? (
          <img
            src={preview}
            alt={altText || 'Category image preview'}
            className='preview-image'
          />
        ) : (
          <div className='placeholder'>No image selected</div>
        )}
      </div>

      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept='image/*'
        className='file-input'
      />

      <input
        type='text'
        placeholder='Image description (alt text)'
        value={altText}
        onChange={e => onAltChange(e.target.value)}
        className='alt-text-input'
        required={!!preview}
      />

      <button
        type='button'
        onClick={() => fileInputRef.current?.click()}
        className='upload-button'
      >
        {preview ? 'Change Image' : 'Upload Image'}
      </button>
    </div>
  );
};
```

---

## Code Examples

### 🛍️ Customer Category Navigation

```javascript
const CategoryNavigation = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        const tree = buildCategoryTree(data.data.categories);
        setCategories(tree);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) return <div>Loading categories...</div>;

  return (
    <nav className='category-navigation'>
      <h3>Categories</h3>
      <CategoryTree
        categories={categories}
        onCategoryClick={category => {
          // Navigate to category page
          window.location.href = `/categories/${category.slug}`;
        }}
      />
    </nav>
  );
};
```

### 👑 Admin Category Management

```javascript
const AdminCategoryManager = () => {
  const {
    categories,
    deletedCategories,
    loading,
    error,
    loadDeletedCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    clearError,
  } = useCategories();

  const [showDeleted, setShowDeleted] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleCreateCategory = async formData => {
    try {
      await createCategory(formData.data, formData.image);
      toast.success('Category created successfully');
      setEditingCategory(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateCategory = async (categoryId, formData) => {
    try {
      await updateCategory(categoryId, formData.data, formData.image);
      toast.success('Category updated successfully');
      setEditingCategory(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteCategory = async category => {
    if (confirm(`Delete "${category.name}"?`)) {
      try {
        await deleteCategory(category._id);
        toast.success('Category deleted successfully');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleRestoreCategory = async category => {
    try {
      await restoreCategory(category._id);
      toast.success('Category restored successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className='admin-category-manager'>
      <div className='header'>
        <h2>Category Management</h2>
        <div className='actions'>
          <button onClick={() => setEditingCategory('new')}>
            Add Category
          </button>
          <button
            onClick={() => {
              setShowDeleted(!showDeleted);
              if (!showDeleted) loadDeletedCategories();
            }}
          >
            {showDeleted ? 'Show Active' : 'Show Deleted'}
          </button>
        </div>
      </div>

      {error && (
        <div className='error-banner'>
          {error.message}
          <button onClick={clearError}>×</button>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : showDeleted ? (
        <DeletedCategoryList
          categories={deletedCategories}
          onRestore={handleRestoreCategory}
        />
      ) : (
        <ActiveCategoryList
          categories={categories}
          onEdit={setEditingCategory}
          onDelete={handleDeleteCategory}
        />
      )}

      {editingCategory && (
        <CategoryFormModal
          category={editingCategory === 'new' ? null : editingCategory}
          categories={categories}
          onSave={
            editingCategory === 'new'
              ? handleCreateCategory
              : handleUpdateCategory
          }
          onCancel={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
};
```

---

**Happy coding! 🚀** Use this guide to build robust category management features for both your customer-facing website and admin dashboard.
