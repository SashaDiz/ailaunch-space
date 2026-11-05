"use client";

import { useEffect, useMemo, useState, type FocusEvent, type PointerEvent } from "react";

/**
 * State for ads that take turns, `visible` at a time. The clock is the active
 * bar's CSS animation in `RotationBars`, which calls `next` when it ends, so
 * the bar and the swap can't drift apart. `paused` holds it while an ad is
 * under the mouse or has keyboard focus, or the tab is hidden.
 */
export function useRotation(count: number, visible = 1) {
  const [page, setPage] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const pages = Math.ceil(count / visible);
  const current = pages > 0 ? page % pages : 0;

  const pauseProps = useMemo(
    () => ({
      // Mouse only: a tap never fires a matching leave, so it would pause for good.
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType === "mouse") setHovered(true);
      },
      onPointerLeave: () => setHovered(false),
      // Keyboard only: a clicked bar keeps focus after the mouse has moved on.
      onFocus: (event: FocusEvent) => {
        if ((event.target as HTMLElement).matches(":focus-visible")) setFocused(true);
      },
      onBlur: () => setFocused(false),
    }),
    []
  );

  return {
    page: current,
    pages,
    /** First item on the current page, for `rotatedWindow`. */
    start: current * visible,
    paused: hovered || focused || hidden,
    goTo: setPage,
    next: () => setPage((value) => value + 1),
    pauseProps,
  };
}
