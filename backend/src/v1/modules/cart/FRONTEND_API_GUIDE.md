# 🛒 Frontend Developer API Guide - Cart Module

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Cart Management Endpoints](#cart-management-endpoints)
4. [Response Formats](#response-formats)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Code Examples](#code-examples)
8. [Integration Patterns](#integration-patterns)

---

## API Overview

### 🌐 Base URL

```
Development: http://localhost:5000/api/v1/cart
Production: https://your-domain.com/api/v1/cart
```

### 📋 Complete Endpoint List

```
// CART MANAGEMENT (Authentication Required)
GET    /cart                          // Get user's cart with validation
GET    /cart/summary                  // Get cart totals only
GET    /cart/validate                 // Validate cart contents
POST   /cart/add                      // Add item to cart
PUT    /cart/items/:itemId            // Update item quantity
DELETE /cart/items/:itemId            // Remove specific item
DELETE /cart/clear                    // Clear entire cart
```

---

## Authentication

### 🔐 Required Authentication

All cart endpoints require user authentication:

```javascript
const headers = {
  Authorization: `Bearer ${userToken}`,
  'Content-Type': 'application/json',
};
```

---

## Cart Management Endpoints

### 🛍️ Get User's Cart

**Endpoint**: `GET /cart`

#### Usage

```javascript
const getCart = async () => {
  const response = await fetch('/api/v1/cart', {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cart: ${response.statusText}`);
  }

  return response.json();
};
```

#### Response Structure

```javascript
{
  "message": "Cart retrieved successfully",
  "data": {
    "cart": {
      "_id": "507f1f77bcf86cd799439011",
      "user": "507f1f77bcf86cd799439010",
      "items": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "product": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "iPhone 15 Pro",
            "slug": "iphone-15-pro",
            "images": [
              {
                "url": "/uploads/products/iphone-15-pro.jpg",
                "alt": "iPhone 15 Pro"
              }
            ],
            "price": 999,
            "discountPrice": 899,
            "isActive": true,
            "hasVariants": true,
            "category": {
              "name": "Smartphones",
              "slug": "smartphones"
            }
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
          "productSnapshot": {
            "name": "iPhone 15 Pro",
            "image": "/uploads/products/iphone-15-pro.jpg",
            "category": "Smartphones"
          },
          "addedAt": "2024-01-15T10:30:00Z",
          "updatedAt": "2024-01-15T10:30:00Z"
        }
      ],
      "totals": {
        "itemCount": 2,
        "subtotal": 1998,
        "totalDiscount": 200,
        "finalTotal": 1798
      },
      "status": "active",
      "lastActivity": "2024-01-15T10:30:00Z"
    },
    "summary": {
      "totalItems": 2,
      "isEmpty": false,
      "subtotal": 1998,
      "totalDiscount": 200,
      "finalTotal": 1798,
      "itemCount": 2,
      "hasIssues": false
    },
    "validationIssues": null
  }
}
```

### 📊 Get Cart Summary

**Endpoint**: `GET /cart/summary`

#### Usage

```javascript
const getCartSummary = async () => {
  const response = await fetch('/api/v1/cart/summary', {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });
  return response.json();
};
```

#### Response Structure

```javascript
{
  "message": "Cart summary retrieved successfully",
  "data": {
    "summary": {
      "totalItems": 3,
      "itemCount": 3,
      "subtotal": 2997,
      "totalDiscount": 300,
      "finalTotal": 2697,
      "isEmpty": false,
      "cartAge": 2,
      "lastActivity": "2024-01-15T10:30:00Z",
      "itemDetails": [
        {
          "productId": "507f1f77bcf86cd799439013",
          "productName": "iPhone 15 Pro",
          "quantity": 2,
          "price": 999,
          "discountPrice": 899,
          "effectivePrice": 899,
          "lineTotal": 1798,
          "variant": {
            "color": "space black",
            "size": "128GB"
          }
        }
      ]
    }
  }
}
```

### ✅ Validate Cart

**Endpoint**: `GET /cart/validate`

#### Query Parameters

```javascript
includeDetails: boolean; // Include valid items in response (default: false)
```

#### Usage

```javascript
const validateCart = async (includeDetails = false) => {
  const response = await fetch(
    `/api/v1/cart/validate?includeDetails=${includeDetails}`,
    {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
  );
  return response.json();
};
```

#### Response Structure

```javascript
{
  "message": "Cart validation completed",
  "data": {
    "isValid": false,
    "needsAttention": true,
    "isEmpty": false,
    "summary": {
      "totalItems": 3,
      "validItems": 2,
      "itemsWithErrors": 1,
      "itemsWithWarnings": 0,
      "canProceedToCheckout": false
    },
    "issues": [
      {
        "itemId": "507f1f77bcf86cd799439012",
        "productId": "507f1f77bcf86cd799439013",
        "productName": "iPhone 15 Pro",
        "quantity": 5,
        "variant": {
          "color": "space black",
          "size": "128GB"
        },
        "issues": [
          {
            "type": "insufficient_stock",
            "severity": "warning",
            "message": "Only 3 items available (requested: 5)",
            "availableStock": 3,
            "requestedQuantity": 5
          }
        ]
      }
    ]
  }
}
```

### ➕ Add Item to Cart

**Endpoint**: `POST /cart/add`

#### Request Body

```javascript
{
  productId: string,        // Required: Product ID
  quantity: number,         // Optional: Default 1
  variantId?: string,       // Optional: Specific variant ID
  variant?: {               // Optional: Variant selection
    color?: string,
    size?: string
  }
}
```

#### Usage

```javascript
// Add simple product
const addSimpleProduct = async (productId, quantity = 1) => {
  const response = await fetch('/api/v1/cart/add', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      quantity,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Add product with variant
const addVariantProduct = async (productId, quantity, variantSelection) => {
  const response = await fetch('/api/v1/cart/add', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      quantity,
      variant: variantSelection,
    }),
  });

  return response.json();
};

// Example usage
await addSimpleProduct('507f1f77bcf86cd799439013', 2);

await addVariantProduct('507f1f77bcf86cd799439013', 1, {
  color: 'space black',
  size: '128GB',
});
```

### ✏️ Update Item Quantity

**Endpoint**: `PUT /cart/items/:itemId`

#### Request Body

```javascript
{
  quantity: number; // Required: New quantity (minimum 1)
}
```

#### Usage

```javascript
const updateCartItem = async (itemId, quantity) => {
  const response = await fetch(`/api/v1/cart/items/${itemId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Example usage
await updateCartItem('507f1f77bcf86cd799439012', 3);
```

### 🗑️ Remove Item from Cart

**Endpoint**: `DELETE /cart/items/:itemId`

#### Usage

```javascript
const removeCartItem = async itemId => {
  const response = await fetch(`/api/v1/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Example usage
await removeCartItem('507f1f77bcf86cd799439012');
```

### 🗑️ Clear Cart

**Endpoint**: `DELETE /cart/clear`

#### Usage

```javascript
const clearCart = async () => {
  const response = await fetch('/api/v1/cart/clear', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Example usage with confirmation
const handleClearCart = async () => {
  if (confirm('Are you sure you want to clear your cart?')) {
    await clearCart();
    toast.success('Cart cleared successfully');
  }
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
      "field": "quantity",
      "message": "Quantity must be at least 1",
      "value": 0
    }
  ]
}
```

#### Stock Error (400)

```javascript
{
  "message": "Insufficient stock. Only 3 items available",
  "availableStock": 3,
  "requestedQuantity": 5
}
```

#### Product Not Found (404)

```javascript
{
  "message": "Product not found"
}
```

#### Cart Item Not Found (404)

```javascript
{
  "message": "Item not found in cart"
}
```

### 🛡️ Error Handling Utilities

```javascript
// Generic cart error handler
const handleCartError = (error, operation = '') => {
  console.error(`Cart ${operation} error:`, error);

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
        if (data.availableStock !== undefined) {
          // Stock errors
          return {
            type: 'stock',
            message: data.message,
            availableStock: data.availableStock,
          };
        }
        // Other business logic errors
        return {
          type: 'business',
          message: data.message,
        };

      case 401:
        return {
          type: 'auth',
          message: 'Please log in to access your cart',
        };

      case 404:
        return {
          type: 'notFound',
          message: data.message || 'Item not found',
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

#### React Cart Hook

```javascript
import { useState, useCallback, useEffect } from 'react';

const useCart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load cart
  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCart();
      setCart(data.data.cart);

      // Handle validation issues
      if (data.data.validationIssues?.length > 0) {
        toast.info('Your cart has been updated due to stock/price changes');
      }
    } catch (err) {
      const errorInfo = handleCartError(err, 'loading');
      setError(errorInfo);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item to cart
  const addItem = useCallback(
    async (productId, quantity, variant) => {
      try {
        const result = await addToCart(productId, quantity, variant);
        await loadCart(); // Refresh cart
        return result;
      } catch (err) {
        const errorInfo = handleCartError(err, 'adding item');
        setError(errorInfo);
        throw errorInfo;
      }
    },
    [loadCart],
  );

  // Update item quantity
  const updateItem = useCallback(
    async (itemId, quantity) => {
      try {
        const result = await updateCartItem(itemId, quantity);
        await loadCart(); // Refresh cart
        return result;
      } catch (err) {
        const errorInfo = handleCartError(err, 'updating item');
        setError(errorInfo);
        throw errorInfo;
      }
    },
    [loadCart],
  );

  // Remove item
  const removeItem = useCallback(
    async itemId => {
      try {
        const result = await removeCartItem(itemId);
        await loadCart(); // Refresh cart
        return result;
      } catch (err) {
        const errorInfo = handleCartError(err, 'removing item');
        setError(errorInfo);
        throw errorInfo;
      }
    },
    [loadCart],
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      const result = await clearCart();
      setCart({ items: [], totals: { finalTotal: 0, itemCount: 0 } });
      return result;
    } catch (err) {
      const errorInfo = handleCartError(err, 'clearing cart');
      setError(errorInfo);
      throw errorInfo;
    }
  }, []);

  // Validate cart
  const validateCart = useCallback(async () => {
    try {
      const result = await validateCart(true);
      return result.data;
    } catch (err) {
      const errorInfo = handleCartError(err, 'validating cart');
      setError(errorInfo);
      throw errorInfo;
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return {
    cart,
    loading,
    error,
    loadCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    validateCart,
    clearError: () => setError(null),
  };
};
```

### 🛒 Cart Context Provider

```javascript
import React, { createContext, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const cartMethods = useCart();

  return (
    <CartContext.Provider value={cartMethods}>{children}</CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within CartProvider');
  }
  return context;
};
```

### 📱 UI Components

#### Cart Summary Component

```javascript
const CartSummary = () => {
  const { cart, loading } = useCartContext();

  if (loading) return <div>Loading cart...</div>;
  if (!cart || cart.items.length === 0) return <div>Your cart is empty</div>;

  return (
    <div className='cart-summary'>
      <h3>Cart Summary</h3>
      <div className='totals'>
        <div className='line'>
          <span>Subtotal ({cart.totals.itemCount} items)</span>
          <span>${cart.totals.subtotal.toFixed(2)}</span>
        </div>
        {cart.totals.totalDiscount > 0 && (
          <div className='line discount'>
            <span>Discount</span>
            <span>-${cart.totals.totalDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className='line total'>
          <span>Total</span>
          <span>${cart.totals.finalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
```

#### Cart Item Component

```javascript
const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);

  const handleQuantityChange = async newQuantity => {
    if (newQuantity < 1) return;

    setUpdating(true);
    try {
      await onUpdateQuantity(item._id, newQuantity);
      setQuantity(newQuantity);
    } catch (error) {
      toast.error(error.message);
      setQuantity(item.quantity); // Revert on error
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (confirm('Remove this item from cart?')) {
      try {
        await onRemove(item._id);
        toast.success('Item removed from cart');
      } catch (error) {
        toast.error('Failed to remove item');
      }
    }
  };

  return (
    <div className='cart-item'>
      <img
        src={item.product.images[0]?.url}
        alt={item.product.name}
        className='item-image'
      />

      <div className='item-details'>
        <h4>{item.product.name}</h4>
        {item.variant.color && <p>Color: {item.variant.color}</p>}
        {item.variant.size && <p>Size: {item.variant.size}</p>}

        <div className='price'>
          {item.discountPrice ? (
            <>
              <span className='discounted'>${item.discountPrice}</span>
              <span className='original'>${item.price}</span>
            </>
          ) : (
            <span>${item.price}</span>
          )}
        </div>
      </div>

      <div className='item-controls'>
        <div className='quantity-controls'>
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={updating || quantity <= 1}
          >
            -
          </button>
          <span>{quantity}</span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={updating}
          >
            +
          </button>
        </div>

        <button onClick={handleRemove} className='remove-button'>
          Remove
        </button>
      </div>

      <div className='line-total'>
        ${(item.effectivePrice * quantity).toFixed(2)}
      </div>
    </div>
  );
};
```

### 🔄 Real-time Updates

#### Cart Validation on Page Load

```javascript
const CartPage = () => {
  const { cart, validateCart, loading } = useCartContext();
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    const validateOnLoad = async () => {
      if (cart && cart.items.length > 0) {
        try {
          const validation = await validateCart();
          setValidationResult(validation);

          if (!validation.isValid) {
            toast.warning('Some items in your cart need attention');
          }
        } catch (error) {
          console.error('Cart validation failed:', error);
        }
      }
    };

    validateOnLoad();
  }, [cart, validateCart]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className='cart-page'>
      {validationResult && !validationResult.isValid && (
        <CartValidationAlert issues={validationResult.issues} />
      )}

      <CartItemList />
      <CartSummary />
    </div>
  );
};
```

---

## Integration Patterns

### 🔄 Add to Cart Flow

```javascript
// Product page integration
const ProductPage = ({ product }) => {
  const { addItem } = useCartContext();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    try {
      if (product.hasVariants && !selectedVariant) {
        toast.error('Please select a variant');
        return;
      }

      await addItem(product._id, quantity, selectedVariant);
      toast.success('Added to cart!');
    } catch (error) {
      if (error.type === 'stock') {
        toast.error(`Only ${error.availableStock} items available`);
      } else {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className='product-page'>
      {/* Product details */}

      {product.hasVariants && (
        <VariantSelector
          variants={product.variants}
          selected={selectedVariant}
          onChange={setSelectedVariant}
        />
      )}

      <QuantitySelector
        value={quantity}
        max={product.stock}
        onChange={setQuantity}
      />

      <button onClick={handleAddToCart} disabled={product.stock === 0}>
        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
};
```

### 🛡️ Checkout Validation

```javascript
const CheckoutPage = () => {
  const { cart, validateCart } = useCartContext();
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    const checkCartValidity = async () => {
      try {
        const validation = await validateCart();
        setCanProceed(validation.canProceedToCheckout);

        if (!validation.canProceedToCheckout) {
          toast.error('Please resolve cart issues before checkout');
        }
      } catch (error) {
        setCanProceed(false);
      }
    };

    checkCartValidity();
  }, [cart, validateCart]);

  return (
    <div className='checkout-page'>
      {!canProceed && (
        <div className='checkout-blocked'>
          <p>Please resolve cart issues before proceeding</p>
          <Link to='/cart'>View Cart</Link>
        </div>
      )}

      {canProceed && <CheckoutForm cart={cart} />}
    </div>
  );
};
```

---

**Happy shopping! 🛒** Use this guide to build seamless cart functionality for your e-commerce application.
