import { useCallback } from "react";
import { showToast, ecommerceToasts } from "../utils/toast";

interface UseToastOptions {
  successDuration?: number;
  errorDuration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

export const useToast = (options: UseToastOptions = {}) => {
  const { successDuration = 3000, errorDuration = 5000 } = options;

  // API call wrapper with toast notifications
  const apiCall = useCallback(
    async <T>(
      apiFunction: () => Promise<T>,
      messages: {
        loading?: string;
        success?: string | ((data: T) => string);
        error?: string | ((error: any) => string);
      } = {}
    ): Promise<T> => {
      const {
        loading = "Processing...",
        success = "Operation completed successfully!",
        error = "Something went wrong. Please try again.",
      } = messages;

      return showToast.promise(apiFunction(), {
        loading,
        success,
        error,
      });
    },
    []
  );

  // Form submission wrapper
  const formSubmit = useCallback(
    async <T>(
      submitFunction: () => Promise<T>,
      messages: {
        loading?: string;
        success?: string;
        error?: string;
      } = {}
    ): Promise<T | null> => {
      try {
        const {
          loading = "Submitting...",
          success = "Form submitted successfully!",
          error: errorMessage = "Form submission failed. Please try again.",
        } = messages;

        const loadingToast = showToast.loading(loading);

        const result = await submitFunction();

        showToast.dismissById(loadingToast);
        showToast.success(success, { duration: successDuration });

        return result;
      } catch (error: any) {
        showToast.error(
          messages.error ||
            error?.message ||
            "Form submission failed. Please try again.",
          { duration: errorDuration }
        );
        return null;
      }
    },
    [successDuration, errorDuration]
  );

  // Validation error handler
  const handleValidationErrors = useCallback(
    (errors: Record<string, string[]> | string[]) => {
      if (Array.isArray(errors)) {
        errors.forEach((error) =>
          showToast.error(error, { duration: errorDuration })
        );
      } else {
        Object.values(errors)
          .flat()
          .forEach((error) =>
            showToast.error(error, { duration: errorDuration })
          );
      }
    },
    [errorDuration]
  );

  // Auth-specific toasts
  const auth = {
    loginSuccess: () => ecommerceToasts.loginSuccess(),
    logoutSuccess: () => ecommerceToasts.logoutSuccess(),
    registrationSuccess: () => ecommerceToasts.registrationSuccess(),
    loginError: (message?: string) =>
      showToast.error(
        message || "Login failed. Please check your credentials."
      ),
    registrationError: (message?: string) =>
      showToast.error(message || "Registration failed. Please try again."),
  };

  // Cart-specific toasts
  const cart = {
    addedToCart: (productName: string) =>
      ecommerceToasts.addedToCart(productName),
    removedFromCart: (productName: string) =>
      ecommerceToasts.removedFromCart(productName),
    cartCleared: () => ecommerceToasts.cartCleared(),
    updateQuantity: (productName: string, quantity: number) =>
      showToast.info(`${productName} quantity updated to ${quantity}`),
  };

  // Wishlist-specific toasts
  const wishlist = {
    addedToWishlist: (productName: string) =>
      ecommerceToasts.addedToWishlist(productName),
    removedFromWishlist: (productName: string) =>
      ecommerceToasts.removedFromWishlist(productName),
  };

  // Order-specific toasts
  const order = {
    orderPlaced: (orderNumber: string) =>
      ecommerceToasts.orderPlaced(orderNumber),
    orderCancelled: (orderNumber: string) =>
      ecommerceToasts.orderCancelled(orderNumber),
    orderShipped: (orderNumber: string) =>
      showToast.info(`Order #${orderNumber} has been shipped!`),
    orderDelivered: (orderNumber: string) =>
      showToast.success(`Order #${orderNumber} has been delivered!`),
  };

  // Network-specific toasts
  const network = {
    networkError: () => ecommerceToasts.networkError(),
    serverError: () => ecommerceToasts.serverError(),
    timeoutError: () => showToast.error("Request timed out. Please try again."),
    connectionRestored: () => showToast.success("Connection restored!"),
  };

  return {
    // Basic toast functions
    success: showToast.success,
    error: showToast.error,
    warning: showToast.warning,
    info: showToast.info,
    loading: showToast.loading,
    custom: showToast.custom,
    dismiss: showToast.dismiss,

    // Advanced functions
    apiCall,
    formSubmit,
    handleValidationErrors,

    // Category-specific toasts
    auth,
    cart,
    wishlist,
    order,
    network,
  };
};

export default useToast;
