"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "cn"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverClose = PopoverPrimitive.Close

function PopoverContent({
  className,
  children,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  initialFocus,
  finalFocus,
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        collisionPadding={12}
        className="isolate z-50">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          className={cn(
            "z-50 max-h-(--available-height) max-w-[calc(100vw-24px)] origin-(--transform-origin) overflow-y-auto rounded-2xl bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10 outline-none duration-150 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}>
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverClose }
