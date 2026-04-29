"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { marketingConfig } from "@/config/marketing.config";
import { featuresConfig } from "@/config/features.config";
import { cn } from "@/lib/utils";

/**
 * AdBanner — horizontal promo banner below header.
 *
 * Priority:
 * 1. If promotions feature is enabled, fetch active paid banner promotions
 * 2. If no paid banner found, fall back to static marketingConfig.adBanner
 *
 * Easily add/remove:
 * - Set featuresConfig.adBanner = false to hide
 * - Set marketingConfig.adBanner.enabled = false to hide static fallback
 */
export function AdBanner() {
  const [paidBanner, setPaidBanner] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

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
          const banners = json?.data || [];
          if (banners.length > 0) {
            setPaidBanner(banners[0]);
          }
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
      <aside className="print:hidden" aria-label="Advertisement">
        <div className="border-b border-t border-muted dark:border-muted">
          <div className="container-classic py-3 px-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-medium rounded bg-muted text-muted-foreground"
                  aria-hidden
                >
                  Ad
                </span>
                {paidBanner.logo_url && (
                  <span className="flex-shrink-0 w-6 h-6 relative rounded-[var(--radius)]">
                    <Image
                      src={paidBanner.logo_url}
                      alt={paidBanner.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </span>
                )}
                <span className="text-sm sm:text-base text-foreground truncate">
                  <strong>{paidBanner.name}</strong>
                  {paidBanner.short_description && (
                    <span className="text-muted-foreground ml-1.5">{paidBanner.short_description}</span>
                  )}
                </span>
              </div>
              <div className="flex-shrink-0">
                <a
                  href={paidBanner.website_url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  onClick={handleClick}
                  className={cn(
                    "inline-flex items-center justify-center px-4 py-2",
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
