"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

import { cn, resolveAsChild } from "@/lib/utils"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & {
    asChild?: boolean
  }
>(({ asChild, children, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    {...props}
    {...resolveAsChild(asChild, children)}
  />
))
CollapsibleTrigger.displayName = "CollapsibleTrigger"

/**
 * Base UI's Collapsible.Panel exposes `--collapsible-panel-height` for animating
 * height open/close. The transition classes give a smooth expand/collapse.
 */
const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Panel>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Panel>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Panel
    ref={ref}
    className={cn(
      "overflow-hidden transition-[height] duration-300 ease-out-expo data-[starting-style]:h-0 data-[ending-style]:h-0 h-[var(--collapsible-panel-height)]",
      className
    )}
    {...props}
  />
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
