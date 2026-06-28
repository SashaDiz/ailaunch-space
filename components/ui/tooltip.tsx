"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn, resolveAsChild } from "@/lib/utils"

// Wrapper that accepts the legacy Radix `delayDuration` prop and maps it onto
// Base UI's `delay`, so existing call sites keep working.
const TooltipProvider = ({
  delayDuration,
  delay,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider> & {
  delayDuration?: number
}) => <TooltipPrimitive.Provider delay={delay ?? delayDuration} {...props} />
TooltipProvider.displayName = "TooltipProvider"

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => (
  <TooltipPrimitive.Trigger ref={ref} {...props} {...resolveAsChild(asChild, children)} />
))
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup> & {
    side?: "top" | "right" | "bottom" | "left"
    sideOffset?: number
    /** Render a little triangle pointing at the trigger. */
    showArrow?: boolean
  }
>(({ className, side = "top", sideOffset = 4, showArrow = false, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset} className="z-50">
      <TooltipPrimitive.Popup
        ref={ref}
        className={cn(
          // No `overflow-hidden` here — it would clip the arrow.
          "relative rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md origin-[var(--transform-origin)]",
          "transition duration-150 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
          className
        )}
        {...props}
      >
        {children}
        {showArrow && (
          <TooltipPrimitive.Arrow
            className={cn(
              "data-[side=bottom]:top-[-7px]",
              "data-[side=top]:bottom-[-7px] data-[side=top]:rotate-180",
              "data-[side=left]:right-[-10px] data-[side=left]:rotate-90",
              "data-[side=right]:left-[-10px] data-[side=right]:-rotate-90"
            )}
          >
            <svg width="14" height="7" viewBox="0 0 14 7" fill="none" aria-hidden="true">
              <path d="M7 0 L14 7 H0 Z" className="fill-primary" />
            </svg>
          </TooltipPrimitive.Arrow>
        )}
      </TooltipPrimitive.Popup>
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
