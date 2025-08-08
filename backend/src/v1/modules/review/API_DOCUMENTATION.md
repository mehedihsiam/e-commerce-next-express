# Review System API Documentation

## Overview

The Review System allows registered users to review products they have purchased. All reviews require admin approval before being displayed publicly. This ensures quality control and prevents spam or inappropriate content.

## Key Features

- ✅ **Purchase Verification**: Users can only review products they have actually purchased
- ✅ **One Review Per Product**: Each user can write only one review per product
- ✅ **Admin Moderation**: All reviews require admin approval before being published
- ✅ **Rich Review Data**: Includes rating, title, comment, and optional images
- ✅ **Review Statistics**: Automatic calculation of average ratings and distribution
- ✅ **Comprehensive Filtering**: Filter reviews by rating, date, and other criteria

## API Endpoints

### Public Endpoints

#### Get Product Reviews

```http
GET /api/v1/reviews/product/{productId}
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `sortBy` (enum): `createdAt`, `rating`, `helpfulVotes` (default: `createdAt`)
- `sortOrder` (enum): `asc`, `desc` (default: `desc`)
- `rating` (number): Filter by specific rating (1-5)

**Response:**

```json
{
  "message": "Product reviews retrieved successfully",
  "reviews": [
    {
      "id": "64a123456789abcdef123456",
      "user": {
        "name": "John Doe"
      },
      "rating": 5,
      "title": "Excellent product!",
      "comment": "Really satisfied with this purchase. Quality is outstanding.",
      "images": [
        {
          "url": "https://example.com/review-image.jpg",
          "alt": "Product in use"
        }
      ],
      "isVerifiedPurchase": true,
      "helpfulVotes": 12,
      "createdAt": "2025-08-01T10:30:00.000Z",
      "isRecent": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalReviews": 47,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "statistics": {
    "totalReviews": 47,
    "averageRating": 4.3,
    "ratingDistribution": {
      "1": 2,
      "2": 3,
      "3": 8,
      "4": 15,
      "5": 19
    }
  }
}
```

### User Endpoints (Require Authentication)

#### Create Review

```http
POST /api/v1/reviews
Authorization: Bearer {user_token}
```

**Request Body:**

```json
{
  "productId": "64a123456789abcdef123456",
  "rating": 5,
  "title": "Great product!",
  "comment": "I'm very satisfied with this purchase. The quality exceeds my expectations.",
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt": "Product photo"
    }
  ]
}
```

**Response:**

```json
{
  "message": "Review submitted successfully and is pending admin approval",
  "review": {
    "id": "64a123456789abcdef123456",
    "product": {
      "id": "64a123456789abcdef123457",
      "name": "Product Name"
    },
    "user": {
      "id": "64a123456789abcdef123458",
      "name": "John Doe"
    },
    "rating": 5,
    "title": "Great product!",
    "comment": "I'm very satisfied with this purchase...",
    "images": [...],
    "status": "pending",
    "isVerifiedPurchase": true,
    "createdAt": "2025-08-08T10:30:00.000Z"
  }
}
```

#### Get User's Reviews

```http
GET /api/v1/reviews/my-reviews
Authorization: Bearer {user_token}
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `status` (enum): `all`, `pending`, `approved`, `rejected` (default: `all`)
- `sortBy` (enum): `createdAt`, `rating` (default: `createdAt`)
- `sortOrder` (enum): `asc`, `desc` (default: `desc`)

#### Check Review Eligibility

```http
GET /api/v1/reviews/eligibility/{productId}
Authorization: Bearer {user_token}
```

**Response:**

```json
{
  "message": "Review eligibility checked",
  "canReview": true,
  "reason": null,
  "orderId": "64a123456789abcdef123459"
}
```

**Response (Cannot Review):**

```json
{
  "message": "Review eligibility checked",
  "canReview": false,
  "reason": "You have already reviewed this product",
  "orderId": null
}
```

### Admin Endpoints (Require Admin Authentication)

#### Get All Reviews (Admin)

```http
GET /api/v1/reviews
Authorization: Bearer {admin_token}
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (enum): `all`, `pending`, `approved`, `rejected` (default: `all`)
- `sortBy` (enum): `createdAt`, `rating`, `status` (default: `createdAt`)
- `sortOrder` (enum): `asc`, `desc` (default: `desc`)
- `search` (string): Search in title or comment

#### Moderate Review (Admin)

```http
PATCH /api/v1/reviews/{id}/moderate
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "action": "approve", // or "reject"
  "notes": "Review meets quality standards"
}
```

**Response:**

```json
{
  "message": "Review approved successfully",
  "review": {
    "id": "64a123456789abcdef123456",
    "product": {...},
    "user": {...},
    "rating": 5,
    "title": "Great product!",
    "comment": "...",
    "status": "approved",
    "adminNotes": "Review meets quality standards",
    "moderatedBy": {
      "id": "64a123456789abcdef123460",
      "name": "Admin User"
    },
    "createdAt": "2025-08-01T10:30:00.000Z",
    "moderatedAt": "2025-08-08T15:45:00.000Z"
  }
}
```

## Business Rules

### Review Creation Rules

1. **Authentication Required**: Only logged-in users can create reviews
2. **Purchase Verification**: Users can only review products from their completed/delivered orders
3. **One Review Per Product**: Each user can write only one review per product
4. **Content Requirements**: Reviews must have a title (5-100 chars) and comment (10-1000 chars)
5. **Rating Requirement**: Rating must be between 1-5 (whole numbers only)
6. **Auto-Pending**: All new reviews automatically set to "pending" status

### Admin Moderation Rules

1. **Review Status**: Reviews can be `pending`, `approved`, or `rejected`
2. **Public Visibility**: Only `approved` reviews are shown to public
3. **Admin Notes**: Admins can add notes when approving/rejecting reviews
4. **Audit Trail**: System tracks who moderated each review and when

### Display Rules

1. **Public Access**: Anyone can view approved reviews (no auth required)
2. **User Access**: Users can view all their own reviews regardless of status
3. **Admin Access**: Admins can view all reviews with full moderation tools
4. **Statistics**: Review statistics only include approved reviews

## Integration with Product Listings

### Frontend Integration Example

```javascript
// Get product with reviews
const getProductWithReviews = async productId => {
  const [product, reviews, reviewStats] = await Promise.all([
    fetch(`/api/v1/products/${productId}`),
    fetch(`/api/v1/reviews/product/${productId}?limit=5`),
    fetch(`/api/v1/reviews/product/${productId}/stats`),
  ]);

  return {
    product: await product.json(),
    reviews: await reviews.json(),
    stats: await reviewStats.json(),
  };
};

// Check if user can review before showing review form
const canUserReview = async (productId, userToken) => {
  const response = await fetch(`/api/v1/reviews/eligibility/${productId}`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  const result = await response.json();
  return result.canReview;
};
```

### Product Listing Enhancement

To include review data in product listings, you can:

1. **Add Review Stats to Product Response**: Modify product controllers to include review statistics
2. **Aggregate Queries**: Use MongoDB aggregation to efficiently fetch products with review data
3. **Caching**: Cache review statistics for better performance on popular products

## Error Handling

### Common Error Responses

- **400 Bad Request**: Validation errors, invalid data format
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions (non-admin trying admin actions)
- **404 Not Found**: Product, review, or user not found
- **409 Conflict**: User already reviewed this product
- **500 Internal Server Error**: Server-side errors

### Validation Error Examples

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "rating",
      "message": "Rating must be between 1 and 5"
    },
    {
      "field": "comment",
      "message": "Review comment must be at least 10 characters"
    }
  ]
}
```

## Security Considerations

### Data Protection

- User email addresses are only shown to admins
- Review content is validated and sanitized
- Image URLs are validated for proper format
- Admin notes are only visible to admins and moderators

### Purchase Verification

- Reviews are linked to specific orders for verification
- System validates that the order belongs to the reviewing user
- Only completed/delivered orders allow reviews
- Product must exist in the order's item list

### Abuse Prevention

- Rate limiting on review creation
- Admin moderation prevents spam and inappropriate content
- Report system for flagging problematic reviews
- Automatic tracking of helpful votes and reports

## Performance Optimization

### Database Indexes

- Compound index on `user` + `product` for duplicate prevention
- Index on `product` + `status` + `createdAt` for efficient querying
- Text indexes on title and comment for search functionality

### Caching Strategy

- Cache review statistics for products (Redis recommended)
- Cache recent reviews for popular products
- Use pagination to limit data transfer

### Best Practices

- Use aggregation pipelines for complex queries
- Implement proper pagination for large review lists
- Consider implementing review helpful voting system
- Monitor review submission patterns for abuse detection
