"use client";

import React from "react";

/**
 * LoadingSpinner - A reusable loading spinner component
 * Matches the animation style from the Streaks page but with black color
 * 
 * @param {Object} props
 * @param {string} [props.message] - Optional loading message to display below the spinner
 * @param {string} [props.size] - Size of the spinner ('sm' | 'md' | 'lg'). Default: 'md'
 * @param {boolean} [props.fullScreen] - Whether to render as full screen overlay. Default: false
 */
export default function LoadingSpinner({ 
  message = null, 
  size = 'md',
  fullScreen = false 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const spinner = (
    <div 
      className={`inline-flex items-center justify-center ${sizeClasses[size]} border-4 border-gray-200 border-t-black rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {spinner}
          {message && (
            <p className="text-gray-600 font-medium mt-4">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      {spinner}
      {message && (
        <p className="text-gray-600 font-medium mt-4">{message}</p>
      )}
    </div>
  );
}
