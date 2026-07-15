"use client";

import * as React from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ahrefsCheckerUrl, SITE_DOMAIN } from "@/lib/domain-rating";

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DomainRatingBadgeProps {
  /** Domain the score is for. Defaults to the site domain. */
  target?: string;
  className?: string;
}

/**
 * Live Ahrefs Domain Rating badge.
 *
 * A circular gauge whose arc runs red → orange → yellow → green with the score
 * in the centre — the whole badge links to Ahrefs' authority checker, which
 * satisfies the DR data license's attribution requirement. The value is fetched
 * client-side from the cached `/api/domain-rating` route (no build-time
 * dependency, no hardcoded number), and the gauge + number animate on arrival.
 */
export function DomainRatingBadge({ target = SITE_DOMAIN, className }: DomainRatingBadgeProps) {
  const reduceMotion = useReducedMotion();
  const [dr, setDr] = React.useState<number | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetch("/api/domain-rating")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data && typeof data.dr === "number" && data.dr > 0) {
          setDr(Math.round(data.dr));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Count-up for the number.
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  React.useEffect(() => {
    if (dr == null) return;
    if (reduceMotion) {
      count.set(dr);
      return;
    }
    const controls = animate(count, dr, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [dr, reduceMotion, count]);

  // Skeleton until the live value arrives — never shows a hardcoded number.
  if (dr == null) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center gap-3 rounded-full border border-border bg-card/70 py-1.5 pl-1.5 pr-4",
          className
        )}
      >
        <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-muted" />
        <span className="flex flex-col gap-1.5">
          <span className="h-2.5 w-24 animate-pulse rounded bg-muted" />
          <span className="h-2 w-14 animate-pulse rounded bg-muted" />
        </span>
      </span>
    );
  }

  const value = Math.max(0, Math.min(100, dr));
  const offset = CIRCUMFERENCE * (1 - value / 100);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.a
            href={ahrefsCheckerUrl(target)}
            target="_blank"
            rel="nofollow noopener noreferrer"
            aria-label={`Domain Rating ${value} out of 100 for ${target}, measured by Ahrefs. Opens the Ahrefs authority checker.`}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "group inline-flex items-center gap-3 rounded-full border border-border bg-card/80 py-1.5 pl-1.5 pr-4",
              "shadow-sm backdrop-blur transition-colors duration-300 hover:border-foreground/40 hover:bg-card",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              className
            )}
          >
            {/* Circular gauge: red → orange → yellow → green */}
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
              <svg viewBox="0 0 48 48" className="h-11 w-11 -rotate-90">
                <defs>
                  <linearGradient id="dr-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="35%" stopColor="#f97316" />
                    <stop offset="65%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <circle
                  cx="24"
                  cy="24"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="5"
                  className="stroke-muted"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r={RADIUS}
                  fill="none"
                  stroke="url(#dr-gauge-gradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  initial={reduceMotion ? false : { strokeDashoffset: CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <motion.span className="absolute text-sm font-bold tabular-nums text-foreground">
                {rounded}
              </motion.span>
            </span>

            {/* Label + attribution */}
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                Domain Rating
              </span>
              <span className="text-[10px] text-muted-foreground">
                by <span className="font-semibold text-muted-foreground">Ahrefs</span>
              </span>
            </span>
          </motion.a>
        </TooltipTrigger>
        <TooltipContent side="top" showArrow className="max-w-[240px] text-center">
          Domain Rating (DR) rates a site&apos;s backlink authority on a 0–100
          logarithmic scale. Live data from Ahrefs — click to verify.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
