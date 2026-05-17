"use client";

import Image from "next/image";
import { siteConfig } from "@/config/site.config";

interface ThemeAwareLogoProps {
  /** Use "inverted" for areas with inverted background (e.g. footer with bg-foreground) */
  variant?: "default" | "inverted";
  /** Rendered pixel height; width is derived from the SVG's intrinsic 534×170 aspect ratio unless `width` is also given. */
  height?: number;
  /** Optional explicit width; otherwise computed from `height` × intrinsic aspect. */
  width?: number;
  className?: string;
  priority?: boolean;
  /** When true, only the icon is shown (e.g. collapsed sidebar / mobile). */
  iconOnly?: boolean;
}

const ASPECT_RATIO = 534 / 170; // intrinsic logo SVG ratio

export function ThemeAwareLogo({
  variant = "default",
  className = "",
  height = 32,
  width,
  priority = false,
  iconOnly = false,
}: ThemeAwareLogoProps) {
  // When iconOnly, use the dedicated square symbol mark (no wordmark) if one
  // is configured; otherwise fall back to the full logo.
  const iconLight = siteConfig.logo.iconLight ?? siteConfig.logo.light;
  const iconDark = siteConfig.logo.iconDark ?? siteConfig.logo.dark;
  const useIcon = iconOnly && Boolean(siteConfig.logo.iconLight);

  const lightSrc = useIcon ? iconLight : siteConfig.logo.light;
  const darkSrc = useIcon ? iconDark : siteConfig.logo.dark;

  const renderHeight = height;
  const renderWidth = useIcon
    ? renderHeight // symbol mark is square
    : iconOnly
      ? renderHeight
      : (width ?? Math.round(renderHeight * ASPECT_RATIO));

  // For inverted (dark footer / light copy), always use the white logo.
  if (variant === "inverted") {
    return (
      <Image
        src={darkSrc}
        alt={`${siteConfig.name} logo`}
        width={renderWidth}
        height={renderHeight}
        className={className}
        priority={priority}
      />
    );
  }

  // Default: light logo on light theme, white logo on dark theme.
  // Two <Image> tags + Tailwind dark: utilities — works without useTheme/JS,
  // SSR-friendly, no FOUC.
  return (
    <>
      <Image
        src={lightSrc}
        alt={`${siteConfig.name} logo`}
        width={renderWidth}
        height={renderHeight}
        className={`block dark:hidden ${className}`}
        priority={priority}
      />
      <Image
        src={darkSrc}
        alt={`${siteConfig.name} logo`}
        width={renderWidth}
        height={renderHeight}
        className={`hidden dark:block ${className}`}
        priority={priority}
      />
    </>
  );
}
