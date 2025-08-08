# 📦 Frontend Developer API Guide - Order Module

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Order Management Endpoints](#order-management-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Code Examples](#code-examples)

---

## API Overview

### 🌐 Base URL

```
Development: http://localhost:5000/api/v1/orders
Production: https://your-domain.com/api/v1/orders
```

### 📋 Complete Endpoint List

```
// PUBLIC ENDPOINTS
GET    /orders/track/:orderNumber        // Track order status (public)

// CUSTOMER ENDPOINTS (Authentication Required)
POST   /orders                          // Place new order
GET    /orders/my-orders                // Get user's orders
GET    /orders/:orderNumber             // Get order details
PATCH  /orders/:orderNumber/cancel      // Cancel order

// ADMIN ENDPOINTS (Admin/Moderator Access Required)
GET    /orders                          // Get all orders (admin)
PUT    /orders/:orderNumber/status      // Update order status (admin)
GET    /orders/analytics/summary        // Order analytics (admin)
```

---

## Authentication

### 🔐 Customer Authentication

```javascript
const headers = {
  Authorization: `Bearer ${userToken}`,
  'Content-Type': 'application/json',
};
```

### 👑 Admin Authentication

```javascript
const adminHeaders = {
  Authorization: `Bearer ${adminToken}`,
  'Content-Type': 'application/json',
};
```

---

## Order Management Endpoints

### 🛒 Place Order

**Endpoint**: `POST /orders`

#### Request Body

```javascript
{
  shippingAddress: {
    fullName: string,         // Required
    phone: string,            // Required
    email?: string,           // Optional
    street: string,           // Required
    city: string,             // Required
    state: string,            // Required
    postalCode: string,       // Required
    country?: string,         // Default: "Bangladesh"
    landmark?: string,        // Optional
    addressType?: string      // "home" | "office" | "other"
  },
  billingAddress?: {          // Optional (same as shipping if not provided)
    // Same structure as shippingAddress
  },
  sameAsBilling?: boolean,    // Default: true
  paymentMethod: string,      // "cash_on_delivery" | "bkash" | "nagad" | "rocket" | "bank_transfer" | "card"
  shippingMethod?: string,    // "standard" | "express" | "overnight" | "pickup"
  couponCode?: string,        // Optional coupon code
  notes?: string,             // Customer notes
  guestInfo?: {               // Required for guest orders
    email: string,
    phone: string
  },
  cartItems?: [               // Required for guest orders OR when using local cart
    {
      productId: string,      // Required: Product ID
      quantity: number,       // Required: Quantity (min: 1)
      variant?: {             // Optional: Product variant
        variantId?: string,
        color?: string,
        size?: string,
        sku?: string
      }
      // NOTE: Prices are automatically fetched from database for security
      // Do NOT include price or discountPrice in the request
    }
  ]
}
```

**Note**:

- For **registered users** with database cart: Only provide order details (shipping, payment, etc.)
- For **guest orders** or **local cart**: Include `cartItems` array with product details
- For **guest orders**: `guestInfo` is required

````

#### Usage

```javascript
const placeOrder = async orderData => {
  const response = await fetch('/api/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Example 1: Registered User with Database Cart
const registeredUserOrder = {
  shippingAddress: {
    fullName: 'John Doe',
    phone: '+8801234567890',
    email: 'john@example.com',
    street: '123 Main Street, Apartment 4B',
    city: 'Dhaka',
    state: 'Dhaka',
    postalCode: '1000',
    country: 'Bangladesh',
    addressType: 'home',
  },
  paymentMethod: 'cash_on_delivery',
  shippingMethod: 'standard',
  couponCode: 'SAVE10',
  notes: 'Please call before delivery',
  // No cartItems needed - will use database cart
};

// Example 2: Guest Order with Local Cart
const guestOrder = {
  shippingAddress: {
    fullName: 'Jane Smith',
    phone: '+8801987654321',
    street: '456 Guest Street',
    city: 'Chittagong',
    state: 'Chittagong',
    postalCode: '4000',
    country: 'Bangladesh',
    addressType: 'home',
  },
  paymentMethod: 'bkash',
  shippingMethod: 'express',
  guestInfo: {
    email: 'jane.guest@example.com',
    phone: '+8801987654321'
  },
  cartItems: [
    {
      productId: '64f123456789abcdef123456',
      quantity: 2,
      variant: {
        variantId: '64f123456789abcdef123457',
        color: 'Red',
        size: 'L',
        sku: 'TSHIRT-RED-L'
      },
      price: 29.99,
      discountPrice: 24.99
    },
    {
      productId: '64f123456789abcdef123458',
      quantity: 1,
      price: 49.99
      // No variant or discount for this item
    }
  ]
};

// Example 3: Registered User with Local Cart Override
const registeredUserWithLocalCart = {
  shippingAddress: {
    fullName: 'Bob Wilson',
    phone: '+8801555666777',
    street: '789 Override Avenue',
    city: 'Sylhet',
    state: 'Sylhet',
    postalCode: '3100',
    addressType: 'office',
  },
  paymentMethod: 'card',
  cartItems: [
    // Provide cartItems to override database cart
    {
      productId: '64f123456789abcdef123459',
      quantity: 3,
      price: 15.99,
      discountPrice: 12.99
    }
  ]
};

try {
  // For registered users
  const result1 = await placeOrder(registeredUserOrder);

  // For guest users (no authentication header needed)
  const result2 = await fetch('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guestOrder),
  });

  console.log('Orders placed successfully');
} catch (error) {
  console.error('Order placement failed:', error.message);
}
````

#### Response Structure

```javascript
{
  "message": "Order placed successfully",
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-1642234567890-123",
      "user": "507f1f77bcf86cd799439010",
      "customerType": "registered",
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "iPhone 15 Pro",
            "slug": "iphone-15-pro"
          },
          "quantity": 2,
          "variant": {
            "variantId": "507f1f77bcf86cd799439014",
            "color": "space black",
            "size": "128GB",
            "sku": "IPH15P-SPACEBLACK-128GB"
          },
          "price": 999,
          "discountPrice": 899,
          "effectivePrice": 899,
          "lineTotal": 1798,
          "productSnapshot": {
            "name": "iPhone 15 Pro",
            "image": "/uploads/products/iphone-15-pro.jpg",
            "category": "Smartphones"
          }
        }
      ],
      "shippingAddress": {
        "fullName": "John Doe",
        "phone": "+8801234567890",
        "street": "123 Main Street",
        "city": "Dhaka",
        "state": "Dhaka",
        "postalCode": "1000",
        "country": "Bangladesh"
      },
      "payment": {
        "method": "cash_on_delivery",
        "status": "pending"
      },
      "pricing": {
        "subtotal": 1798,
        "itemDiscount": 0,
        "couponDiscount": 179.8,
        "shippingCost": 0,
        "tax": 0,
        "total": 1618.2
      },
      "shipping": {
        "method": "standard",
        "cost": 0,
        "estimatedDelivery": "2024-01-20T10:30:00Z"
      },
      "status": "pending",
      "placedAt": "2024-01-15T10:30:00Z"
    },
    "orderNumber": "ORD-1642234567890-123",
    "estimatedDelivery": "2024-01-20T10:30:00Z"
  }
}
```

### 📋 Get User Orders

**Endpoint**: `GET /orders/my-orders`

#### Query Parameters

```javascript
page: number,         // Page number (default: 1)
limit: number,        // Items per page (default: 10, max: 50)
status: string,       // Filter by status
sortBy: string,       // Sort field (default: 'placedAt')
sortOrder: string     // 'asc' | 'desc' (default: 'desc')
```

#### Usage

```javascript
const getUserOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters);

  const response = await fetch(`/api/v1/orders/my-orders?${params}`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  return response.json();
};

// Example usage
const orders = await getUserOrders({
  page: 1,
  limit: 10,
  status: 'delivered',
  sortBy: 'placedAt',
  sortOrder: 'desc',
});
```

#### Response Structure

```javascript
{
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "orderNumber": "ORD-1642234567890-123",
        "status": "delivered",
        "placedAt": "2024-01-15T10:30:00Z",
        "deliveredAt": "2024-01-18T14:30:00Z",
        "pricing": {
          "total": 1618.2
        },
        "itemCount": 2,
        "canBeCancelled": false,
        "canBeReturned": true,
        "items": [
          {
            "productSnapshot": {
              "name": "iPhone 15 Pro",
              "image": "/uploads/products/iphone-15-pro.jpg"
            },
            "quantity": 2
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 🔍 Get Order Details

**Endpoint**: `GET /orders/:orderNumber`

#### Usage

```javascript
const getOrderDetails = async orderNumber => {
  const response = await fetch(`/api/v1/orders/${orderNumber}`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Order not found');
  }

  return response.json();
};

// Example usage
const orderDetails = await getOrderDetails('ORD-1642234567890-123');
```

### 🚫 Cancel Order

**Endpoint**: `PATCH /orders/:orderNumber/cancel`

#### Request Body

```javascript
{
  reason: string; // Required: Cancellation reason
}
```

#### Usage

```javascript
const cancelOrder = async (orderNumber, reason) => {
  const response = await fetch(`/api/v1/orders/${orderNumber}/cancel`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Example usage
await cancelOrder('ORD-1642234567890-123', 'Changed my mind');
```

### 📍 Track Order

**Endpoint**: `GET /orders/track/:orderNumber`

#### Usage

```javascript
const trackOrder = async orderNumber => {
  const response = await fetch(`/api/v1/orders/track/${orderNumber}`);

  if (!response.ok) {
    throw new Error('Order not found');
  }

  return response.json();
};

// Example usage (public access)
const tracking = await trackOrder('ORD-1642234567890-123');
```

#### Response Structure

```javascript
{
  "message": "Order tracking information retrieved successfully",
  "data": {
    "orderNumber": "ORD-1642234567890-123",
    "currentStatus": "shipped",
    "placedAt": "2024-01-15T10:30:00Z",
    "estimatedDelivery": "2024-01-20T10:30:00Z",
    "trackingNumber": "TRK123456789",
    "carrier": "Express Delivery",
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00Z",
        "note": "Order received",
        "isComplete": true
      },
      {
        "status": "confirmed",
        "timestamp": "2024-01-15T12:00:00Z",
        "note": "Order confirmed",
        "isComplete": true
      },
      {
        "status": "shipped",
        "timestamp": "2024-01-16T09:00:00Z",
        "note": "Order shipped",
        "isComplete": true
      }
    ],
    "milestones": [
      {
        "status": "pending",
        "label": "Order Placed",
        "timestamp": "2024-01-15T10:30:00Z",
        "isComplete": true,
        "description": "Your order has been received"
      },
      {
        "status": "confirmed",
        "label": "Order Confirmed",
        "timestamp": "2024-01-15T12:00:00Z",
        "isComplete": true,
        "description": "Your order has been confirmed"
      },
      {
        "status": "shipped",
        "label": "Shipped",
        "timestamp": "2024-01-16T09:00:00Z",
        "isComplete": true,
        "description": "Your order has been shipped"
      },
      {
        "status": "delivered",
        "label": "Delivered",
        "timestamp": null,
        "isComplete": false,
        "description": "Your order will be delivered"
      }
    ],
    "currentStep": 3,
    "totalSteps": 6,
    "summary": {
      "totalAmount": 1618.2,
      "itemCount": 2,
      "status": "shipped",
      "canBeCancelled": false
    }
  }
}
```

---

## Admin Endpoints

### 👑 Get All Orders (Admin)

**Endpoint**: `GET /orders`

#### Query Parameters

```javascript
page: number,           // Page number
limit: number,          // Items per page
status: string,         // Filter by status
paymentStatus: string,  // Filter by payment status
customerType: string,   // 'registered' | 'guest'
startDate: string,      // ISO date string
endDate: string,        // ISO date string
search: string,         // Search term
sortBy: string,         // Sort field
sortOrder: string       // 'asc' | 'desc'
```

#### Usage

```javascript
const getAllOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters);

  const response = await fetch(`/api/v1/orders?${params}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  return response.json();
};
```

### ✏️ Update Order Status (Admin)

**Endpoint**: `PUT /orders/:orderNumber/status`

#### Request Body

```javascript
{
  status: string,         // Required: New status
  note?: string,          // Optional: Status change note
  trackingNumber?: string, // Optional: Tracking number
  carrier?: string,       // Optional: Shipping carrier
  cancelReason?: string,  // Optional: Cancellation reason
  returnReason?: string   // Optional: Return reason
}
```

#### Usage

```javascript
const updateOrderStatus = async (orderNumber, statusData) => {
  const response = await fetch(`/api/v1/orders/${orderNumber}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(statusData),
  });

  return response.json();
};

// Example usage
await updateOrderStatus('ORD-1642234567890-123', {
  status: 'shipped',
  note: 'Order dispatched via Express Delivery',
  trackingNumber: 'TRK123456789',
  carrier: 'Express Delivery',
});
```

### 📊 Get Order Analytics (Admin)

**Endpoint**: `GET /orders/analytics/summary`

#### Query Parameters

```javascript
startDate?: string,     // ISO date string
endDate?: string,       // ISO date string
period?: string,        // 'daily' | 'weekly' | 'monthly'
status?: string         // Filter by status
```

#### Usage

```javascript
const getOrderAnalytics = async (params = {}) => {
  const queryParams = new URLSearchParams(params);

  const response = await fetch(
    `/api/v1/orders/analytics/summary?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    },
  );

  return response.json();
};
```

---

## Error Handling

### 🚨 Error Response Formats

#### Validation Error (400)

```javascript
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "shippingAddress.fullName",
      "message": "Full name is required",
      "value": ""
    }
  ]
}
```

#### Stock Error (400)

```javascript
{
  "message": "Insufficient stock for \"iPhone 15 Pro\". Only 3 available",
  "availableStock": 3,
  "requestedQuantity": 5
}
```

#### Order Not Found (404)

```javascript
{
  "message": "Order not found"
}
```

#### Invalid Status Transition (400)

```javascript
{
  "message": "Cannot change status from \"delivered\" to \"processing\"",
  "currentStatus": "delivered",
  "requestedStatus": "processing"
}
```

### 🛡️ Error Handling Utilities

```javascript
const handleOrderError = (error, operation = '') => {
  console.error(`Order ${operation} error:`, error);

  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        if (data.errors) {
          return {
            type: 'validation',
            message: 'Please check your input',
            errors: data.errors,
          };
        }
        if (data.availableStock !== undefined) {
          return {
            type: 'stock',
            message: data.message,
            availableStock: data.availableStock,
          };
        }
        return {
          type: 'business',
          message: data.message,
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
          message: 'Order not found',
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

#### React Order Management Hook

```javascript
import { useState, useCallback, useEffect } from 'react';

const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user orders
  const loadOrders = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getUserOrders(filters);
      setOrders(data.data.orders);
      return data.data;
    } catch (err) {
      const errorInfo = handleOrderError(err, 'loading orders');
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setLoading(false);
    }
  }, []);

  // Place new order
  const placeOrder = useCallback(
    async orderData => {
      setLoading(true);
      setError(null);

      try {
        const result = await placeOrder(orderData);
        await loadOrders(); // Refresh orders list
        return result;
      } catch (err) {
        const errorInfo = handleOrderError(err, 'placing order');
        setError(errorInfo);
        throw errorInfo;
      } finally {
        setLoading(false);
      }
    },
    [loadOrders],
  );

  // Get order details
  const getOrderDetails = useCallback(async orderNumber => {
    setLoading(true);
    setError(null);

    try {
      const result = await getOrderDetails(orderNumber);
      setCurrentOrder(result.data.order);
      return result.data.order;
    } catch (err) {
      const errorInfo = handleOrderError(err, 'loading order details');
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel order
  const cancelOrder = useCallback(
    async (orderNumber, reason) => {
      try {
        const result = await cancelOrder(orderNumber, reason);
        await loadOrders(); // Refresh orders list
        return result;
      } catch (err) {
        const errorInfo = handleOrderError(err, 'cancelling order');
        setError(errorInfo);
        throw errorInfo;
      }
    },
    [loadOrders],
  );

  // Track order
  const trackOrder = useCallback(async orderNumber => {
    try {
      const result = await trackOrder(orderNumber);
      return result.data;
    } catch (err) {
      const errorInfo = handleOrderError(err, 'tracking order');
      setError(errorInfo);
      throw errorInfo;
    }
  }, []);

  return {
    orders,
    currentOrder,
    loading,
    error,
    loadOrders,
    placeOrder,
    getOrderDetails,
    cancelOrder,
    trackOrder,
    clearError: () => setError(null),
  };
};
```

---

## Code Examples

### 🛒 Checkout Flow

```javascript
const CheckoutPage = () => {
  const { cart } = useCartContext();
  const { placeOrder } = useOrders();
  const [formData, setFormData] = useState({
    shippingAddress: {},
    paymentMethod: 'cash_on_delivery',
    shippingMethod: 'standard',
  });

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const result = await placeOrder(formData);
      toast.success('Order placed successfully!');
      navigate(`/orders/${result.data.orderNumber}`);
    } catch (error) {
      if (error.type === 'stock') {
        toast.error(`Stock issue: ${error.message}`);
      } else if (error.type === 'validation') {
        toast.error('Please check your information');
      } else {
        toast.error('Failed to place order');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ShippingAddressForm
        value={formData.shippingAddress}
        onChange={address =>
          setFormData({
            ...formData,
            shippingAddress: address,
          })
        }
      />

      <PaymentMethodSelector
        value={formData.paymentMethod}
        onChange={method =>
          setFormData({
            ...formData,
            paymentMethod: method,
          })
        }
      />

      <OrderSummary cart={cart} />

      <button type='submit'>Place Order</button>
    </form>
  );
};
```

### 📦 Order List Component

```javascript
const OrderList = () => {
  const { orders, loading, loadOrders } = useOrders();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    sortBy: 'placedAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadOrders(filters);
  }, [filters, loadOrders]);

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className='order-list'>
      <div className='filters'>
        <select
          value={filters.status}
          onChange={e =>
            setFilters({
              ...filters,
              status: e.target.value,
              page: 1,
            })
          }
        >
          <option value=''>All Orders</option>
          <option value='pending'>Pending</option>
          <option value='confirmed'>Confirmed</option>
          <option value='shipped'>Shipped</option>
          <option value='delivered'>Delivered</option>
          <option value='cancelled'>Cancelled</option>
        </select>
      </div>

      <div className='orders'>
        {orders.map(order => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    </div>
  );
};
```

### 📍 Order Tracking Component

```javascript
const OrderTracking = ({ orderNumber }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracking = async () => {
      try {
        const result = await trackOrder(orderNumber);
        setTracking(result);
      } catch (error) {
        toast.error('Failed to load tracking information');
      } finally {
        setLoading(false);
      }
    };

    loadTracking();
  }, [orderNumber]);

  if (loading) return <div>Loading tracking...</div>;
  if (!tracking) return <div>Tracking not available</div>;

  return (
    <div className='order-tracking'>
      <div className='tracking-header'>
        <h3>Order #{tracking.orderNumber}</h3>
        <span className='status'>{tracking.currentStatus}</span>
      </div>

      <div className='progress-bar'>
        <div
          className='progress'
          style={{
            width: `${(tracking.currentStep / tracking.totalSteps) * 100}%`,
          }}
        />
      </div>

      <div className='milestones'>
        {tracking.milestones.map((milestone, index) => (
          <div
            key={milestone.status}
            className={`milestone ${milestone.isComplete ? 'complete' : 'pending'}`}
          >
            <div className='milestone-icon'>
              {milestone.isComplete ? '✓' : index + 1}
            </div>
            <div className='milestone-content'>
              <h4>{milestone.label}</h4>
              <p>{milestone.description}</p>
              {milestone.timestamp && (
                <time>
                  {new Date(milestone.timestamp).toLocaleDateString()}
                </time>
              )}
            </div>
          </div>
        ))}
      </div>

      {tracking.trackingNumber && (
        <div className='shipping-info'>
          <p>Tracking Number: {tracking.trackingNumber}</p>
          <p>Carrier: {tracking.carrier}</p>
        </div>
      )}
    </div>
  );
};
```

---

**Happy shopping! 📦** Use this guide to build comprehensive order management functionality for your e-commerce application.
