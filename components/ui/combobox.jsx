"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { matches } from "@/lib/search"
import { useFormField } from "@/components/ui/form"

/**
 * A searchable replacement for Select, styled identically to
 * components/ui/select.jsx. Filtering runs in the browser over `items`
 * (already loaded by the page) — typing never calls the server.
 *
 * items: [{ value: string, label: string, detail?: string, keywords?: string }]
 * value / onValueChange work with the item's string `value`, like Select.
 * `name` renders a hidden input so it submits inside native forms.
 */
function Combobox({
  items,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  placeholder = "Select…",
  emptyText = "No matches",
  required,
  disabled,
  className,
  label,
  validate,
  "aria-label": ariaLabel,
}) {
  // Inline validation in a <Form>: `required`, plus `validate(value, ctx)`.
  const [current, setCurrent] = React.useState(value ?? defaultValue ?? "")
  const selected = value !== undefined ? value : current
  const { attach: fieldRef, ...field } = useFormField(name, {
    validate: (v, ctx) => {
      const val = v ?? selected
      if (required && !val) return `Choose ${label ? label.toLowerCase() : "an option"}`
      return validate?.(val, ctx) || ""
    },
    getValue: () => selected,
  })
  const byValue = React.useMemo(() => new Map(items.map((item) => [item.value, item])), [items])
  const controlled = value !== undefined
  const toItem = (v) => (v === undefined || v === null || v === "" ? null : (byValue.get(v) ?? null))

  return (
    <ComboboxPrimitive.Root
      items={items}
      {...(controlled ? { value: toItem(value) } : { defaultValue: toItem(defaultValue) })}
      onValueChange={(item) => {
        const v = item?.value ?? ""
        setCurrent(v)
        onValueChange?.(v)
        field.changed(v)
        field.blurred(v)
      }}
      itemToStringLabel={(item) => item?.label ?? ""}
      itemToStringValue={(item) => item?.value ?? ""}
      isItemEqualToValue={(a, b) => a?.value === b?.value}
      filter={(item, query) => matches(query, item.label, item.detail, item.keywords)}
      openOnInputClick
      autoHighlight
      name={name}
      required={required}
      disabled={disabled}
    >
      <div className={cn("relative w-full", className)}>
        <ComboboxPrimitive.Input
          ref={fieldRef}
          id={id}
          aria-invalid={field.error ? true : undefined}
          aria-describedby={field.error ? field.errorId : undefined}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="flex w-full items-center rounded-lg border border-input bg-transparent py-2 pr-8 pl-2.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 h-11 md:h-10"
        />
        <ComboboxPrimitive.Trigger
          aria-label="Show options"
          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground outline-none"
        >
          <ChevronDownIcon className="pointer-events-none size-4" />
        </ComboboxPrimitive.Trigger>
      </div>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="isolate z-50">
          <ComboboxPrimitive.Popup className="relative isolate z-50 max-h-[min(20rem,var(--available-height))] w-[max(var(--anchor-width),18rem)] max-w-[calc(100vw-2rem)] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <ComboboxPrimitive.Empty className="px-1.5 py-1.5 text-sm text-muted-foreground empty:hidden">
              {emptyText}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(item) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{item.label}</span>
                    {item.detail ? (
                      <span className="truncate text-xs text-muted-foreground">{item.detail}</span>
                    ) : null}
                  </span>
                  <ComboboxPrimitive.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

export { Combobox }
