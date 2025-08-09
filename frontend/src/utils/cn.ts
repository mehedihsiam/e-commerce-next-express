import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and tailwind-merge
 * This function combines the power of clsx for conditional classes
 * and tailwind-merge for resolving Tailwind CSS conflicts
 *
 * @param inputs - Class values (strings, objects, arrays, etc.)
 * @returns Merged and deduplicated class string
 *
 * @example
 * clx("px-4 py-2", "bg-blue-500", { "text-white": true, "font-bold": false })
 * // Returns: "px-4 py-2 bg-blue-500 text-white"
 *
 * @example
 * clx("bg-red-500", "bg-blue-500") // tailwind-merge resolves conflicts
 * // Returns: "bg-blue-500"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Variant helper for creating conditional class combinations
 * Useful for component variants
 *
 * @param base - Base classes that are always applied
 * @param variants - Object with variant configurations
 * @param defaultVariants - Default variant values
 * @returns Function that accepts variant props and returns merged class string
 *
 * @example
 * const buttonVariants = createVariants({
 *   base: "inline-flex items-center justify-center font-medium",
 *   variants: {
 *     variant: {
 *       primary: "bg-blue-500 text-white",
 *       secondary: "bg-gray-500 text-white"
 *     },
 *     size: {
 *       sm: "px-2 py-1 text-sm",
 *       md: "px-4 py-2 text-base"
 *     }
 *   },
 *   defaultVariants: {
 *     variant: "primary",
 *     size: "md"
 *   }
 * });
 *
 * buttonVariants({ variant: "secondary", size: "sm" })
 */
export function createVariants<
  T extends Record<string, Record<string, string>>
>(config: {
  base?: string;
  variants?: T;
  defaultVariants?: Partial<{
    [K in keyof T]: keyof T[K];
  }>;
}) {
  return (
    props?: Partial<{
      [K in keyof T]: keyof T[K];
    }> & { class?: string; className?: string }
  ) => {
    const {
      class: className,
      className: classNameProp,
      ...variantProps
    } = props || {};

    // Start with base classes
    const classes = [config.base];

    // Apply variants
    if (config.variants) {
      Object.entries(config.variants).forEach(([variantKey, variantValues]) => {
        const variantValue =
          (variantProps as Record<string, unknown>)[variantKey] ||
          config.defaultVariants?.[variantKey as keyof T];

        if (variantValue && variantValues[variantValue as string]) {
          classes.push(variantValues[variantValue as string]);
        }
      });
    }

    // Add custom classes
    if (className) classes.push(className);
    if (classNameProp) classes.push(classNameProp);

    return cn(...classes);
  };
}

/**
 * Conditional class helper
 * Applies classes based on conditions
 *
 * @param condition - Boolean condition
 * @param trueClasses - Classes to apply when condition is true
 * @param falseClasses - Classes to apply when condition is false
 * @returns Class string
 *
 * @example
 * conditionalClx(isActive, "bg-blue-500 text-white", "bg-gray-200 text-gray-600")
 */
export function conditionalClx(
  condition: boolean,
  trueClasses: string,
  falseClasses?: string
): string {
  return condition ? trueClasses : falseClasses || "";
}

/**
 * Focus ring utility for consistent focus styling
 *
 * @param color - Focus ring color (default: blue)
 * @returns Focus ring classes
 *
 * @example
 * clx("px-4 py-2", focusRing("red"))
 * // Returns classes with red focus ring
 */
export function focusRing(color: string = "blue"): string {
  return `focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2`;
}

/**
 * Screen reader only utility
 * Hides content visually but keeps it accessible to screen readers
 */
export const srOnly = "sr-only";

export default cn;
