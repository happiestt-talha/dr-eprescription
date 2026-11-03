"use client"

import * as React from "react"
import { Autocomplete } from "@base-ui/react/autocomplete"
import { cn } from "@/lib/utils"
import { appendChip } from "@/lib/clinical-vocab"
import { useFormField } from "@/components/ui/form"
import { text } from "@/lib/rules"
import { Plus } from "lucide-react"

/**
 * Free-text input with typing suggestions ("tw" -> "Twice daily"). Arrow keys
 * move through the list, Enter/Tab or a click accepts, and anything else can
 * still be typed. `suggest(query)` returns the strings to show for the
 * current text (see lib/clinical-vocab.js).
 *
 * Controlled: `value` + `onValueChange(text)`.
 */
function SuggestInput({ id, name, value, onValueChange, suggest, validate, placeholder, maxLength = 60, className, "aria-label": ariaLabel }) {
  // `name` registers the field with the surrounding <Form> for inline errors
  // (it isn't submitted: rows are sent as JSON). `validate(value, ctx)` returns
  // a message, e.g. "Dosage is required" when finalising.
  const { attach: fieldRef, ...field } = useFormField(name, {
    validate: (v, ctx) => text(v ?? value, { max: maxLength }).error || validate?.(v ?? value, ctx) || "",
    getValue: () => value,
  })
  const items = React.useMemo(() => {
    const list = suggest(value)
    // Don't offer exactly what's already typed.
    return list.filter((s) => s.toLowerCase() !== String(value ?? "").trim().toLowerCase())
  }, [suggest, value])

  return (
    <Autocomplete.Root
      items={items}
      mode="none"
      value={value}
      onValueChange={(next) => {
        const v = String(next ?? "").slice(0, maxLength)
        onValueChange(v)
        field.changed(v)
      }}
      openOnInputClick
      autoHighlight
    >
      <Autocomplete.Input
        ref={fieldRef}
        id={id}
        onBlur={() => field.blurred(value)}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={field.error ? field.errorId : undefined}
        placeholder={placeholder}
        aria-label={ariaLabel}
        maxLength={maxLength}
        autoComplete="off"
        className={cn(
          "h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:h-10 md:text-sm dark:bg-input/30",
          className
        )}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={4} align="start" className="isolate z-50">
          <Autocomplete.Popup className="max-h-[min(16rem,var(--available-height))] w-[max(var(--anchor-width),12rem)] max-w-[calc(100vw-2rem)] origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 empty:hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0">
            <Autocomplete.List>
              {(item) => (
                <Autocomplete.Item
                  key={item}
                  value={item}
                  className="flex cursor-default items-center rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground">
                  {item}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}

/**
 * Tap-to-add chips under a textarea: each click appends the phrase to the
 * comma-separated value (no duplicates; "None" clears the rest). The target
 * field is uncontrolled, so chips write to it through its id and dispatch an
 * input event, keeping native forms working.
 */
function QuickChips({ targetId, chips, label = "Quick add" }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`${label} for this field`}>
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => {
            const el = document.getElementById(targetId)
            if (!el) return
            const next = appendChip(el.value, chip)
            const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set
            setter ? setter.call(el, next) : (el.value = next)
            el.dispatchEvent(new Event("input", { bubbles: true }))
          }}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Plus className="size-3" aria-hidden="true" />
          {chip}
        </button>
      ))}
    </div>
  )
}

export { SuggestInput, QuickChips }
