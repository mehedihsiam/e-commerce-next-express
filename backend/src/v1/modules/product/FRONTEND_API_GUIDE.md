# 🎨 Frontend Developer API Guide - Products Module

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Public Endpoints (Customer Website)](#public-endpoints-customer-website)
4. [Admin Endpoints (Dashboard)](#admin-endpoints-dashboard)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Code Examples](#code-examples)

---

## API Overview

### 🌐 Base URL

```
Development: http://localhost:5000/api/v1/products
Production: https://your-domain.com/api/v1/products
```

### 📋 Complete Endpoint List

```
// PUBLIC ENDPOINTS (No Authentication)
GET    /products                    // Product listing with filters
GET    /products/featured           // Featured products
GET    /products/:slug              // Single product details
GET    /products/:id/related        // Related products

// ADMIN ENDPOINTS (Authentication Required)
GET    /products/private/list       // Admin product list
GET    /products/private/:id        // Admin product details
POST   /products/upload-images      // Upload product images
POST   /products                    // Create product
PUT    /products/:id                // Update product
DELETE /products/:id                // Delete product
PATCH  /products/:id/toggle-status  // Toggle active status
PATCH  /products/:id/stock          // Update stock
```

---

## Authentication

### 🔐 Admin Authentication

```javascript
// Include in request headers for admin endpoints
const headers = {
  Authorization: `Bearer ${adminToken}`,
  'Content-Type': 'application/json',
};

// Example with fetch
fetch('/api/v1/products/private/list', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  },
});
```

### 🚫 Public Endpoints

No authentication required for customer-facing endpoints.

---

## Public Endpoints (Customer Website)

### 🛍️ 1. Product Listing

**Endpoint**: `GET /products`

#### Query Parameters

```javascript
// Pagination
page: 1,           // Page number (default: 1)
limit: 12,         // Products per page (max: 50, default: 12)

// Sorting
sortBy: 'name',    // name|price|createdAt|popularity|rating|featured
sortOrder: 'asc',  // asc|desc

// Filtering
search: 'laptop',           // Search in name, description, tags
category: '507f1f77...',    // Category ID
minPrice: 100,              // Minimum price
maxPrice: 500,              // Maximum price
featured: true,             // Featured products only
onSale: true,               // Products with discount
inStock: true,              // Available products only
variationType: 'color',     // color|size|color_size
tags: 'electronics,gaming', // Comma-separated tags
priceRange: '50_100',       // under_25|25_50|50_100|100_200|over_200
```

#### Example Usage

```javascript
// Basic product listing
const getProducts = async (page = 1, limit = 12) => {
  const response = await fetch(`/api/v1/products?page=${page}&limit=${limit}`);
  const data = await response.json();
  return data;
};

// Category products
const getCategoryProducts = async (categoryId, page = 1) => {
  const response = await fetch(
    `/api/v1/products?category=${categoryId}&page=${page}&inStock=true`,
  );
  return response.json();
};

// Search products
const searchProducts = async (searchTerm, filters = {}) => {
  const params = new URLSearchParams({
    search: searchTerm,
    ...filters,
  });

  const response = await fetch(`/api/v1/products?${params}`);
  return response.json();
};

// Filter by price range
const getProductsByPrice = async priceRange => {
  const response = await fetch(
    `/api/v1/products?priceRange=${priceRange}&inStock=true`,
  );
  return response.json();
};
```

#### Response Structure

```javascript
{
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Gaming Laptop",
        "description": "High performance laptop...",
        "images": [
          {
            "url": "/uploads/products/image1.jpg",
            "alt": "Gaming laptop front view"
          }
        ],
        "price": 899.99,
        "discountPrice": 749.99,
        "effectivePrice": 749.99,
        "discountPercentage": 17,
        "category": {
          "_id": "507f...",
          "name": "Electronics",
          "slug": "electronics"
        },
        "tags": ["gaming", "laptop"],
        "hasVariants": true,
        "isInStock": true,
        "hasMultipleOptions": true,
        "priceRange": { "min": 749.99, "max": 999.99 },
        "averageRating": 4.5,
        "totalReviews": 89,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 95,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false,
      "nextPage": 2,
      "prevPage": null
    },
    "filters": {
      "applied": { "category": "507f..." },
      "stats": {
        "featured": 12,
        "onSale": 25,
        "priceRange": { "minPrice": 9.99, "maxPrice": 1999.99 }
      },
      "options": {
        "sortBy": ["name", "price", "createdAt", "popularity", "rating"],
        "priceRanges": [
          { "key": "under_25", "label": "Under $25" },
          { "key": "25_50", "label": "$25 - $50" }
        ]
      }
    }
  }
}
```

### ⭐ 2. Featured Products

**Endpoint**: `GET /products/featured`

```javascript
// Get featured products for homepage
const getFeaturedProducts = async (limit = 8) => {
  const response = await fetch(`/api/v1/products/featured?limit=${limit}`);
  return response.json();
};

// Featured products by category
const getFeaturedByCategory = async (categoryId, limit = 6) => {
  const response = await fetch(
    `/api/v1/products/featured?category=${categoryId}&limit=${limit}`,
  );
  return response.json();
};
```

### 📱 3. Single Product Details

**Endpoint**: `GET /products/:slug`

```javascript
// Get product details
const getProduct = async productSlug => {
  const response = await fetch(`/api/v1/products/${productSlug}`);
  if (!response.ok) {
    throw new Error('Product not found');
  }
  return response.json();
};
```

#### Response Structure

```javascript
{
  "message": "Product details retrieved successfully",
  "data": {
    "product": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Gaming Laptop",
      "description": "Detailed product description...",
      "images": [...],
      "price": 899.99,
      "discountPrice": 749.99,
      "effectivePrice": 749.99,
      "discountPercentage": 17,
      "category": {...},
      "tags": ["gaming", "laptop"],
      "hasVariants": true,
      "variants": [
        {
          "_id": "variant1",
          "color": "black",
          "size": "15-inch",
          "price": 749.99,
          "effectivePrice": 749.99,
          "images": [...],
          "isAvailable": true,
          "discountPercentage": 17
        }
      ],
      "isInStock": true,
      "hasMultipleOptions": true,
      "availableColors": ["black", "silver"],
      "availableSizes": ["13-inch", "15-inch"],
      "averageRating": 4.5,
      "totalReviews": 89,
      "views": 1248
    },
    "shippingInfo": {
      "weight": 2.5,
      "dimensions": {...},
      "estimatedShipping": "Calculated at checkout"
    },
    "relatedProducts": [...],
    "seo": {
      "title": "Gaming Laptop - High Performance",
      "description": "Best gaming laptop for professionals...",
      "canonicalUrl": "/products/gaming-laptop"
    }
  }
}
```

### 🔗 4. Related Products

**Endpoint**: `GET /products/:id/related`

```javascript
// Get related products
const getRelatedProducts = async (productId, limit = 6) => {
  const response = await fetch(
    `/api/v1/products/${productId}/related?limit=${limit}`,
  );
  return response.json();
};
```

---

## Admin Endpoints (Dashboard)

### 🔐 Admin Product List

**Endpoint**: `GET /products/private/list`

#### Query Parameters (Extended)

```javascript
// All public parameters plus:
isActive: true,           // Active/inactive products
isFeatured: true,         // Featured products
hasVariants: true,        // Products with variants
hasDiscount: true,        // Products with discount
lowStock: true,           // Products below threshold
outOfStock: true,         // Products with 0 stock
variationType: 'color',   // Variant type filter
dateFrom: '2024-01-01T00:00:00Z', // Created after
dateTo: '2024-12-31T23:59:59Z',   // Created before
```

#### Example Usage

```javascript
// Admin dashboard - get all products
const getAdminProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/v1/products/private/list?${params}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

// Low stock alert
const getLowStockProducts = async () => {
  return getAdminProducts({
    lowStock: true,
    sortBy: 'stock',
    sortOrder: 'asc',
  });
};

// Inactive products
const getInactiveProducts = async () => {
  return getAdminProducts({ isActive: false });
};
```

### 📊 Admin Product Details

**Endpoint**: `GET /products/private/:id`

```javascript
// Get complete product analytics
const getAdminProduct = async productId => {
  const response = await fetch(`/api/v1/products/private/${productId}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  return response.json();
};
```

#### Response Structure (Enhanced)

```javascript
{
  "message": "Product details retrieved successfully",
  "data": {
    "product": {
      // All product fields including sensitive data
      "stock": 25,
      "costPrice": 500,
      "lowStockThreshold": 10,
      // ... complete product data
    },
    "analytics": {
      "effectivePrice": 749.99,
      "discountPercentage": 17,
      "profitMargin": 33,
      "views": 1247,
      "conversionRate": 2.4,
      "averageRating": 4.5
    },
    "stockAnalytics": {
      "mainStock": 15,
      "totalVariantStock": 45,
      "effectiveStock": 60,
      "stockStatus": "in_stock",
      "lowStockVariants": 1
    },
    "seoAnalysis": {
      "seoScore": 85,
      "hasMetaTitle": true,
      "metaTitleLength": 45
    },
    "performanceComparison": {
      "betterThanAverage": {
        "price": false,
        "rating": true,
        "views": true
      }
    },
    "businessInsights": [
      {
        "type": "warning",
        "message": "Low stock alert",
        "priority": "high"
      }
    ],
    "similarProducts": [...]
  }
}
```

### 📸 Image Upload

**Endpoint**: `POST /products/upload-images`

```javascript
// Upload multiple images
const uploadProductImages = async files => {
  const formData = new FormData();

  // Add multiple files
  files.forEach((file, index) => {
    formData.append('images', file);
  });

  const response = await fetch('/api/v1/products/upload-images', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      // Don't set Content-Type, let browser set it with boundary
    },
    body: formData,
  });

  return response.json();
};

// Example usage with file input
const handleImageUpload = async event => {
  const files = Array.from(event.target.files);

  try {
    const result = await uploadProductImages(files);
    console.log('Uploaded images:', result.data.images);
    // Use the returned URLs in product creation
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

#### Response Structure

```javascript
{
  "message": "Images uploaded successfully",
  "data": {
    "images": [
      {
        "url": "/uploads/products/1703592000000-gaming-laptop-1.jpg",
        "filename": "1703592000000-gaming-laptop-1.jpg",
        "originalName": "gaming-laptop.jpg",
        "size": 2048576
      }
    ],
    "uploadedCount": 2,
    "maxAllowed": 5
  }
}
```

### ➕ Create Product

**Endpoint**: `POST /products`

```javascript
// Create new product
const createProduct = async (productData) => {
  const response = await fetch('/api/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Example product data
const productData = {
  name: "Gaming Laptop Pro",
  description: "High-performance gaming laptop...",
  price: 1299.99,
  discountPrice: 1099.99,
  stock: 50,
  category: "507f1f77bcf86cd799439011",
  tags: ["gaming", "laptop", "high-performance"],
  images: [
    {
      url: "/uploads/products/laptop-1.jpg",
      alt: "Gaming laptop front view"
    }
  ],
  hasVariants: true,
  variants: [
    {
      color: "black",
      size: "15-inch",
      stock: 25,
      price: 1099.99,
      images: [...]
    }
  ],
  isFeatured: true,
  metaTitle: "Gaming Laptop Pro - Ultimate Performance",
  metaDescription: "Best gaming laptop for professionals..."
};
```

### ✏️ Update Product

**Endpoint**: `PUT /products/:id`

```javascript
// Update existing product
const updateProduct = async (productId, updateData) => {
  const response = await fetch(`/api/v1/products/${productId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  return response.json();
};

// Partial update example
const updateProductPrice = async (productId, newPrice) => {
  return updateProduct(productId, { price: newPrice });
};
```

### 🗑️ Delete Product

**Endpoint**: `DELETE /products/:id`

```javascript
// Delete product (soft delete)
const deleteProduct = async productId => {
  const response = await fetch(`/api/v1/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  return response.json();
};
```

### 🔄 Toggle Product Status

**Endpoint**: `PATCH /products/:id/toggle-status`

```javascript
// Quick activate/deactivate
const toggleProductStatus = async productId => {
  const response = await fetch(`/api/v1/products/${productId}/toggle-status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  return response.json();
};
```

### 📦 Update Stock

**Endpoint**: `PATCH /products/:id/stock`

```javascript
// Update product stock
const updateStock = async (productId, stockData) => {
  const response = await fetch(`/api/v1/products/${productId}/stock`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stockData),
  });

  return response.json();
};

// Examples
// Set exact stock
await updateStock(productId, { action: 'set', amount: 100 });

// Increase stock
await updateStock(productId, { action: 'increase', amount: 50 });

// Decrease stock
await updateStock(productId, { action: 'decrease', amount: 10 });

// Update variant stock
await updateStock(productId, {
  action: 'set',
  amount: 25,
  variantId: 'variant123',
  reason: 'Restocked after delivery',
});
```

---

## Error Handling

### 🚨 Error Response Format

```javascript
// Validation Error (400)
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "Price must be a positive number",
      "value": -10
    }
  ]
}

// Not Found Error (404)
{
  "message": "Product not found"
}

// Server Error (500)
{
  "message": "Internal server error"
}
```

### 🛡️ Error Handling Best Practices

```javascript
// Generic error handler
const handleApiError = (error, context = '') => {
  console.error(`API Error ${context}:`, error);

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return {
          message: data.message || 'Invalid request',
          errors: data.errors,
        };
      case 401:
        return { message: 'Authentication required' };
      case 403:
        return { message: 'Access denied' };
      case 404:
        return { message: 'Resource not found' };
      case 429:
        return { message: 'Too many requests. Please try again later.' };
      default:
        return { message: 'An error occurred. Please try again.' };
    }
  }

  // Network or other error
  return { message: 'Network error. Please check your connection.' };
};

// Usage in components
const fetchProducts = async () => {
  try {
    const data = await getProducts();
    setProducts(data.data.products);
    setPagination(data.data.pagination);
  } catch (error) {
    const errorInfo = handleApiError(error, 'fetching products');
    setError(errorInfo.message);
  }
};
```

---

## Best Practices

### 🚀 Performance Optimization

#### 1. Pagination

```javascript
// Always use pagination for lists
const PRODUCTS_PER_PAGE = 12;

const loadProducts = async (page = 1) => {
  const data = await getProducts(page, PRODUCTS_PER_PAGE);
  return data;
};
```

#### 2. Image Optimization

```javascript
// Optimize image loading
const ProductImage = ({ image, alt, className }) => (
  <img
    src={image.url}
    alt={image.alt || alt}
    className={className}
    loading='lazy'
    onError={e => {
      e.target.src = '/images/placeholder-product.jpg';
    }}
  />
);
```

#### 3. Caching

```javascript
// Cache frequently accessed data
const cache = new Map();

const getCachedProducts = async (cacheKey, fetcher) => {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const data = await fetcher();
  cache.set(cacheKey, data);

  // Cache for 5 minutes
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

  return data;
};

// Usage
const featuredProducts = await getCachedProducts('featured-products', () =>
  getFeaturedProducts(8),
);
```

### 🎯 State Management

#### React Example

```javascript
// Custom hook for products
const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const data = await getProducts(page, 12, filters);
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    loadProducts,
    refresh: () => loadProducts(pagination?.currentPage || 1),
  };
};
```

### 🔍 Search Implementation

```javascript
// Debounced search
const useProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useMemo(
    () =>
      debounce(async term => {
        if (!term) {
          setResults([]);
          return;
        }

        setLoading(true);
        try {
          const data = await searchProducts(term);
          setResults(data.data.products);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setLoading(false);
        }
      }, 300),
    [],
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
  };
};
```

---

## Code Examples

### 🛍️ Customer Product Listing Component

```javascript
const ProductListing = () => {
  const [filters, setFilters] = useState({});
  const { products, pagination, loading, error, loadProducts } =
    useProducts(filters);

  const handleFilterChange = newFilters => {
    setFilters({ ...filters, ...newFilters });
  };

  const handlePageChange = page => {
    loadProducts(page);
  };

  if (loading) return <ProductListingSkeleton />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className='product-listing'>
      <ProductFilters filters={filters} onFilterChange={handleFilterChange} />

      <div className='product-grid'>
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      <Pagination pagination={pagination} onPageChange={handlePageChange} />
    </div>
  );
};
```

### 👑 Admin Product Management

```javascript
const AdminProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts(filters);
      setProducts(data.data.products);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async productId => {
    try {
      await toggleProductStatus(productId);
      toast.success('Product status updated');
      loadProducts(); // Refresh list
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async productId => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        toast.success('Product deleted');
        loadProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters]);

  return (
    <div className='admin-product-list'>
      <AdminProductFilters filters={filters} onFilterChange={setFilters} />

      <AdminProductTable
        products={products}
        loading={loading}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />
    </div>
  );
};
```

---

## 📱 Mobile Responsiveness

### API considerations for mobile

```javascript
// Smaller page sizes for mobile
const isMobile = window.innerWidth < 768;
const pageSize = isMobile ? 8 : 12;

// Lazy loading for better performance
const InfiniteProductList = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const data = await getProducts(page + 1, pageSize);
    setProducts(prev => [...prev, ...data.data.products]);
    setPage(page + 1);
    setHasMore(data.data.pagination.hasNextPage);
  };

  return (
    <InfiniteScroll
      dataLength={products.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<ProductCardSkeleton />}
    >
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </InfiniteScroll>
  );
};
```

---

**Happy coding! 🚀** If you need help with specific implementations or run into issues, refer to the error handling section or contact the backend team.
