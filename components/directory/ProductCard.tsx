"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Crown, Eye, Calendar } from "lucide-react";
import { CategoryBadge, PricingBadge } from "./CategoryBadge";
import { BookmarkButton } from "./BookmarkButton";
import { StarRating } from "./StarRating";
import { siteConfig } from "@/config/site.config";
import { isEnabled } from "@/lib/features";
import { getLogoDevUrl } from "@/lib/utils";

// Format relative time (e.g. "2 days ago")
function formatRelativeTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return diffDays + " days ago";
  if (diffDays < 30) return Math.floor(diffDays / 7) + " weeks ago";
  if (diffDays < 365) return Math.floor(diffDays / 30) + " months ago";
  return Math.floor(diffDays / 365) + " years ago";
}

// Helper function to generate AI project link with ref parameter and proper rel attribute
const generateProjectLink = (project) => {
  // Validate that website_url exists and is a valid URL
  if (!project.website_url || typeof project.website_url !== 'string') {
    return {
      url: '#',
      rel: "nofollow noopener noreferrer"
    };
  }

  try {
    // Add ref parameter as per CLAUDE.md spec
    const url = new URL(project.website_url);
    url.searchParams.set('ref', siteConfig.refParameter);

    // Use the link_type field from database
    // - "dofollow": Premium plans or manually upgraded
    // - "nofollow": Standard (FREE) plans by default
    const isDofollow = project.link_type === "dofollow";

    return {
      url: url.toString(),
      rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer"
    };
  } catch (error) {
    console.warn('Invalid URL for AI project:', project.name, project.website_url);
    return {
      url: '#',
      rel: "nofollow noopener noreferrer"
    };
  }
};

export function ProductCard({
  project,
  inactiveCta = false,
  viewMode = "auto",
  showStatusBadge = false,
}) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size for auto view mode
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Determine actual view mode
  const actualViewMode = viewMode === "auto" ? (isMobile ? "grid" : "list") : viewMode;

  const cardBaseClasses =
    "w-full h-full bg-card rounded-[var(--radius)] gap-4 border border-border group cursor-pointer transition duration-300 ease-in-out";
  const cardHoverClasses =
    "hover:-translate-y-1";

  // Generate AI project link data once for use in multiple places
  const projectLink = generateProjectLink(project);

  const handleVisitWebsite = async () => {
    try {
      await fetch("/api/projects/" + project.slug + "/click", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  const projectHref = "/project/" + project.slug;

  // Grid view layout (OpenAlternative-style: logo+title row, description, metrics, categories+visit)
  if (actualViewMode === "grid") {
    return (
      <Link href={projectHref} className="block">
        <div
          className={cardBaseClasses + " " + cardHoverClasses + " p-4 flex flex-col"}
          style={{
            boxShadow: "var(--card-shadow)",
          }}
        >
          {/* Row 1: Logo + Title & badges (same row) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius)] border border-border flex-shrink-0 bg-muted">
              {(project.logo_url || getLogoDevUrl(project.website_url)) ? (
                <Image
                  src={project.logo_url || getLogoDevUrl(project.website_url)}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-[var(--radius)] object-cover w-full h-full"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-foreground">
                  {project.name?.[0] ?? "?"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col items-start flex-wrap">
                <h3 className="text-base font-bold text-foreground">
                  {project.name}
                </h3>
                {/* Rating */}
                {isEnabled("ratings") && (
                  <StarRating
                    appId={project.id}
                    averageRating={project.average_rating ?? 0}
                    ratingsCount={project.ratings_count ?? 0}
                    userRating={null}
                    readonly
                    size="sm"
                  />
                )}
                {project.plan === "premium" && (
                  <span className="absolute -top-2 right-3 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground rounded-sm bg-primary">
                    <Crown className="w-3 h-3" strokeWidth={1.5} />
                    Premium
                  </span>
                )}
                {showStatusBadge && project.statusBadge && (
                  <span className={"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset " + (
                    project.statusBadge === "past"
                      ? "bg-muted text-muted-foreground ring-border"
                      : project.statusBadge === "scheduled"
                        ? "bg-accent text-accent-foreground ring-yellow-600/20"
                        : "bg-accent text-accent-foreground ring-green-600/20"
                  )}>
                    {project.statusBadge === "past" ? "Past" :
                      project.statusBadge === "scheduled" ? "Scheduled" : "Live"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Description (one line) */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.short_description || "—"}
          </p>
          <div className="flex flex-wrap gap-1 min-w-0">
            {project.pricing && <PricingBadge pricing={project.pricing} size="xs" clickable={false} />}
            {project.categories.slice(0, 2).map((category) => (
              <CategoryBadge key={category} category={category} size="xs" clickable={false} />
            ))}
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t border-border">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>Views</span>
                <span className="font-medium text-foreground">{project.views ?? 0}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isEnabled("bookmarks") && (
                <BookmarkButton appId={project.id} initialBookmarked={project.userBookmarked ?? false} size="sm" />
              )}
              <button
                type="button"
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-foreground hover:text-background transition shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVisitWebsite();
                  window.open(projectLink.url, "_blank", "noopener,noreferrer");
                }}
                aria-label={`Visit ${project.name} website`}
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // List view layout (default/existing)
  return (
    <Link href={projectHref} className="block">
      <div
        className={cardBaseClasses + " " + cardHoverClasses + " flex flex-col md:flex-row items-start md:items-center p-4"}
      >
        <div className="flex items-start space-x-3 flex-1 w-full md:w-auto">
        {/* Logo */}
        <div className="w-[64px] h-[64px] md:w-[96px] md:h-[96px] border rounded-lg border-border overflow-hidden flex-shrink-0">
            {(project.logo_url || getLogoDevUrl(project.website_url)) ? (
              <Image
                src={project.logo_url || getLogoDevUrl(project.website_url)}
                alt={project.name + " logo"}
                width={96}
                height={96}
                className="rounded-lg object-cover w-full h-full"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted text-xs text-muted-foreground">
                {project.name?.[0] ?? "?"}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1 flex-wrap">
              <h3 className="text-base md:text-lg font-semibold text-foreground">
                {project.name}
              </h3>

              {/* Badges next to title */}
              <div className="flex items-center space-x-1">
                {/* Premium Badge */}
                {project.plan === "premium" && (
                  <span className="inline-flex leading-none items-center gap-1 px-1 py-0.5 text-[11px] font-medium text-primary-foreground rounded-sm" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                    <Crown className="w-4 h-4" strokeWidth={1.5} />
                    <span className="mt-0.5">Premium</span>
                  </span>
                )}
              </div>

              {/* Status Badge - Only show on private dashboard */}
              {showStatusBadge && project.statusBadge && (
                <span className={"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset " + (
                  project.statusBadge === "past"
                    ? "bg-muted text-muted-foreground ring-border"
                    : project.statusBadge === "scheduled"
                      ? "bg-accent text-accent-foreground ring-yellow-600/20"
                      : "bg-accent text-accent-foreground ring-green-600/20"
                )}>
                  {project.statusBadge === "past" ? "Past" :
                    project.statusBadge === "scheduled" ? "Scheduled" :
                      "Live"}
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 md:line-clamp-1">
              {project.short_description}
            </p>

            <div className="flex flex-wrap gap-1 mb-1 md:mb-0">
              {/* Pricing Badge */}
              {project.pricing && (
                <PricingBadge pricing={project.pricing} size="xs" clickable={false} />
              )}

              {/* Category Badges */}
              {project.categories.slice(0, 3).map((category) => (
                <CategoryBadge key={category} category={category} size="xs" clickable={false} />
              ))}
            </div>

            {isEnabled("ratings") && (
              <div className="mt-1">
                <StarRating
                  appId={project.id}
                  averageRating={project.average_rating ?? 0}
                  ratingsCount={project.ratings_count ?? 0}
                  userRating={null}
                  readonly
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center justify-end gap-2 mt-4 md:mt-0 md:ml-4 w-full md:w-auto">
          {isEnabled("bookmarks") && (
            <BookmarkButton appId={project.id} initialBookmarked={project.userBookmarked ?? false} size="sm" />
          )}
          <button
            type="button"
            className="cursor-pointer inline-flex items-center justify-center rounded-md border border-border bg-muted px-2 py-2 text-muted-foreground hover:bg-muted transition"
            onClick={(e) => {
              e.stopPropagation();
              handleVisitWebsite();
              window.open(projectLink.url, "_blank", "noopener,noreferrer");
            }}
            aria-label={`Visit ${project.name} website`}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
