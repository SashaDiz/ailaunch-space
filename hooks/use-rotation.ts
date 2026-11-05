"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Index for ads that take turns. Advances by `visible` every `seconds`, so a
 * page showing two cards swaps both. Does nothing when everything already
 * fits, and holds while the ad is hovered or focused so it can't change
 * under the cursor, or while the tab is hidden.
 */
export function useRotation(count: number, seconds: number, visible = 1) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (count <= visible) return;
    const timer = setInterval(() => {
      if (paused.current || document.hidden) return;
      setIndex((current) => (current + visible) % count);
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [count, seconds, visible]);

  const pauseProps = useMemo(() => {
    const pause = () => { paused.current = true; };
    const resume = () => { paused.current = false; };
    return { onMouseEnter: pause, onMouseLeave: resume, onFocus: pause, onBlur: resume };
  }, []);

  return { index, pauseProps };
}
