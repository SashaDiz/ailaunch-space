"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { featuresConfig } from "@/config/features.config";
import { advertisingConfig } from "@/config/advertising.config";

const MAX_LOGOS = advertisingConfig.promotions.placements.logo.maxActive;

/** The Homepage Logo placement. */
export function PartnersSection() {
  const [partners, setPartners] = useState<
    {
      id: string;
      name: string;
      short_description: string;
      logo_url: string;
      wordmark_url: string | null;
      website_url: string;
    }[]
  >([]);
  const [hasOpenSlot, setHasOpenSlot] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!featuresConfig.partners) {
      setLoading(false);
      return;
    }
    async function fetchPartners() {
      try {
        const response = await fetch("/api/promotions?type=logo");
        if (response.ok) {
          const data = await response.json();
          setPartners(data.data || []);
          setHasOpenSlot(data.available === true);
        }
      } catch (error) {
        console.error("Failed to fetch sponsors:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, []);

  if (!featuresConfig.partners) return null;

  const displayPartners = partners.slice(0, MAX_LOGOS);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center gap-3">
        <div className="max-w-3xl mx-auto rounded-[var(--radius)] border border-muted overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-muted">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-center p-5 sm:p-6 bg-background">
                <Skeleton className="h-8 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (displayPartners.length === 0 && !hasOpenSlot) return null;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center mb-4">Our Sponsors</h2>
      <TooltipProvider delayDuration={200}>
        <div className="max-w-3xl mx-auto rounded-[var(--radius)] border border-muted overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-muted">
            {displayPartners.map((partner) => (
              <Tooltip key={partner.id}>
                <TooltipTrigger asChild>
                  <a
                    href={partner.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-3 sm:p-4 bg-background transition-colors hover:bg-muted/90"
                  >
                    {/* Only a transparent wordmark survives inverting in dark mode. */}
                    <Image
                      src={partner.wordmark_url || partner.logo_url}
                      alt={partner.name || partner.short_description || "Sponsor logo"}
                      width={120}
                      height={40}
                      className={`max-h-[24px] max-w-[80px] w-auto object-contain ${partner.wordmark_url ? "dark:invert" : ""}`}
                    />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} showArrow className="max-w-[250px] text-center">
                  <p className="text-xs">{partner.short_description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {hasOpenSlot && (
              <Link
                href="/promote"
                className="flex items-center justify-center gap-1.5 p-3 sm:p-4 bg-background transition-colors hover:bg-muted/90 text-muted-foreground hover:text-foreground"
              >
                <span className="text-xs font-medium">Your logo here</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
