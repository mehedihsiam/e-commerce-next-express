import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "brand"
    | "brand-light"
    | "brand-lighter"
    | "brand-dark"
    | "brand-darker"
    | "accent"
    | "accent-light"
    | "accent-dark"
    | "muted"
    | "outline-brand"
    | "outline-accent"
    | "ghost"
    | "custom";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
  customColor?: string; // For custom color when variant is "custom"
  customHoverColor?: string; // For custom hover color
  customTextColor?: string; // For custom text color
}

const Button: React.FC<ButtonProps> = ({
  variant = "brand",
  size = "md",
  isLoading = false,
  className = "",
  children,
  disabled,
  customColor,
  customHoverColor,
  customTextColor,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    // Brand color variants
    brand: "bg-brand hover:bg-brand-light text-white focus:ring-brand-light",
    "brand-light": "bg-brand-light hover:bg-brand text-white focus:ring-brand",
    "brand-lighter":
      "bg-brand-lighter hover:bg-brand-light text-white focus:ring-brand-light",
    "brand-dark": "bg-brand-dark hover:bg-brand text-white focus:ring-brand",
    "brand-darker":
      "bg-brand-darker hover:bg-brand-dark text-white focus:ring-brand-dark",

    // Accent color variants
    accent: "bg-accent hover:bg-accent-dark text-brand focus:ring-accent-dark",
    "accent-light":
      "bg-accent-light hover:bg-accent text-brand focus:ring-accent",
    "accent-dark":
      "bg-accent-dark hover:bg-accent text-white focus:ring-accent",

    // Neutral variant
    muted: "bg-muted hover:bg-gray-200 text-brand focus:ring-gray-300",

    // Outline variants
    "outline-brand":
      "border-2 border-brand text-brand hover:bg-brand hover:text-white focus:ring-brand",
    "outline-accent":
      "border-2 border-accent text-accent hover:bg-accent hover:text-brand focus:ring-accent",

    // Ghost variant
    ghost: "text-text-muted hover:bg-muted focus:ring-gray-300",

    // Custom variant (uses inline styles)
    custom: "",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  // Handle custom styling
  const getCustomStyles = () => {
    if (variant !== "custom") return {};

    const styles: React.CSSProperties = {};
    if (customColor) {
      styles.backgroundColor = customColor;
    }
    if (customTextColor) {
      styles.color = customTextColor;
    }

    return styles;
  };

  const getCustomHoverStyles = () => {
    if (variant !== "custom" || !customHoverColor) return "";

    return `hover:bg-[${customHoverColor}]`;
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${
        sizes[size]
      } ${getCustomHoverStyles()} ${className}`}
      style={getCustomStyles()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
