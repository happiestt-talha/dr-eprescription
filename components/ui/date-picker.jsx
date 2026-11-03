"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CalendarDays, Clock, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useFormField } from "@/components/ui/form"
import * as rules from "@/lib/rules"
import {
  clinicDateKey,
  clinicTimeSlots,
  formatDateKey,
  formatTimeOfDay,
  isDateKey,
  CLINIC_OPEN,
  CLINIC_CLOSE,
} from "@/lib/datetime"

// Matches the Input/SelectTrigger look, sized for touch.
const triggerClass =
  "group flex h-11 w-full min-w-0 items-center gap-2.5 rounded-lg border border-input bg-transparent px-3 text-left text-sm transition-colors outline-none hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/30 md:h-10 dark:bg-input/30"

/** Carries the value in native FormData. Validation is done by the form controller. */
function ValueInput({ name, value }) {
  return <input type="hidden" name={name} value={value} />
}

/**
 * Date field with the custom calendar. Submits `name` as "YYYY-MM-DD"
 * (server: `calendarDate()` in lib/validate.js).
 */
function DatePicker({
  id,
  name,
  defaultValue = "",
  value: controlled,
  onValueChange,
  min,
  max,
  required,
  label,
  disabled,
  placeholder = "Select a date",
  className,
  "aria-describedby": describedBy,
}) {
  const [inner, setInner] = React.useState(isDateKey(defaultValue) ? defaultValue : "")
  const value = controlled !== undefined ? controlled : inner
  const [open, setOpen] = React.useState(false)
  const { attach: fieldRef, ...field } = useFormField(name, {
    validate: (v) => rules.calendarDate(v ?? value, { label: label || "Date", required, min, max }).error,
    getValue: () => value,
  })

  function commit(next) {
    setInner(next)
    onValueChange?.(next)
    field.changed(next)
    field.blurred(next)
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) field.blurred(value)
          }}>
          <PopoverTrigger
            ref={fieldRef}
            id={id}
            disabled={disabled}
            aria-invalid={field.error ? true : undefined}
            aria-describedby={[describedBy, field.error && field.errorId].filter(Boolean).join(" ") || undefined}
            aria-haspopup="dialog"
            className={cn(triggerClass, className)}>
            <CalendarDays className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-data-popup-open:text-primary" />
            <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
              {value ? formatDateKey(value) : placeholder}
            </span>
          </PopoverTrigger>
          <PopoverContent initialFocus={false} aria-label="Choose date">
            <Calendar
              value={value}
              min={min}
              max={max}
              autoFocus
              onSelect={(key) => {
                commit(key)
                setOpen(false)
              }}
            />
            <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
              <button
                type="button"
                disabled={(min && clinicDateKey() < min) || (max && clinicDateKey() > max)}
                onClick={() => {
                  commit(clinicDateKey())
                  setOpen(false)
                }}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30">
                Today
              </button>
              {!required && value && (
                <button
                  type="button"
                  onClick={() => {
                    commit("")
                    setOpen(false)
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <X className="size-3" /> Clear
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {name && <ValueInput name={name} value={value} />}
      </div>
    </div>
  )
}

/**
 * Appointment date + time: calendar on one side, clinic-hour slots on the
 * other. Submits "YYYY-MM-DDTHH:mm" in clinic time (server: `clinicDateTime()`).
 * Past days and already-passed slots are disabled.
 */
function DateTimePicker({ id, name, defaultValue = "", required, label, disabled, className, placeholder = "Choose date & time" }) {
  const initial = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(defaultValue) ? defaultValue : ""
  const [value, setValue] = React.useState(initial)
  const [day, setDay] = React.useState(initial ? initial.slice(0, 10) : "")
  const [open, setOpen] = React.useState(false)
  const { attach: fieldRef, ...field } = useFormField(name, {
    validate: (v) =>
      rules.clinicDateTime(v ?? value, { label: label || "Date & time", required, notInPast: true }).error,
    getValue: () => value,
  })
  const today = clinicDateKey()

  const time = value ? value.slice(11) : ""
  const slots = React.useMemo(() => {
    if (!day) return []
    const list = clinicTimeSlots(day)
    // Keep an existing off-grid time (e.g. booked before slots existed) selectable.
    if (time && value.startsWith(day) && !list.some((s) => s.value === time)) {
      list.push({ value: time, label: formatTimeOfDay(time), past: false })
      list.sort((a, b) => a.value.localeCompare(b.value))
    }
    return list
  }, [day, time, value])
  const available = slots.filter((s) => !s.past)

  const slotsRef = React.useRef(null)
  React.useEffect(() => {
    if (!open || !day) return
    // Bring the selected (or first free) slot into view.
    const el = slotsRef.current?.querySelector('[aria-pressed="true"]') || slotsRef.current?.querySelector("button:not(:disabled)")
    el?.scrollIntoView({ block: "nearest" })
  }, [open, day])

  function pickSlot(slot) {
    const next = `${day}T${slot}`
    setValue(next)
    setOpen(false)
    field.changed(next)
    field.blurred(next)
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) field.blurred(value)
          }}>
          <PopoverTrigger
            ref={fieldRef}
            id={id}
            disabled={disabled}
            aria-invalid={field.error ? true : undefined}
            aria-describedby={field.error ? field.errorId : undefined}
            aria-haspopup="dialog"
            className={cn(triggerClass, className)}>
            <CalendarDays className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-data-popup-open:text-primary" />
            {value ? (
              <span className="flex flex-1 items-center gap-2 truncate">
                <span>{formatDateKey(value.slice(0, 10))}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <Clock className="size-3" />
                  {formatTimeOfDay(time)}
                </span>
              </span>
            ) : (
              <span className="flex-1 truncate text-muted-foreground">{placeholder}</span>
            )}
          </PopoverTrigger>
          <PopoverContent initialFocus={false} aria-label="Choose appointment date and time" className="sm:max-w-none">
            <div className="flex flex-col sm:flex-row">
              <Calendar
                value={day}
                min={today}
                autoFocus
                onSelect={(key) => {
                  setDay(key)
                  // Focus the first free slot so keyboard users can carry on.
                  requestAnimationFrame(() => slotsRef.current?.querySelector('[aria-pressed="true"], button:not(:disabled)')?.focus())
                }}
              />
              <div className="flex w-full flex-col border-t border-border/60 sm:w-44 sm:border-t-0 sm:border-l">
                <div className="flex items-center gap-1.5 px-3 pt-3 pb-2 text-xs font-semibold text-muted-foreground">
                  <Clock className="size-3.5" />
                  {day ? `${formatDateKey(day)}` : "Pick a day first"}
                </div>
                <div
                  ref={slotsRef}
                  role="group"
                  aria-label="Available times"
                  className="grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto px-3 pb-3 sm:max-h-[19rem] sm:grid-cols-1">
                  {!day && <p className="col-span-full py-6 text-center text-xs text-muted-foreground">Choose a date to see times</p>}
                  {day && available.length === 0 && (
                    <p className="col-span-full py-6 text-center text-xs text-muted-foreground">
                      No times left on this day. Clinic hours are {formatTimeOfDay(CLINIC_OPEN)} – {formatTimeOfDay(CLINIC_CLOSE)}.
                    </p>
                  )}
                  {day &&
                    available.length > 0 &&
                    slots.map((s) => {
                      const selected = value === `${day}T${s.value}`
                      return (
                        <button
                          key={s.value}
                          type="button"
                          disabled={s.past}
                          aria-pressed={selected}
                          onClick={() => pickSlot(s.value)}
                          className={cn(
                            "h-9 shrink-0 rounded-lg border text-xs font-semibold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/70 text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                            s.past && "hidden"
                          )}>
                          {s.label}
                        </button>
                      )
                    })}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {name && <ValueInput name={name} value={value} />}
      </div>
    </div>
  )
}

export { DatePicker, DateTimePicker }
