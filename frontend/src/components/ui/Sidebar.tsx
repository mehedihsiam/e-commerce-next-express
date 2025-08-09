"use client";
import React, { useEffect, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import IconButton from "./IconButton";

// Simple clx function inline
const clx = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle opening animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to ensure the element is rendered before animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close sidebar when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden h-screen">
      {/* Backdrop */}
      <div
        className={clx(
          "absolute inset-0 bg-black transition-opacity duration-300 ease-in-out",
          isAnimating ? "opacity-50" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md">
        <div
          className={clx(
            "h-full bg-white shadow-xl transform transition-all duration-300 ease-in-out",
            isAnimating
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-75",
            className
          )}
        >
          {/* Header */}
          <div className="flex h-[7%] items-center justify-between p-4 border-b border-gray-200">
            <h2
              className={clx(
                "text-lg font-semibold text-gray-900 transition-all duration-300 delay-100",
                isAnimating
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              )}
            >
              {title}
            </h2>
            <IconButton
              onClick={onClose}
              iconName="close"
              iconClassName="text-xl"
              buttonClassName={clx(
                "p-2 text-gray-400 hover:text-gray-600 transition-all duration-200",
                "transition-transform duration-200 hover:rotate-90",
                isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-75"
              )}
              aria-label="Close sidebar"
            />
            {/* <svg
                className="w-6 h-6 "
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button> */}
          </div>

          {/* Content */}
          <div
            className={clx(
              "flex-1 overflow-scroll scrollbar-hide h-[93%] transition-all duration-300 delay-150",
              isAnimating
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
