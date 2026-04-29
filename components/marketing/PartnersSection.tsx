"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { featuresConfig } from "@/config/features.config";

// No placeholders — only show partners returned from /api/partners.
// Admin can add real partners through the admin panel; until then the section
// just renders the "Become a sponsor" CTA tile.
const PLACEHOLDER_SPONSORS: Array<{ id: string; name: string; description: string; logo: string; website_url: string }> = [];

export function PartnersSection() {
  const [partners, setPartners] = useState<
    { id: string; name: string; description: string; logo: string; website_url: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!featuresConfig.partners) {
      setLoading(false);
      return;
    }
    async function fetchPartners() {
      try {
        const response = await fetch("/api/partners");
        if (response.ok) {
          const data = await response.json();
          setPartners(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch partners:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, []);

  if (!featuresConfig.partners) return null;

  const displayPartners = partners.length > 0 ? partners.slice(0, 8) : PLACEHOLDER_SPONSORS;
  const showBecomeButton = displayPartners.length < 8;

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

  if (displayPartners.length === 0 && !showBecomeButton) return null;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center mb-4">Our Partners</h2>
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
                    <Image
                      src={partner.logo}
                      alt={partner.name || partner.description || "Sponsor logo"}
                      width={120}
                      height={40}
                      className="max-h-[24px] max-w-[80px] w-auto object-contain dark:invert"
                    />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px] text-center">
                  <p className="text-xs">{partner.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {showBecomeButton && (
              <a
                href="/sponsor"
                className="flex items-center justify-center gap-1.5 p-3 sm:p-4 bg-background transition-colors hover:bg-muted/90 text-muted-foreground hover:text-foreground"
              >
                <span className="text-xs font-medium">Become a sponsor</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
