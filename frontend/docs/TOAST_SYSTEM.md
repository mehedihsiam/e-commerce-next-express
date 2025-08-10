# Toast Notification System Documentation

## Overview

This project uses **react-hot-toast** for modern, customizable toast notifications. The system includes pre-configured styles, e-commerce specific messages, and React hooks for easy integration.

## Features

- ✅ Modern, responsive design with smooth animations
- ✅ Multiple toast types (success, error, warning, info, loading)
- ✅ E-commerce specific toast messages
- ✅ Promise-based toasts for async operations
- ✅ Custom React hook for advanced usage
- ✅ Consistent styling across the application
- ✅ Auto-dismiss with configurable durations
- ✅ Keyboard accessible

## Installation

```bash
pnpm add react-hot-toast
```

## Basic Usage

### Import the toast utilities

```tsx
import { showToast, ecommerceToasts } from "../utils/toast";
// OR use the hook
import { useToast } from "../hooks/useToast";
```

### Basic Toast Types

```tsx
// Success toast
showToast.success("Operation completed successfully!");

// Error toast
showToast.error("Something went wrong!");

// Warning toast
showToast.warning("Please review your input");

// Info toast
showToast.info("Information message");

// Loading toast
const loadingToast = showToast.loading("Processing...");

// Custom toast
showToast.custom("Custom message", {
  icon: "🎉",
  style: { background: "purple" },
});
```

### E-commerce Specific Toasts

```tsx
// Cart operations
ecommerceToasts.addedToCart("iPhone 15 Pro");
ecommerceToasts.removedFromCart("MacBook Air");
ecommerceToasts.cartCleared();

// Wishlist operations
ecommerceToasts.addedToWishlist("Samsung Galaxy");
ecommerceToasts.removedFromWishlist("iPad Pro");

// Order operations
ecommerceToasts.orderPlaced("ORD123456");
ecommerceToasts.orderCancelled("ORD123456");

// Auth operations
ecommerceToasts.loginSuccess();
ecommerceToasts.logoutSuccess();
ecommerceToasts.registrationSuccess();

// Error messages
ecommerceToasts.networkError();
ecommerceToasts.serverError();
ecommerceToasts.validationError("Email is required");
```

### Promise-based Toasts

Perfect for API calls and async operations:

```tsx
const apiCall = async () => {
  // Your API call here
  return fetch("/api/data").then((res) => res.json());
};

showToast.promise(apiCall(), {
  loading: "Fetching data...",
  success: "Data loaded successfully!",
  error: "Failed to load data",
});
```

## Using the React Hook

The `useToast` hook provides additional functionality for common scenarios:

```tsx
import { useToast } from "../hooks/useToast";

function MyComponent() {
  const toast = useToast();

  // API call with automatic toast handling
  const fetchData = async () => {
    await toast.apiCall(() => fetch("/api/data").then((res) => res.json()), {
      loading: "Loading...",
      success: "Data loaded!",
      error: "Failed to load data",
    });
  };

  // Form submission with toast
  const handleSubmit = async (formData) => {
    const result = await toast.formSubmit(() => submitForm(formData), {
      loading: "Submitting...",
      success: "Form submitted successfully!",
      error: "Submission failed",
    });

    if (result) {
      // Handle success
    }
  };

  // Category-specific toasts
  const handleAddToCart = (product) => {
    toast.cart.addedToCart(product.name);
  };

  const handleLogin = () => {
    toast.auth.loginSuccess();
  };

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      <button onClick={() => handleAddToCart({ name: "iPhone" })}>
        Add to Cart
      </button>
    </div>
  );
}
```

## Configuration

### Global Configuration

The Toaster is configured in `app/layout.tsx` with these settings:

```tsx
<Toaster
  position="top-right"
  reverseOrder={false}
  gutter={8}
  toastOptions={{
    duration: 4000,
    style: {
      background: "#363636",
      color: "#fff",
      borderRadius: "8px",
    },
    success: {
      duration: 3000,
      style: { background: "#10b981" },
    },
    error: {
      duration: 5000,
      style: { background: "#ef4444" },
    },
  }}
/>
```

### Custom Styling

You can customize individual toasts:

```tsx
showToast.success("Custom styled success!", {
  duration: 6000,
  style: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: "bold",
  },
  iconTheme: {
    primary: "#fff",
    secondary: "#667eea",
  },
});
```

## Toast Positions

Available positions:

- `top-left`
- `top-center`
- `top-right` (default)
- `bottom-left`
- `bottom-center`
- `bottom-right`

## Best Practices

### 1. Use Appropriate Toast Types

- **Success**: For completed actions (order placed, item added)
- **Error**: For failures and validation errors
- **Warning**: For cautions and confirmations needed
- **Info**: For general information and status updates
- **Loading**: For ongoing operations

### 2. Keep Messages Concise

```tsx
// Good
showToast.success("Product added to cart!");

// Too verbose
showToast.success(
  "The product has been successfully added to your shopping cart and you can now proceed to checkout or continue shopping."
);
```

### 3. Use E-commerce Specific Toasts

Instead of generic messages, use the pre-built e-commerce toasts:

```tsx
// Good
ecommerceToasts.addedToCart("iPhone 15 Pro");

// Generic
showToast.success("Item added to cart");
```

### 4. Handle Errors Gracefully

```tsx
try {
  await apiCall();
  showToast.success("Operation completed!");
} catch (error) {
  showToast.error(error.message || "Something went wrong");
}
```

### 5. Use Promise Toasts for Async Operations

```tsx
// Automatically handles loading, success, and error states
showToast.promise(submitOrder(), {
  loading: "Processing order...",
  success: (order) => `Order #${order.id} placed successfully!`,
  error: "Failed to place order. Please try again.",
});
```

## Common Use Cases

### Form Validation

```tsx
const { handleValidationErrors } = useToast();

// Handle validation errors from API
if (response.errors) {
  handleValidationErrors(response.errors);
}
```

### Shopping Cart Actions

```tsx
const { cart } = useToast();

const addToCart = (product) => {
  // Add to cart logic
  cart.addedToCart(product.name);
};

const removeFromCart = (product) => {
  // Remove from cart logic
  cart.removedFromCart(product.name);
};
```

### Authentication Flow

```tsx
const { auth } = useToast();

const login = async (credentials) => {
  try {
    await loginUser(credentials);
    auth.loginSuccess();
  } catch (error) {
    auth.loginError(error.message);
  }
};
```

### Network Error Handling

```tsx
const { network } = useToast();

// Handle different network scenarios
if (error.code === "NETWORK_ERROR") {
  network.networkError();
} else if (error.code === "TIMEOUT") {
  network.timeoutError();
} else {
  network.serverError();
}
```

## Accessibility

The toast system is built with accessibility in mind:

- Screen reader friendly
- Keyboard navigation support
- ARIA labels and roles
- Appropriate contrast ratios
- Focus management

## Performance

- Lightweight library (< 3KB gzipped)
- Efficient rendering with minimal re-renders
- Automatic cleanup of dismissed toasts
- Configurable limits on simultaneous toasts

## Troubleshooting

### Toasts not appearing

1. Ensure `<Toaster />` is included in your layout
2. Check console for JavaScript errors
3. Verify toast functions are imported correctly

### Styling issues

1. Check if custom CSS is overriding toast styles
2. Ensure Tailwind CSS classes are properly configured
3. Verify z-index values for proper layering

### Performance issues

1. Avoid creating too many simultaneous toasts
2. Use `toast.dismiss()` to clear old toasts when needed
3. Consider debouncing rapid toast triggers
