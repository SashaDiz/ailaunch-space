"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

// DataFast "recent visitors" widget. The primary color is baked into the
// iframe URL, so we swap the src by theme to match the site palette:
//   light → purple (--primary: 270 80% 50% ≈ #801ae6)
//   dark  → orange (--primary: 25 100% 55% ≈ #ff791a)
const WIDGET_ID = "6a4fe2e4f0fdf9e4f7c9bb74";
const PRIMARY_LIGHT = "#801ae6";
const PRIMARY_DARK = "#ff791a";

function buildSrc(color: string) {
  return `https://datafa.st/widgets/${WIDGET_ID}/recent?mainTextSize=16&primaryColor=${encodeURIComponent(
    color
  )}`;
}

export function DataFastWidget() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Before mount the theme is unknown; default to light to keep SSR/CSR markup
  // stable, then re-render with the resolved theme once mounted.
  const color = mounted && resolvedTheme === "dark" ? PRIMARY_DARK : PRIMARY_LIGHT;

  return (
    <iframe
      src={buildSrc(color)}
      // The widget's internal card is max-w-xs (320px) and horizontally
      // centered by DataFast. Cap the iframe to that width so the card fills it
      // and its left edge sits flush with our container instead of being
      // centered inside a wider frame.
      style={{ background: "transparent", border: "none", display: "block", width: "100%", maxWidth: "324px", height: "320px" }}
      title="DataFast Widget"
      loading="lazy"
    />
  );
}
