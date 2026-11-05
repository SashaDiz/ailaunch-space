"use client";

import { cn } from "@/lib/utils";

/** Quiet on purpose: this marks progress, it shouldn't compete with the ad. */
const FILL = "block h-full bg-foreground/60 dark:bg-white/70";

/**
 * One bar per slot for ads that take turns: the active bar fills up to the
 * next swap, and clicking any bar jumps to that slot. Renders nothing when
 * there is a single slot, so nothing rotates then either.
 */
export function RotationBars({
  pages,
  page,
  seconds,
  paused,
  onSelect,
  onComplete,
  className,
}: {
  pages: number;
  page: number;
  seconds: number;
  paused: boolean;
  onSelect: (page: number) => void;
  /** Fires when the active bar fills. This is the rotation's clock. */
  onComplete: () => void;
  className?: string;
}) {
  if (pages <= 1) return null;

  return (
    <div role="group" aria-label="Ad slots" className={cn("flex justify-center gap-1.5", className)}>
      {Array.from({ length: pages }, (_, slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onSelect(slot)}
          aria-label={`Show ad slot ${slot + 1} of ${pages}`}
          aria-current={slot === page ? "true" : undefined}
          // The tall hit area around a thin bar keeps it easy to click.
          className="group w-7 flex-none py-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="block h-[3px] overflow-hidden rounded-full bg-foreground/15 transition-colors group-hover:bg-foreground/25 dark:bg-white/15 dark:group-hover:bg-white/25">
            {slot < page && <span className={FILL} />}
            {slot === page && (
              <span
                key={page}
                className={`ad-progress-fill ${FILL}`}
                style={{
                  animationDuration: `${seconds}s`,
                  animationPlayState: paused ? "paused" : "running",
                }}
                onAnimationEnd={onComplete}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
