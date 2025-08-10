import toast from "react-hot-toast";

// Custom toast configurations for different scenarios
export const showToast = {
  // Success toast
  success: (message: string, options?: any) => {
    return toast.success(message, {
      duration: 3000,
      style: {
        background: "#10b981",
        color: "#fff",
        fontWeight: "500",
        borderRadius: "8px",
        boxShadow:
          "0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -2px rgba(16, 185, 129, 0.1)",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#10b981",
      },
      ...options,
    });
  },

  // Error toast
  error: (message: string, options?: any) => {
    return toast.error(message, {
      duration: 5000,
      style: {
        background: "#ef4444",
        color: "#fff",
        fontWeight: "500",
        borderRadius: "8px",
        boxShadow:
          "0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#ef4444",
      },
      ...options,
    });
  },

  // Warning toast
  warning: (message: string, options?: any) => {
    return toast(message, {
      duration: 4000,
      icon: "⚠️",
      style: {
        background: "#f59e0b",
        color: "#fff",
        fontWeight: "500",
        borderRadius: "8px",
        boxShadow:
          "0 10px 15px -3px rgba(245, 158, 11, 0.2), 0 4px 6px -2px rgba(245, 158, 11, 0.1)",
      },
      ...options,
    });
  },

  // Info toast
  info: (message: string, options?: any) => {
    return toast(message, {
      duration: 4000,
      icon: "ℹ️",
      style: {
        background: "#3b82f6",
        color: "#fff",
        fontWeight: "500",
        borderRadius: "8px",
        boxShadow:
          "0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)",
      },
      ...options,
    });
  },

  // Loading toast
  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      style: {
        background: "#6b7280",
        color: "#fff",
        fontWeight: "500",
        borderRadius: "8px",
        boxShadow:
          "0 10px 15px -3px rgba(107, 114, 128, 0.2), 0 4px 6px -2px rgba(107, 114, 128, 0.1)",
      },
      ...options,
    });
  },

  // Promise toast (for async operations)
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: any
  ) => {
    return toast.promise(promise, msgs, {
      style: {
        borderRadius: "8px",
        fontWeight: "500",
      },
      success: {
        duration: 3000,
        style: {
          background: "#10b981",
          color: "#fff",
          boxShadow:
            "0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -2px rgba(16, 185, 129, 0.1)",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#10b981",
        },
      },
      error: {
        duration: 5000,
        style: {
          background: "#ef4444",
          color: "#fff",
          boxShadow:
            "0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#ef4444",
        },
      },
      loading: {
        style: {
          background: "#6b7280",
          color: "#fff",
          boxShadow:
            "0 10px 15px -3px rgba(107, 114, 128, 0.2), 0 4px 6px -2px rgba(107, 114, 128, 0.1)",
        },
      },
      ...options,
    });
  },

  // Custom toast with custom styling
  custom: (message: string, options?: any) => {
    return toast(message, {
      duration: 4000,
      style: {
        background: "#1f2937",
        color: "#fff",
        fontWeight: "500",
        borderRadius: "8px",
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      ...options,
    });
  },

  // Dismiss all toasts
  dismiss: () => {
    toast.dismiss();
  },

  // Dismiss specific toast
  dismissById: (toastId: string) => {
    toast.dismiss(toastId);
  },
};

// E-commerce specific toast messages
export const ecommerceToasts = {
  // Cart related
  addedToCart: (productName: string) =>
    showToast.success(`${productName} added to cart!`),

  removedFromCart: (productName: string) =>
    showToast.info(`${productName} removed from cart`),

  cartCleared: () => showToast.info("Cart cleared"),

  // Wishlist related
  addedToWishlist: (productName: string) =>
    showToast.success(`${productName} added to wishlist!`),

  removedFromWishlist: (productName: string) =>
    showToast.info(`${productName} removed from wishlist`),

  // Order related
  orderPlaced: (orderNumber: string) =>
    showToast.success(`Order #${orderNumber} placed successfully!`),

  orderCancelled: (orderNumber: string) =>
    showToast.warning(`Order #${orderNumber} has been cancelled`),

  // Auth related
  loginSuccess: () => showToast.success("Welcome back!"),

  logoutSuccess: () => showToast.info("Logged out successfully"),

  registrationSuccess: () => showToast.success("Account created successfully!"),

  // Error messages
  networkError: () =>
    showToast.error("Network error. Please check your connection."),

  serverError: () =>
    showToast.error("Something went wrong. Please try again later."),

  validationError: (message: string) => showToast.error(message),

  // Loading states
  processing: (message: string = "Processing...") => showToast.loading(message),
};

export default showToast;
