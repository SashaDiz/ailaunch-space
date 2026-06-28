"use client";

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getAdminPageMeta } from "@/lib/admin-nav";
import { easeOverlay } from "@/lib/motion";

/**
 * Lets each admin page render its action buttons into the shared, route-driven
 * header so the title and actions sit on the same row (instead of the page
 * leaving a gap and stacking its own toolbar below). The header owns the slot
 * element; pages portal their buttons into it.
 */
const HeaderActionsContext = createContext<{
  slotEl: HTMLElement | null;
  setSlotEl: (el: HTMLElement | null) => void;
}>({ slotEl: null, setSlotEl: () => {} });

export function AdminHeaderActionsProvider({ children }: { children: ReactNode }) {
  const [slotEl, setSlotEl] = useState<HTMLElement | null>(null);
  return (
    <HeaderActionsContext.Provider value={{ slotEl, setSlotEl }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

/**
 * Renders its children into the page header's right-hand action slot. Place a
 * page's primary buttons/toolbar inside this instead of a local header row.
 */
export function AdminPageActions({ children }: { children: ReactNode }) {
  const { slotEl } = useContext(HeaderActionsContext);
  if (!slotEl) return null;
  return createPortal(children, slotEl);
}

/**
 * Route-driven page heading rendered once in the persistent admin layout.
 * Because `usePathname` updates synchronously on navigation, the title swaps
 * the instant a sidebar link is clicked — before the destination page mounts
 * or fetches data. Returns nothing for admin routes absent from the nav (e.g.
 * /admin/changelog), which keep their own heading.
 */
export function AdminPageHeader() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { setSlotEl } = useContext(HeaderActionsContext);
  const meta = getAdminPageMeta(pathname);

  if (!meta) return null;

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-[3.25rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={meta.title}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={easeOverlay}
          >
            <h1 className="text-3xl font-bold text-foreground">{meta.title}</h1>
            {meta.subtitle && (
              <p className="text-muted-foreground mt-1">{meta.subtitle}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Per-page actions portal here via <AdminPageActions> */}
      <div ref={setSlotEl} className="flex items-center gap-2 shrink-0" />
    </div>
  );
}
