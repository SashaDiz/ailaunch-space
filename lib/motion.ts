/**
 * Centralized Motion (motion/react) presets for Base UI microanimations.
 *
 * Base UI times the unmount of popups via `element.getAnimations()`, so every
 * exit animation here MUST animate `opacity` (translate-only animations are not
 * detected). Keep values subtle; respect reduced motion via `useReducedMotion`
 * at the call site or rely on the OS-level reduction Motion applies by default.
 */

import type { Transition, Variants } from 'motion/react';

/** Snappy spring used for thumbs, indicators and small interactive parts. */
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.6,
};

/** Standard ease/timing for overlay enter/exit (interruptible). */
export const easeOverlay: Transition = {
  duration: 0.18,
  ease: [0.16, 1, 0.3, 1],
};

/** Fade + subtle scale for centered overlays (Dialog, AlertDialog). */
export const overlayPopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: easeOverlay },
  exit: { opacity: 0, scale: 0.96, transition: { ...easeOverlay, duration: 0.14 } },
};

/** Backdrop fade for modal scrims. */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeOverlay },
  exit: { opacity: 0, transition: { ...easeOverlay, duration: 0.14 } },
};

/** Fade + small lift for anchored popups (Popover, Menu, Select, Tooltip). */
export const anchoredPopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: easeOverlay },
  exit: { opacity: 0, scale: 0.96, y: -4, transition: { ...easeOverlay, duration: 0.12 } },
};

/** Container that staggers its children on mount (lists, card grids). */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

/** Single item entrance used inside `staggerContainer`. */
export const fadeInUpItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

/** Interactive feedback for buttons / pressable surfaces. */
export const tapScale = { scale: 0.97 } as const;
export const hoverScale = { scale: 1.02 } as const;
