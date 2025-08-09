"use client";
import React from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showRating?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = "md",
  showRating = false,
  className = "",
}) => {
  // Clamp rating between 0 and maxRating
  const clampedRating = Math.max(0, Math.min(rating, maxRating));

  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const starSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fillPercentage = Math.max(0, Math.min(1, clampedRating - index));

    if (fillPercentage === 0) {
      // Empty star
      return (
        <AiOutlineStar key={index} className={`${starSize} text-gray-300`} />
      );
    } else if (fillPercentage === 1) {
      // Full star
      return (
        <AiFillStar key={index} className={`${starSize} text-yellow-400`} />
      );
    } else {
      // Partial star
      const uniqueId = `star-gradient-${index}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return (
        <div key={index} className={`relative ${starSize}`}>
          <svg
            className={`${starSize} absolute inset-0`}
            viewBox="0 0 24 24"
            fill="none"
          >
            <defs>
              <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset={`${fillPercentage * 100}%`} stopColor="#fbbf24" />
                <stop offset={`${fillPercentage * 100}%`} stopColor="#d1d5db" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={`url(#${uniqueId})`}
            />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </div>
      {showRating && (
        <span className={`text-gray-600 ${textSize}`}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

export default StarRating;
