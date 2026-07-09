"use client";

import React from "react";
import Link from "next/link";

/**
 * Accessible, responsive pagination.
 *
 * Crawlability: when `buildHref` is provided, every page control renders as a
 * real `<a href>` (via next/link) so search engines can follow pagination.
 * Clicking still does client-side navigation (Link), which changes the URL and
 * lets the server re-render the correct page. `onPageChange` is optional and
 * runs alongside navigation (e.g. to scroll). If `buildHref` is omitted the
 * component falls back to button-based navigation via `onPageChange`.
 *
 * Props:
 * - page: current page (1-based)
 * - totalPages: total number of pages
 * - buildHref: (page: number) => string — builds the href for a page
 * - onPageChange: (page: number) => void — optional click side-effect / fallback
 * - ariaLabel: optional label for the pagination nav
 */
interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the href for a page — enables real <a href> crawlable pagination. */
  buildHref?: (page: number) => string;
  /** Optional click side-effect, and the fallback when buildHref is absent. */
  onPageChange?: (page: number) => void;
  ariaLabel?: string;
}

export default function Pagination({
  page,
  totalPages,
  buildHref,
  onPageChange,
  ariaLabel = "Pagination",
}: PaginationProps) {
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

  const pages = createPageRange();

  /**
   * Render a single control. When enabled and `buildHref` exists → <a href>.
   * When disabled → inert <span>. Otherwise → <button> (fallback).
   */
  const control = (
    targetPage: number,
    content: React.ReactNode,
    {
      className,
      ariaLabel: itemAriaLabel,
      current,
      disabled,
    }: {
      className: string;
      ariaLabel: string;
      current?: boolean;
      disabled?: boolean;
    }
  ) => {
    if (disabled) {
      return (
        <span
          className={`${className} opacity-50 cursor-not-allowed`}
          aria-disabled="true"
        >
          {content}
        </span>
      );
    }

    if (buildHref) {
      return (
        <Link
          href={buildHref(targetPage)}
          className={className}
          aria-label={itemAriaLabel}
          aria-current={current ? "page" : undefined}
          onClick={onPageChange ? () => onPageChange(targetPage) : undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onPageChange && onPageChange(targetPage)}
        className={className}
        aria-label={itemAriaLabel}
        aria-current={current ? "page" : undefined}
      >
        {content}
      </button>
    );
  };

  const prevPage = clampedPage - 1;
  const nextPage = clampedPage + 1;

  const numberBase =
    "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors";
  const inactiveNumber = `${numberBase} text-muted-foreground bg-background border border-border hover:bg-muted`;
  const activeNumber = `${numberBase} bg-primary text-primary-foreground`;
  const arrowClass =
    "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground bg-background border border-border rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black";
  const mobileArrowClass =
    "flex-1 min-h-[44px] px-4 py-3 text-sm font-medium text-muted-foreground bg-background border border-border rounded-xl hover:bg-muted text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black";

  return (
    <nav
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label={ariaLabel}
    >
      {/* Mobile controls: Previous/Next only */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        {control(prevPage, "Previous", {
          className: mobileArrowClass,
          ariaLabel: "Go to previous page",
          disabled: clampedPage <= 1,
        })}
        {control(nextPage, "Next", {
          className: mobileArrowClass,
          ariaLabel: "Go to next page",
          disabled: clampedPage >= totalPages,
        })}
      </div>

      <div className="flex items-center justify-center sm:justify-end">
        <ul className="inline-flex items-center gap-1" role="list">
          <li className="hidden sm:block">
            {control(prevPage, "«", {
              className: arrowClass,
              ariaLabel: "Go to previous page",
              disabled: clampedPage <= 1,
            })}
          </li>

          {pages.map((p) =>
            Number.isInteger(p) ? (
              <li key={`page-${p}`}>
                {control(p, p, {
                  className: p === clampedPage ? activeNumber : inactiveNumber,
                  ariaLabel: `Go to page ${p}`,
                  current: p === clampedPage,
                })}
              </li>
            ) : (
              <li
                key={`ellipsis-${p}`}
                aria-hidden="true"
                className="px-2 text-xs sm:text-sm text-muted-foreground/60 select-none"
              >
                …
              </li>
            )
          )}

          <li className="hidden sm:block">
            {control(nextPage, "»", {
              className: arrowClass,
              ariaLabel: "Go to next page",
              disabled: clampedPage >= totalPages,
            })}
          </li>
        </ul>
      </div>

      <p className="text-center text-xs font-medium text-muted-foreground sm:text-right">
        Page{" "}
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-muted text-foreground">
          {clampedPage}
        </span>{" "}
        of {totalPages}
      </p>
    </nav>
  );
}
