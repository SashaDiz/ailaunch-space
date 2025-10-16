"use client";

import React from "react";

/**
 * WinnerBadge Component
 * Displays winner badges for 1st, 2nd, and 3rd place based on the provided design
 * 
 * Design specifications:
 * - 1st place: Black background, white text, white crown outline
 * - 2nd place: Light gray background, dark gray text, dark gray crown outline  
 * - 3rd place: Light gray background, dark gray text, dark gray crown outline
 */
export default function WinnerBadge({ position, size = "sm", className = "" }) {
  if (!position || position < 1 || position > 3) {
    return null;
  }

  const getBadgeStyles = (position) => {
    switch (position) {
      case 1:
        return {
          background: "bg-black",
          textColor: "text-white",
          crownColor: "text-white",
          border: "border-black"
        };
      case 2:
      case 3:
        return {
          background: "bg-gray-300",
          textColor: "text-gray-900",
          crownColor: "text-gray-900",
          border: "border-gray-300"
        };
      default:
        return null;
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case "xs":
        return "px-2 py-1 text-xs";
      case "sm":
        return "px-3 py-1.5 text-sm";
      case "md":
        return "px-4 py-2 text-base";
      case "lg":
        return "px-5 py-2.5 text-lg";
      default:
        return "px-3 py-1.5 text-sm";
    }
  };

  const styles = getBadgeStyles(position);
  if (!styles) return null;

  const sizeClasses = getSizeClasses(size);
  const positionText = position === 1 ? "1st place" : position === 2 ? "2nd place" : "3rd place";

  return (
    <div 
      className={`
        inline-flex items-center gap-2 rounded-lg border font-medium
        ${styles.background} 
        ${styles.textColor} 
        ${styles.border}
        ${sizeClasses}
        ${className}
      `}
      role="img"
      aria-label={`${positionText} winner badge`}
    >
      {/* Crown Icon */}
      <svg 
        className={`w-4 h-4 ${styles.crownColor}`} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
        />
      </svg>
      
      {/* Position Text */}
      <span className="font-semibold">
        {positionText}
      </span>
    </div>
  );
}

/**
 * WinnerBadgeList Component
 * Displays multiple winner badges in a row
 */
export function WinnerBadgeList({ winners, size = "sm", className = "" }) {
  if (!winners || winners.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {winners.map((winner) => (
        <WinnerBadge 
          key={winner.id || winner.slug} 
          position={winner.weekly_position} 
          size={size}
        />
      ))}
    </div>
  );
}

/**
 * WinnerBadgeIcon Component
 * Just the crown icon without text - useful for compact displays
 */
export function WinnerBadgeIcon({ position, size = "sm", className = "" }) {
  if (!position || position < 1 || position > 3) {
    return null;
  }

  const getIconStyles = (position) => {
    switch (position) {
      case 1:
        return {
          background: "bg-black",
          crownColor: "text-white"
        };
      case 2:
      case 3:
        return {
          background: "bg-gray-300",
          crownColor: "text-gray-900"
        };
      default:
        return null;
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case "xs":
        return "w-5 h-5";
      case "sm":
        return "w-6 h-6";
      case "md":
        return "w-8 h-8";
      case "lg":
        return "w-10 h-10";
      default:
        return "w-6 h-6";
    }
  };

  const styles = getIconStyles(position);
  if (!styles) return null;

  const sizeClasses = getSizeClasses(size);

  return (
    <div 
      className={`
        inline-flex items-center justify-center rounded-full border
        ${styles.background} 
        ${sizeClasses}
        ${className}
      `}
      role="img"
      aria-label={`${position === 1 ? "1st" : position === 2 ? "2nd" : "3rd"} place winner`}
    >
      <svg 
        className={`${styles.crownColor} ${size === "xs" ? "w-3 h-3" : size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"}`} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
        />
      </svg>
    </div>
  );
}
