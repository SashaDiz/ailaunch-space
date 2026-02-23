"use client";

import { useState, useRef, useEffect } from "react";
import { InfoCircle, Eye, Group } from "iconoir-react";

export function UmamiStats() {
  const [stats, setStats] = useState({ visits: 0, pageviews: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/analytics/stats");
        const data = await response.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    };
    loadStats();
  }, []);

  // Determine tooltip position based on available space
  const getTooltipPosition = () => {
    if (!tooltipRef.current) return "bottom";
    const rect = tooltipRef.current.getBoundingClientRect();
    return rect.top < 200 ? "bottom" : "top";
  };

  // Show tooltip
  const show = () => {
    clearTimeout(timeoutRef.current);
    setShowTooltip(true);
  };

  // Hide tooltip with delay
  const hide = () => {
    timeoutRef.current = setTimeout(() => setShowTooltip(false), 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const visits = stats.visits || 0;
  const pageviews = stats.pageviews || 0;
  const currentYear = new Date().getFullYear();
  const tooltipPosition = showTooltip ? getTooltipPosition() : "bottom";

  return (
    <div className="rounded-2xl border border-gray-200 p-6 bg-white hover:border-gray-300 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {currentYear} Statistics
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Live platform analytics</p>
        </div>
        
        <div className="relative" ref={tooltipRef}>
          <button
            type="button"
            aria-label="Learn more about platform statistics"
            aria-expanded={showTooltip}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:border-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200"
          >
            <InfoCircle className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          
          {showTooltip && (
            <div
              role="tooltip"
              onMouseEnter={show}
              onMouseLeave={hide}
              className={`absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 ${
                tooltipPosition === "top" ? "bottom-full mb-3" : "top-full mt-3"
              } w-[calc(100vw-2rem)] max-w-72 rounded-2xl bg-black px-4 py-3 text-left text-xs sm:text-sm text-white shadow-xl ring-1 ring-white/10 z-50`}
            >
              <div
                className={`absolute ${
                  tooltipPosition === "top" ? "-bottom-2" : "-top-2"
                } left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 h-3 w-3 rotate-45 bg-black ring-1 ring-white/10`}
                aria-hidden="true"
              />
              <p className="m-0 text-gray-200 leading-snug mb-2">
                Live platform statistics from Umami Analytics showing visits and page views for {currentYear}.
              </p>
              <a
                href="https://cloud.umami.is/analytics/us/share/2UALHHWeeL7tjixD?date=0year"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-purple-300 hover:text-purple-100 underline text-xs font-medium"
              >
                <Eye className="w-3 h-3" aria-hidden="true" />
                View full analytics dashboard
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-gray-300 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Group className="h-3 w-3 text-gray-600" aria-hidden="true" />
            <span className="text-[10px] font-medium text-gray-600 uppercase">Visits</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-900">
            {visits.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-gray-300 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-3 w-3 text-gray-600" aria-hidden="true" />
            <span className="text-[10px] font-medium text-gray-600 uppercase">Page views</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-900">
            {pageviews.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
