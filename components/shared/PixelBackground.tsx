"use client";

import { memo, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

/**
 * Full-viewport WebGL "dithering" backdrop ported from authority-hunt.
 * Uses @paper-design/shaders-react. Loaded on the client only — there's no
 * useful SSR output for a shader, and skipping the server pass shaves the
 * initial HTML.
 *
 * The component sits behind every page (z-index: 0) and is fully transparent
 * to pointer events. Defaults to the dark palette during SSR and the first
 * client render so a hydration mismatch can't briefly flash a light backdrop.
 */

const Dithering = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.Dithering),
  { ssr: false },
);

const MemoizedDithering = memo(Dithering);

const themeColors = {
  dark: { colorFront: "#005B5B", colorBack: "#00000000", backgroundColor: "#0a0e14" },
  light: { colorFront: "#1D2D53", colorBack: "#00000000", backgroundColor: "#ffffff" },
} as const;

// Shape names available in @paper-design/shaders-react@0.0.71 (matches authority-hunt):
//   "wave" | "simplex" | "circle" | "square"
type DitheringShape = "wave" | "simplex" | "circle" | "square";

interface PixelBackgroundProps {
  speed?: number;
  /** Dithering shape — "circle" matches authority-hunt's reference. */
  shape?: DitheringShape;
  type?: "2x2" | "4x4" | "8x8";
  pxSize?: number;
  scale?: number;
  className?: string;
}

export function PixelBackground({
  speed = 0.43,
  shape = "circle",
  type = "4x4",
  pxSize = 3,
  scale = 1.13,
  className = "",
}: PixelBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to dark during SSR / pre-mount so the first paint never flashes
  // a light backdrop on the dark theme.
  const colors = mounted
    ? themeColors[resolvedTheme === "light" ? "light" : "dark"]
    : themeColors.dark;

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 select-none ${className}`}
      style={{
        contain: "layout style paint",
        willChange: "transform",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        backgroundColor: colors.backgroundColor,
      }}
    >
      {mounted && (
        <MemoizedDithering
          colorBack={colors.colorBack}
          colorFront={colors.colorFront}
          speed={speed}
          // The installed runtime accepts "circle" but pnpm has dual-pinned
          // .d.ts files where TS picks up the newer 0.0.76 union (no "circle").
          // Cast to keep the matching v0.0.71 shape names.
          shape={shape as never}
          type={type}
          pxSize={pxSize}
          scale={scale}
          style={{
            backgroundColor: colors.backgroundColor,
            height: "100vh",
            width: "100%",
          }}
        />
      )}
    </div>
  );
}
