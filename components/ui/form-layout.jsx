import * as React from "react"
import { cn } from "@/lib/utils"
import { FormError } from "@/components/ui/form-error"
import { FieldErrorText } from "@/components/ui/form"
import { ChoiceGroup } from "@/components/ui/form-inputs"
import { PageHeader } from "@/components/ui/page-header"

/**
 * Shared building blocks for every form in the app, so they all look and
 * behave the same: a full-width page, flat categorised sections, consistent
 * fields and a single action bar. Not a client module, so server pages can use them too.
 */

/** Full-width page wrapper with title, subtitle and optional slot above (breadcrumbs). */
function FormPage({ title, description, top, children, className }) {
  return (
    <div className={cn("w-full min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-6 lg:px-8 lg:py-8", className)}>
      {top}
      {(title || description) && <PageHeader title={title} description={description} />}
      {children}
    </div>
  )
}

// Grids add columns as the screen widens, so full-width forms never get
// over-stretched inputs. Widths are for the fields column (right of the labels).
const COLUMNS = {
  1: "",
  2: "sm:grid-cols-2 2xl:grid-cols-3",
  3: "sm:grid-cols-2 xl:grid-cols-3",
  6: "grid-cols-2 md:grid-cols-3 2xl:grid-cols-6",
  pair: "md:grid-cols-2",
}

/**
 * A category of fields: a plain <fieldset> on the page background (no card).
 * On large screens the title and description sit in a fixed left column and
 * the fields fill the rest; sections are separated by a thin divider.
 */
function FormSection({ title, description, children, className, columns = 2, aside }) {
  return (
    <fieldset
      className={cn(
        "grid min-w-0 gap-x-10 gap-y-5 border-t border-border py-7 first:border-t-0 first:pt-1 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-9 xl:grid-cols-[17rem_minmax(0,1fr)]",
        className
      )}>
      <legend className="sr-only">{title}</legend>
      <div className="flex items-start justify-between gap-3 lg:sticky lg:top-20 lg:flex-col lg:self-start">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-snug text-foreground">{title}</h2>
          {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {aside && <div className="shrink-0 lg:pl-7">{aside}</div>}
      </div>
      <div className={cn("grid min-w-0 grid-cols-1 items-start gap-x-5 gap-y-5", COLUMNS[columns])}>{children}</div>
    </fieldset>
  )
}

/**
 * Label + control + error + hint. `span="full"` spans every grid column. The
 * label row has a fixed height so controls in the same grid row line up even
 * when one label carries extra content (`labelAside`, e.g. the age).
 *
 * Inside a <Form>, the error for `name` (default: `htmlFor`) shows under the
 * control: from the browser rules as you type, or from the server.
 */
function Field({ label, htmlFor, name, required, hint, hintId, span, children, className, labelAside }) {
  return (
    <div className={cn("min-w-0 space-y-2", span === "full" && "col-span-full", className)}>
      {label && (
        <div className="flex h-5 items-center justify-between gap-2">
          <label htmlFor={htmlFor} className="truncate text-sm font-medium leading-none text-foreground">
            {label}
            {required && (
              <>
                <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
                <span className="sr-only"> (required)</span>
              </>
            )}
          </label>
          {labelAside}
        </div>
      )}
      {children}
      <FieldErrorText name={name ?? htmlFor} />
      {hint && (
        <p id={hintId || (htmlFor ? `${htmlFor}-hint` : undefined)} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Wraps a numeric input with a trailing unit ("cm", "kg", "bpm"). */
function WithUnit({ unit, children }) {
  return (
    <div className="relative">
      {children}
      {/* Pinned to the input's height, so an error message below doesn't move it. */}
      <span className="pointer-events-none absolute top-0 right-3 flex h-11 items-center text-xs font-medium text-muted-foreground md:h-10" aria-hidden="true">
        {unit}
      </span>
    </div>
  )
}

/**
 * Submit row under the last section, aligned with the fields column.
 * Sticky at the bottom on phones.
 */
function FormActions({ children, className, sticky = true }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end lg:ml-[calc(15rem+2.5rem)] xl:ml-[calc(17rem+2.5rem)]",
        sticky &&
          "sticky bottom-0 z-10 -mx-4 bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-6 sm:pb-0 sm:backdrop-blur-none",
        className
      )}>
      {children}
    </div>
  )
}

export { FormPage, FormSection, Field, ChoiceGroup, WithUnit, FormError, FormActions }
