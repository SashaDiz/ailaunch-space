"use client";

import { siteConfig } from "@/config/site.config";

interface ThemeAwareLogoProps {
  /** Use "inverted" for areas with inverted background (e.g. footer with bg-foreground) */
  variant?: "default" | "inverted";
  height?: number;
  width?: number;
  className?: string;
  priority?: boolean;
  /** When true, only the icon is shown (e.g. collapsed sidebar) */
  iconOnly?: boolean;
}

export function ThemeAwareLogo({
  variant = "default",
  className = "",
  iconOnly = false,
}: ThemeAwareLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary-foreground">
          <path d="M2 3L8 1L14 3V8C14 11.3 11.4 14.2 8 15C4.6 14.2 2 11.3 2 8V3Z" fill="currentColor"/>
        </svg>
      </div>
      {!iconOnly && (
        <span className={`text-lg font-bold tracking-tight ${variant === "inverted" ? "text-background" : "text-foreground"}`}>
          {siteConfig.name}
        </span>
      )}
    </div>
  );
}
