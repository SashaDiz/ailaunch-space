"use client";

import React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { getLogoDevUrl } from "@/lib/utils";

export type ProjectLike = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  short_description?: string | null;
  website_url?: string | null;
  link_type?: string;
  /** If set, this is a paid promotion (not a featured project) */
  promotion_id?: string;
  /** Custom CTA button text (max 20 chars) */
  cta_text?: string | null;
};

export function getVisitUrl(project: ProjectLike): { url: string; rel: string } {
  if (!project.website_url || typeof project.website_url !== "string") {
    return { url: "#", rel: "nofollow noopener noreferrer" };
  }
  try {
    const url = new URL(project.website_url);
    url.searchParams.set("ref", siteConfig.refParameter);
    const isDofollow = project.link_type === "dofollow";
    return {
      url: url.toString(),
      rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer",
    };
  } catch {
    return { url: "#", rel: "nofollow noopener noreferrer" };
  }
}

/** Count a click on a paid placement (promotion or Premium project). */
export async function trackPlacementClick(project: ProjectLike): Promise<void> {
  try {
    if (project.promotion_id) {
      await fetch(`/api/promotions/${project.promotion_id}/click`, { method: "POST" });
    } else {
      await fetch(`/api/projects/${project.slug}/click`, { method: "POST" });
    }
  } catch {
    // ignore
  }
}

export function PaidPlacementCard({
  project,
  variant = "grid",
}: {
  project: ProjectLike;
  /** `rail` is the narrow side-column form: no grid-row min height, CTA truncates. */
  variant?: "grid" | "rail";
}) {
  const isRail = variant === "rail";
  const visitLink = getVisitUrl(project);

  const handleVisit = () => trackPlacementClick(project);

  const ctaLabel = project.cta_text || `Visit ${project.name}`;

  return (
    <div
      className={`relative z-0 w-full ${isRail ? "shrink-0" : "h-full"} transition-[transform] duration-300 ease-out hover:-translate-y-1 hover:z-10`}
    >
      <a
        href={visitLink.url}
        target="_blank"
        rel={visitLink.rel}
        onClick={handleVisit}
        className={`group relative w-full h-full flex flex-col rounded-[var(--radius)] border border-primary bg-card p-4 ${isRail ? "" : "min-h-[200px]"} transition-[border-color] duration-300 ease-in-out focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
        // Rail cards sit flat on the shader: no drop shadow under them.
        style={isRail ? undefined : { boxShadow: "var(--card-shadow)" }}
        aria-label={`Visit ${project.name}`}
      >
      {/* Top-right pill: Premium listings share this card but aren't adverts */}
      <span
        className="absolute -top-2 right-3 inline-flex items-center rounded-sm bg-muted border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
        aria-hidden
      >
        {project.promotion_id ? "Ad" : "Premium"}
      </span>

      {/* Logo + name row */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-[var(--radius)] border bg-card text-card-foreground">
          {(project.logo_url || getLogoDevUrl(project.website_url)) ? (
            <Image
              src={project.logo_url || getLogoDevUrl(project.website_url)}
              alt=""
              width={48}
              height={48}
              className="rounded-lg object-cover w-full h-full"
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
              {project.name?.[0] ?? "?"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground line-clamp-1">
            {project.name}
          </h3>
        </div>
      </div>

      {/* Description */}
      {/* flex-1 sits on a wrapper: on the clamped text it stretches the box and
          reveals the line the clamp is hiding. */}
      <div className="mb-4 flex-1">
        <p className={`text-sm text-muted-foreground ${isRail ? "line-clamp-3" : "line-clamp-2"}`}>
          {project.short_description || "—"}
        </p>
      </div>

      {/* CTA — styled as button, part of the card link */}
      <span
        className="inline-flex items-center w-full rounded-[var(--radius)] justify-between gap-2 border border-border bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition duration-200 group-hover:bg-primary/90"
        style={{
          boxShadow: "var(--card-shadow)",
        }}
      >
        <span className="truncate">{ctaLabel}</span>
        <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
      </span>
      </a>
    </div>
  );
}
