"use client";

import React from "react";

/**
 * Accessible, responsive pagination component.
 *
 * Props:
 * - page: current page (1-based)
 * - totalPages: total number of pages
 * - onPageChange: (page: number) => void
 * - ariaLabel: optional label for the pagination nav
 */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  ariaLabel = "Pagination",
}) {
  if (!totalPages || totalPages <= 1) return null;

  const clampedPage = Math.min(Math.max(page || 1, 1), totalPages);

  const createPageRange = () => {
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set([1, totalPages]);
    pages.add(clampedPage);
    pages.add(clampedPage - 1);
    pages.add(clampedPage + 1);
    pages.add(clampedPage - 2);
    pages.add(clampedPage + 2);

    const validPages = [...pages]
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);

    // Insert "gaps" to indicate ellipsis in rendering
    const withGaps = [];
    for (let i = 0; i < validPages.length; i++) {
      const current = validPages[i];
      const previous = validPages[i - 1];
      if (previous && current - previous > 1) {
        withGaps.push(previous + 0.5); // sentinel for ellipsis
      }
      withGaps.push(current);
    }

    return withGaps;
  };

  const handleChange = (newPage) => {
    const nextPage = Math.min(Math.max(newPage, 1), totalPages);
    if (nextPage !== clampedPage) {
      onPageChange(nextPage);
    }
  };

  const pages = createPageRange();

  return (
    <nav
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label={ariaLabel}
    >
      {/* Mobile controls: Previous/Next only */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => handleChange(clampedPage - 1)}
          disabled={clampedPage <= 1}
          className="flex-1 min-h-[44px] px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
          aria-label="Go to previous page"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => handleChange(clampedPage + 1)}
          disabled={clampedPage >= totalPages}
          className="flex-1 min-h-[44px] px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
          aria-label="Go to next page"
        >
          Next
        </button>
      </div>

      <div className="flex items-center justify-center sm:justify-end">
        <ul className="inline-flex items-center gap-1" role="list">
          <li className="hidden sm:block">
            <button
              type="button"
              onClick={() => handleChange(clampedPage - 1)}
              disabled={clampedPage <= 1}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
              aria-label="Go to previous page"
            >
              «
            </button>
          </li>

          {pages.map((p) =>
            Number.isInteger(p) ? (
              <li key={`page-${p}`}>
                <button
                  type="button"
                  onClick={() => handleChange(p)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    p === clampedPage
                      ? "bg-black text-white"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                  aria-label={`Go to page ${p}`}
                  aria-current={p === clampedPage ? "page" : undefined}
                >
                  {p}
                </button>
              </li>
            ) : (
              <li
                key={`ellipsis-${p}`}
                aria-hidden="true"
                className="px-2 text-xs sm:text-sm text-gray-400 select-none"
              >
                …
              </li>
            )
          )}

          <li className="hidden sm:block">
            <button
              type="button"
              onClick={() => handleChange(clampedPage + 1)}
              disabled={clampedPage >= totalPages}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
              aria-label="Go to next page"
            >
              »
            </button>
          </li>
        </ul>
      </div>

      <p className="text-center text-xs font-medium text-gray-500 sm:text-right">
        Page{" "}
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-gray-100 text-gray-800">
          {clampedPage}
        </span>{" "}
        of {totalPages}
      </p>
    </nav>
  );
}
