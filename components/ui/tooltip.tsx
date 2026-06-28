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
  }
>(({ className, side = "top", sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset} className="z-50">
      <TooltipPrimitive.Popup
        ref={ref}
        className={cn(
          "overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md origin-[var(--transform-origin)]",
          "transition duration-150 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
