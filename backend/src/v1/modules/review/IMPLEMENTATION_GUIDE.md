# Review System Implementation Guide

## Overview

This guide provides developers with practical implementation details for integrating the review system into the e-commerce platform. It covers both backend implementation and frontend integration patterns.

## Backend Implementation

### 1. Database Schema Overview

#### Review Model Structure

```javascript
{
  product: ObjectId,           // Reference to Product
  user: ObjectId,             // Reference to User
  order: ObjectId,            // Reference to Order (for purchase verification)
  rating: Number,             // 1-5 rating
  title: String,              // Review title (5-100 chars)
  comment: String,            // Review content (10-1000 chars)
  status: String,             // 'pending', 'approved', 'rejected'
  adminNotes: String,         // Admin moderation notes
  approvedBy: ObjectId,       // Admin who approved/rejected
  approvedAt: Date,           // Approval timestamp
  rejectedAt: Date,           // Rejection timestamp
  isVerifiedPurchase: Boolean, // Always true (verified through order)
  helpfulVotes: Number,       // User helpful votes
  reportCount: Number,        // Abuse reports
  images: [Object],           // Optional review images
  timestamps: true            // createdAt, updatedAt
}
```

#### Key Constraints

- **Unique Index**: `{ user: 1, product: 1 }` - Prevents duplicate reviews
- **Purchase Validation**: Custom validator ensures review is for purchased product
- **Status Workflow**: `pending` → `approved`/`rejected`

### 2. Core Business Logic

#### Purchase Verification Logic

```javascript
// Check if user can review product
const canUserReviewProduct = async (userId, productId) => {
  // 1. Check for existing review
  const existingReview = await Review.findOne({
    user: userId,
    product: productId,
  });
  if (existingReview) {
    return { canReview: false, reason: 'Already reviewed' };
  }

  // 2. Check for completed purchase
  const order = await Order.findOne({
    user: userId,
    status: { $in: ['delivered', 'completed'] },
    'items.product': productId,
  });

  if (!order) {
    return { canReview: false, reason: 'Must purchase first' };
  }

  return { canReview: true, orderId: order._id };
};
```

#### Review Statistics Calculation

```javascript
// Calculate product review statistics
const getProductReviewStats = async productId => {
  const stats = await Review.aggregate([
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
        ratingDistribution: { $push: '$rating' },
      },
    },
  ]);

  // Process rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (stats.length > 0) {
    stats[0].ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });
  }

  return {
    totalReviews: stats[0]?.totalReviews || 0,
    averageRating: Math.round((stats[0]?.averageRating || 0) * 10) / 10,
    ratingDistribution: distribution,
  };
};
```

### 3. API Controller Patterns

#### Create Review Controller

```javascript
const createReview = async (req, res) => {
  try {
    // 1. Validate input with Zod
    const validationResult = createReviewSchema.safeParse(req.body);

    // 2. Check product exists
    const product = await Product.findById(productId);

    // 3. Verify purchase eligibility
    const eligibility = await Review.canUserReviewProduct(userId, productId);

    // 4. Create review with pending status
    const review = new Review({
      ...reviewData,
      status: 'pending',
    });

    // 5. Save and return response
    await review.save();
    res.status(201).json({ message: 'Review submitted for approval', review });
  } catch (error) {
    // Handle validation, duplicate, and server errors
  }
};
```

#### Admin Moderation Controller

```javascript
const moderateReview = async (req, res) => {
  try {
    // 1. Find pending review
    const review = await Review.findById(id);

    // 2. Check current status
    if (review.status !== 'pending') {
      return res.status(400).json({ message: 'Already processed' });
    }

    // 3. Apply moderation action
    if (action === 'approve') {
      await review.approve(adminId, notes);
    } else {
      await review.reject(adminId, notes);
    }

    // 4. Return updated review
    res.json({ message: `Review ${action}d`, review });
  } catch (error) {
    // Handle errors
  }
};
```

### 4. Database Optimization

#### Essential Indexes

```javascript
// Review collection indexes
reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // Prevent duplicates
reviewSchema.index({ product: 1, status: 1, createdAt: -1 }); // Product reviews
reviewSchema.index({ user: 1, status: 1, createdAt: -1 }); // User reviews
reviewSchema.index({ status: 1, createdAt: -1 }); // Admin moderation
```

#### Aggregation Queries

```javascript
// Get products with review stats
const getProductsWithReviews = async () => {
  return await Product.aggregate([
    {
      $lookup: {
        from: 'reviews',
        let: { productId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$product', '$$productId'] },
              status: 'approved',
            },
          },
          {
            $group: {
              _id: null,
              totalReviews: { $sum: 1 },
              averageRating: { $avg: '$rating' },
            },
          },
        ],
        as: 'reviewStats',
      },
    },
    {
      $addFields: {
        'reviewStats.totalReviews': {
          $ifNull: [{ $arrayElemAt: ['$reviewStats.totalReviews', 0] }, 0],
        },
        'reviewStats.averageRating': {
          $ifNull: [{ $arrayElemAt: ['$reviewStats.averageRating', 0] }, 0],
        },
      },
    },
  ]);
};
```

## Frontend Integration

### 1. Review Display Components

#### Product Review Summary Component

```javascript
// ReviewSummary.jsx
import React from 'react';

const ReviewSummary = ({ productId, stats }) => {
  const { totalReviews, averageRating, ratingDistribution } = stats;

  return (
    <div className='review-summary'>
      <div className='average-rating'>
        <span className='rating-value'>{averageRating}</span>
        <StarRating rating={averageRating} />
        <span className='review-count'>({totalReviews} reviews)</span>
      </div>

      <div className='rating-distribution'>
        {[5, 4, 3, 2, 1].map(rating => (
          <div key={rating} className='rating-bar'>
            <span>{rating} stars</span>
            <div className='bar'>
              <div
                className='fill'
                style={{
                  width: `${(ratingDistribution[rating] / totalReviews) * 100}%`,
                }}
              />
            </div>
            <span>{ratingDistribution[rating]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSummary;
```

#### Review List Component

```javascript
// ReviewList.jsx
import React, { useState, useEffect } from 'react';
import { getProductReviews } from '../api/reviewApi';

const ReviewList = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getProductReviews(productId, { page, limit: 10 });
      setReviews(response.reviews);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className='review-list'>
      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {pagination.hasNextPage && (
        <button onClick={() => fetchReviews(pagination.currentPage + 1)}>
          Load More Reviews
        </button>
      )}
    </div>
  );
};
```

### 2. Review Creation Form

#### Review Form Component

```javascript
// ReviewForm.jsx
import React, { useState, useEffect } from 'react';
import { checkReviewEligibility, createReview } from '../api/reviewApi';

const ReviewForm = ({ productId, onSuccess }) => {
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: [],
  });

  useEffect(() => {
    checkEligibility();
  }, [productId]);

  const checkEligibility = async () => {
    try {
      const response = await checkReviewEligibility(productId);
      setCanReview(response.canReview);
      if (!response.canReview) {
        setError(response.reason);
      }
    } catch (error) {
      setError('Failed to check review eligibility');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createReview({ productId, ...formData });
      onSuccess('Review submitted for admin approval');
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Checking review eligibility...</div>;
  if (!canReview) return <div>You cannot review this product: {error}</div>;

  return (
    <form onSubmit={handleSubmit} className='review-form'>
      <div className='rating-input'>
        <label>Rating:</label>
        <StarRatingInput
          value={formData.rating}
          onChange={rating => setFormData({ ...formData, rating })}
        />
      </div>

      <div className='title-input'>
        <label>Review Title:</label>
        <input
          type='text'
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          minLength={5}
          maxLength={100}
          required
        />
      </div>

      <div className='comment-input'>
        <label>Your Review:</label>
        <textarea
          value={formData.comment}
          onChange={e => setFormData({ ...formData, comment: e.target.value })}
          minLength={10}
          maxLength={1000}
          required
        />
      </div>

      <button type='submit' disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};
```

### 3. Admin Review Management

#### Admin Review Dashboard

```javascript
// AdminReviewDashboard.jsx
import React, { useState, useEffect } from 'react';
import { getAllReviews, moderateReview } from '../api/adminApi';

const AdminReviewDashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [filters, setFilters] = useState({
    status: 'pending',
    page: 1,
  });

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      const response = await getAllReviews(filters);
      setReviews(response.reviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleModeration = async (reviewId, action, notes = '') => {
    try {
      await moderateReview(reviewId, { action, notes });
      // Refresh reviews list
      fetchReviews();
    } catch (error) {
      console.error('Failed to moderate review:', error);
    }
  };

  return (
    <div className='admin-review-dashboard'>
      <div className='filters'>
        <select
          value={filters.status}
          onChange={e =>
            setFilters({ ...filters, status: e.target.value, page: 1 })
          }
        >
          <option value='all'>All Reviews</option>
          <option value='pending'>Pending</option>
          <option value='approved'>Approved</option>
          <option value='rejected'>Rejected</option>
        </select>
      </div>

      <div className='review-list'>
        {reviews.map(review => (
          <AdminReviewCard
            key={review.id}
            review={review}
            onModerate={handleModeration}
          />
        ))}
      </div>
    </div>
  );
};
```

### 4. API Integration Utilities

#### Review API Service

```javascript
// api/reviewApi.js
const API_BASE = '/api/v1/reviews';

export const reviewApi = {
  // Public endpoints
  getProductReviews: async (productId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/product/${productId}?${query}`);
    return response.json();
  },

  // User endpoints (require auth)
  createReview: async reviewData => {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(reviewData),
    });
    return response.json();
  },

  getUserReviews: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/my-reviews?${query}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return response.json();
  },

  checkReviewEligibility: async productId => {
    const response = await fetch(`${API_BASE}/eligibility/${productId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return response.json();
  },

  // Admin endpoints (require admin auth)
  getAllReviews: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}?${query}`, {
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
      },
    });
    return response.json();
  },

  moderateReview: async (reviewId, data) => {
    const response = await fetch(`${API_BASE}/${reviewId}/moderate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
```

### 5. State Management Integration

#### Redux Actions and Reducers

```javascript
// store/reviewSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewApi } from '../api/reviewApi';

// Async thunks
export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchProductReviews',
  async ({ productId, params }) => {
    const response = await reviewApi.getProductReviews(productId, params);
    return response;
  },
);

export const createReview = createAsyncThunk(
  'reviews/createReview',
  async reviewData => {
    const response = await reviewApi.createReview(reviewData);
    return response;
  },
);

// Slice
const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    productReviews: {},
    userReviews: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProductReviews.pending, state => {
        state.loading = true;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        const { productId } = action.meta.arg;
        state.productReviews[productId] = action.payload;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default reviewSlice.reducer;
```

## Testing Strategy

### 1. Unit Tests

```javascript
// tests/review.test.js
describe('Review Model', () => {
  test('should prevent duplicate reviews', async () => {
    const reviewData = { user: userId, product: productId /* ... */ };

    // Create first review
    const review1 = new Review(reviewData);
    await review1.save();

    // Attempt duplicate review
    const review2 = new Review(reviewData);
    await expect(review2.save()).rejects.toThrow();
  });

  test('should validate purchase before allowing review', async () => {
    const canReview = await Review.canUserReviewProduct(userId, productId);
    expect(canReview.canReview).toBe(false);
    expect(canReview.reason).toBe(
      'You can only review products you have purchased',
    );
  });
});
```

### 2. Integration Tests

```javascript
// tests/review-api.test.js
describe('Review API', () => {
  test('POST /reviews should create review for purchased product', async () => {
    const reviewData = {
      productId: purchasedProductId,
      rating: 5,
      title: 'Great product',
      comment: 'Really satisfied with this purchase',
    };

    const response = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send(reviewData)
      .expect(201);

    expect(response.body.review.status).toBe('pending');
  });
});
```

## Deployment Considerations

### 1. Environment Variables

```bash
# .env
REVIEW_IMAGE_UPLOAD_LIMIT=5
REVIEW_MODERATION_WEBHOOK_URL=https://your-app.com/webhooks/review-moderation
ADMIN_NOTIFICATION_EMAIL=admin@your-app.com
```

### 2. Performance Monitoring

- Monitor review creation rate for spam detection
- Track admin moderation response times
- Cache review statistics for popular products
- Set up alerts for high report counts

### 3. Content Moderation

- Implement automated content filtering
- Set up moderation queue prioritization
- Consider third-party moderation services
- Implement user reporting system

This implementation guide provides a comprehensive foundation for building a robust review system with proper purchase verification, admin moderation, and excellent user experience.
