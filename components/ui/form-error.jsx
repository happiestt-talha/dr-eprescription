"use client"

import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Error banner. `role="alert"` announces it to screen readers without moving
 * focus (the form moves focus to the first invalid field instead).
 * `variant="page"` lines it up with the fields column of a FormSection page;
 * `variant="dialog"` is plain, for dialogs and compact forms.
 */
function FormError({ children, action, variant = "page", className }) {
  if (!children) return null
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 p-4 text-sm text-destructive",
        variant === "page" && "mb-6 lg:ml-[calc(15rem+2.5rem)] xl:ml-[calc(17rem+2.5rem)]",
        className
      )}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">{children}</p>
        {action}
      </div>
    </div>
  )
}

export { FormError }
