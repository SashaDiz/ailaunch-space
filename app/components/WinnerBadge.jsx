"use client";

import React from "react";
import { Medal1st, Medal } from "iconoir-react";

/**
 * WinnerBadge Component
 * Displays winner badges for 1st, 2nd, and 3rd place with traditional medal colors
 * 
 * Design specifications:
 * - 1st place: Gold background, dark gold text, dark gold crown outline
 * - 2nd place: Silver background, dark silver text, dark silver crown outline  
 * - 3rd place: Bronze background, dark bronze text, dark bronze crown outline
 */
export default function WinnerBadge({ position, size = "sm", className = "" }) {
  if (!position || position < 1 || position > 3) {
    return null;
  }

  const getBadgeStyles = (position) => {
    switch (position) {
      case 1:
        return {
          background: "bg-yellow-400",
          textColor: "text-yellow-900",
          crownColor: "text-yellow-900",
          border: "border-yellow-500"
        };
      case 2:
        return {
          background: "bg-gray-300",
          textColor: "text-gray-800",
          crownColor: "text-gray-800",
          border: "border-gray-400"
        };
      case 3:
        return {
          background: "bg-orange-400",
          textColor: "text-orange-900",
          crownColor: "text-orange-900",
          border: "border-orange-500"
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
        return "px-2 py-1 text-xs";
      case "md":
        return "px-2.5 py-1.5 text-sm";
      case "lg":
        return "px-3 py-1.5 text-sm";
      default:
        return "px-2 py-1 text-xs";
    }
  };

  const styles = getBadgeStyles(position);
  if (!styles) return null;

  const sizeClasses = getSizeClasses(size);
  const positionText = position === 1 ? "1st place" : position === 2 ? "2nd place" : "3rd place";

  return (
    <div 
      className={`
        inline-flex items-center gap-1 rounded-md border font-medium
        ${styles.background} 
        ${styles.textColor} 
        ${styles.border}
        ${sizeClasses}
        ${className}
      `}
      role="img"
      aria-label={`${positionText} winner badge`}
    >
      {/* Medal Icon */}
      {position === 1 ? (
        <Medal1st 
          className={`w-4 h-4 ${styles.crownColor}`}
          strokeWidth="2"
          aria-hidden="true"
        />
      ) : (
        <Medal 
          className={`w-4 h-4 ${styles.crownColor}`}
          strokeWidth="2"
          aria-hidden="true"
        />
      )}
      
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
          background: "bg-yellow-400",
          crownColor: "text-yellow-900"
        };
      case 2:
        return {
          background: "bg-gray-300",
          crownColor: "text-gray-800"
        };
      case 3:
        return {
          background: "bg-orange-400",
          crownColor: "text-orange-900"
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
      {position === 1 ? (
        <Medal1st 
          className={`${styles.crownColor} ${size === "xs" ? "w-3 h-3" : size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"}`}
          strokeWidth="2"
          aria-hidden="true"
        />
      ) : (
        <Medal 
          className={`${styles.crownColor} ${size === "xs" ? "w-3 h-3" : size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"}`}
          strokeWidth="2"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
