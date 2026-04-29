"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      // On state: primary-tinted track + bright thumb. Off state: faint
      // foreground-tinted track + full-foreground thumb. Works in both light
      // and dark themes because both colors are derived from --foreground.
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
      "data-[state=unchecked]:bg-foreground/20 data-[state=unchecked]:border-foreground/30",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform",
        "data-[state=checked]:translate-x-4 data-[state=checked]:bg-primary-foreground",
        "data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-foreground"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
