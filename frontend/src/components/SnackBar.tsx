import React from "react";
import { Toaster } from "react-hot-toast";

export default function SnackBar() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: "#363636",
          color: "#fff",
          borderRadius: "8px",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        // Success toast styling
        success: {
          duration: 3000,
          style: {
            background: "#10b981",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#10b981",
          },
        },
        // Error toast styling
        error: {
          duration: 5000,
          style: {
            background: "#ef4444",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#ef4444",
          },
        },
        // Loading toast styling
        loading: {
          style: {
            background: "#3b82f6",
            color: "#fff",
          },
        },
      }}
    />
  );
}
