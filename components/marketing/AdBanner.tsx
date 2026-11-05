"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { marketingConfig } from "@/config/marketing.config";
import { featuresConfig } from "@/config/features.config";
import { advertisingConfig } from "@/config/advertising.config";
import { useRotation } from "@/hooks/use-rotation";
import { RotationBars } from "@/components/marketing/RotationBars";
import { cn } from "@/lib/utils";

function AdLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex-shrink-0 px-1.5 py-0.5 text-[9px] font-medium rounded bg-muted text-muted-foreground",
        className
      )}
      aria-hidden
    >
      Ad
    </span>
  );
}

/**
 * AdBanner — horizontal promo banner below header.
 *
 * Priority:
 * 1. If promotions feature is enabled, fetch the banner ads; they take turns
 * 2. If no paid banner found, fall back to static marketingConfig.adBanner
 *
 * Easily add/remove:
 * - Set featuresConfig.adBanner = false to hide
 * - Set marketingConfig.adBanner.enabled = false to hide static fallback
 */
export function AdBanner() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const rotation = useRotation(banners.length);
  const paidBanner = banners[rotation.start];

  useEffect(() => {
    if (!featuresConfig.adBanner) {
      setLoaded(true);
      return;
    }
    // Try to fetch a paid banner promotion
    if (featuresConfig.promotions) {
      fetch("/api/promotions?type=banner")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          setBanners(json?.data || []);
        })
        .catch(() => {})
        .finally(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, []);

  if (!featuresConfig.adBanner || !loaded) {
    return null;
  }

  // Paid banner promotion
  if (paidBanner) {
    const handleClick = () => {
      try {
        fetch(`/api/promotions/${paidBanner.id}/click`, { method: "POST" });
      } catch {
        // ignore
      }
    };

    return (
      <aside className="print:hidden" aria-label="Advertisement" {...rotation.pauseProps}>
        <div className="border-b border-t border-muted dark:border-muted">
          <div className="container-classic py-3 px-4">
            {/* Phone: logo beside a two-line text block, full-width button below.
                From `sm`: everything on one line. */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <AdLabel className="hidden sm:inline-block" />
                {paidBanner.logo_url && (
                  <span className="flex-shrink-0 relative w-10 h-10 sm:w-6 sm:h-6 rounded-[var(--radius)] overflow-hidden">
                    <Image
                      src={paidBanner.logo_url}
                      alt=""
                      width={40}
                      height={40}
                      className="w-full h-full object-contain"
                    />
                  </span>
                )}
                <div className="min-w-0 sm:flex sm:items-baseline sm:gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 sm:flex-shrink-0">
                    <strong className="text-sm sm:text-base text-foreground truncate">
                      {paidBanner.name}
                    </strong>
                    <AdLabel className="sm:hidden" />
                  </div>
                  {(paidBanner.banner_text || paidBanner.short_description) && (
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-1">
                      {paidBanner.banner_text || paidBanner.short_description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <a
                  href={paidBanner.website_url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  onClick={handleClick}
                  className={cn(
                    "flex w-full sm:inline-flex sm:w-auto items-center justify-center px-4 py-2",
                    "text-sm font-medium text-foreground",
                    "bg-background border border-border rounded-lg",
                    "hover:bg-muted transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  {paidBanner.cta_text || `Visit ${paidBanner.name}`}
                </a>
              </div>
            </div>
            <RotationBars
              pages={rotation.pages}
              page={rotation.page}
              seconds={advertisingConfig.promotions.rotationSeconds}
              paused={rotation.paused}
              onSelect={rotation.goTo}
              onComplete={rotation.next}
              className="mt-1 -mb-2"
            />
          </div>
        </div>
      </aside>
    );
  }

  // Fallback to static config
  const { adBanner } = marketingConfig;

  if (!adBanner.enabled) {
    return null;
  }

  const isExternal =
    adBanner.buttonLink.startsWith("http://") ||
    adBanner.buttonLink.startsWith("https://");

  return (
    <aside
      className="print:hidden"
      aria-label="Advertisement"
    >
      <div className="border-b border-t border-muted dark:border-muted">
        <div className="container-classic py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Ad label, icon, text */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span
                className="flex-shrink-0 px-2 py-1 text-[9px] font-medium rounded bg-muted text-muted-foreground"
                aria-hidden
              >
                Ad
              </span>
              <span className="flex-shrink-0 w-6 h-6 relative rounded-[var(--radius)]">
                <Image
                  src={adBanner.iconSrc}
                  alt={adBanner.iconAlt}
                  width={24}
                  height={24}
                  className="object-contain rounded-[var(--radius)]"
                />
              </span>
              <span className="text-sm sm:text-base text-foreground truncate">
                {adBanner.text}
              </span>
            </div>

            {/* Right: CTA button */}
            <div className="flex-shrink-0">
              {isExternal ? (
                <a
                  href={adBanner.buttonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center px-4 py-2",
                    "text-sm font-medium text-foreground",
                    "bg-background border border-border rounded-lg",
                    "hover:bg-muted transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  {adBanner.buttonText}
                </a>
              ) : (
                <Link
                  href={adBanner.buttonLink}
                  className={cn(
                    "inline-flex items-center justify-center px-4 py-2",
                    "text-sm font-medium text-foreground",
                    "bg-background border border-border rounded-lg",
                    "hover:bg-muted transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  {adBanner.buttonText}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
