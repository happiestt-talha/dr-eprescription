"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  MONTHS_LONG,
  MONTHS_SHORT,
  addDays,
  addMonths,
  clinicDateKey,
  daysInMonth,
  formatDateKeyLong,
  isDateKey,
  splitDateKey,
  toDateKey,
  weekdayOf,
} from "@/lib/datetime"

// Week starts on Monday.
const WEEKDAYS = [
  ["Mo", "Monday"],
  ["Tu", "Tuesday"],
  ["We", "Wednesday"],
  ["Th", "Thursday"],
  ["Fr", "Friday"],
  ["Sa", "Saturday"],
  ["Su", "Sunday"],
]
const YEARS_PER_PAGE = 12

function clampKey(key, min, max) {
  if (min && key < min) return min
  if (max && key > max) return max
  return key
}

/** The 42 day keys (6 weeks) shown for the month containing `key`. */
function monthGrid(key) {
  const { y, m } = splitDateKey(key)
  const first = toDateKey(y, m, 1)
  const lead = (weekdayOf(first) + 6) % 7 // days before the 1st, Monday-based
  const start = addDays(first, -lead)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

/**
 * A custom month calendar working on "YYYY-MM-DD" keys.
 * Keyboard (WAI-ARIA date grid): arrows move by day/week, PageUp/PageDown by
 * month (Shift: year), Home/End to week start/end, Enter/Space selects.
 * Click the caption to jump by month or year.
 */
function Calendar({ value, onSelect, min, max, autoFocus = false, className }) {
  const today = clinicDateKey()
  const initial = clampKey(isDateKey(value) ? value : today, min, max)
  const [focusKey, setFocusKey] = React.useState(initial)
  const [view, setView] = React.useState("days")
  const [yearPage, setYearPage] = React.useState(() => splitDateKey(initial).y - 7)
  const gridRef = React.useRef(null)
  const shouldFocus = React.useRef(autoFocus)

  const { y: focusYear, m: focusMonth } = splitDateKey(focusKey)
  const isDisabled = (key) => (min && key < min) || (max && key > max)

  // Move DOM focus to the active day after keyboard navigation.
  React.useEffect(() => {
    if (!shouldFocus.current || view !== "days") return
    shouldFocus.current = false
    gridRef.current?.querySelector(`[data-key="${focusKey}"]`)?.focus()
  }, [focusKey, view])

  function moveTo(key, { focus = true } = {}) {
    shouldFocus.current = focus
    setFocusKey(clampKey(key, min, max))
  }

  function onGridKeyDown(e) {
    const map = {
      ArrowLeft: () => addDays(focusKey, -1),
      ArrowRight: () => addDays(focusKey, 1),
      ArrowUp: () => addDays(focusKey, -7),
      ArrowDown: () => addDays(focusKey, 7),
      PageUp: () => addMonths(focusKey, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focusKey, e.shiftKey ? 12 : 1),
      Home: () => addDays(focusKey, -((weekdayOf(focusKey) + 6) % 7)),
      End: () => addDays(focusKey, 6 - ((weekdayOf(focusKey) + 6) % 7)),
    }
    if (map[e.key]) {
      e.preventDefault()
      moveTo(map[e.key]())
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (!isDisabled(focusKey)) onSelect?.(focusKey)
    }
  }

  const monthOutOfRange = (y, m) => {
    const first = toDateKey(y, m, 1)
    const last = toDateKey(y, m, daysInMonth(y, m))
    return (min && last < min) || (max && first > max)
  }
  const yearOutOfRange = (y) => (min && `${y}-12-31` < min) || (max && `${y}-01-01` > max)

  const monthOut = (key) => {
    const { y, m } = splitDateKey(key)
    return monthOutOfRange(y, m)
  }
  const firstOfMonth = toDateKey(focusYear, focusMonth, 1)
  const prevDisabled =
    view === "days" ? monthOut(addMonths(firstOfMonth, -1))
    : view === "months" ? yearOutOfRange(focusYear - 1)
    : yearOutOfRange(yearPage - 1)
  const nextDisabled =
    view === "days" ? monthOut(addMonths(firstOfMonth, 1))
    : view === "months" ? yearOutOfRange(focusYear + 1)
    : yearOutOfRange(yearPage + YEARS_PER_PAGE)

  function step(dir) {
    if (view === "days") moveTo(addMonths(focusKey, dir), { focus: false })
    else if (view === "months") moveTo(addMonths(focusKey, dir * 12), { focus: false })
    else setYearPage((p) => p + dir * YEARS_PER_PAGE)
  }

  const caption =
    view === "days" ? `${MONTHS_LONG[focusMonth - 1]} ${focusYear}`
    : view === "months" ? String(focusYear)
    : `${yearPage} – ${yearPage + YEARS_PER_PAGE - 1}`
  const stepLabel = view === "days" ? "month" : view === "months" ? "year" : `${YEARS_PER_PAGE} years`

  const navBtn =
    "inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30"
  const tileBtn =
    "flex h-11 items-center justify-center rounded-xl text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30"

  return (
    <div className={cn("w-[19.5rem] max-w-full select-none p-3", className)}>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-1">
        <button type="button" className={navBtn} onClick={() => step(-1)} disabled={prevDisabled} aria-label={`Previous ${stepLabel}`}>
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (view === "days") setView("months")
            else if (view === "months") {
              setYearPage(focusYear - 7)
              setView("years")
            } else setView("days")
          }}
          aria-live="polite"
          aria-label={view === "years" ? `${caption}, back to days` : `${caption}, choose ${view === "days" ? "month" : "year"}`}
          className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {caption}
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", view !== "days" && "rotate-180")} />
        </button>
        <button type="button" className={navBtn} onClick={() => step(1)} disabled={nextDisabled} aria-label={`Next ${stepLabel}`}>
          <ChevronRight className="size-4" />
        </button>
      </div>

      {view === "days" && (
        <div role="grid" aria-label={caption} ref={gridRef} onKeyDown={onGridKeyDown}>
          <div role="row" className="mb-1 grid grid-cols-7">
            {WEEKDAYS.map(([short, long]) => (
              <div key={short} role="columnheader" aria-label={long} className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {short}
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, row) => (
            <div role="row" key={row} className="grid grid-cols-7 gap-y-0.5">
              {monthGrid(focusKey).slice(row * 7, row * 7 + 7).map((key) => {
                const { m, d } = splitDateKey(key)
                const outside = m !== focusMonth
                const selected = key === value
                const disabled = isDisabled(key)
                const isToday = key === today
                return (
                  <div role="gridcell" key={key} aria-selected={selected} className="flex items-center justify-center">
                    <button
                      type="button"
                      data-key={key}
                      tabIndex={key === focusKey ? 0 : -1}
                      aria-label={`${formatDateKeyLong(key)}${isToday ? ", today" : ""}`}
                      aria-disabled={disabled || undefined}
                      aria-current={isToday ? "date" : undefined}
                      onClick={() => {
                        if (disabled) return
                        setFocusKey(key)
                        onSelect?.(key)
                      }}
                      onFocus={() => key !== focusKey && setFocusKey(key)}
                      className={cn(
                        "relative flex size-10 items-center justify-center rounded-full text-sm tabular-nums transition-all duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
                        outside ? "text-muted-foreground/45" : "text-foreground",
                        !selected && !disabled && "hover:bg-primary/10 hover:text-primary",
                        isToday && !selected && "font-semibold text-primary ring-1 ring-primary/40 ring-inset",
                        selected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                        disabled && "cursor-not-allowed text-muted-foreground/30 line-through decoration-muted-foreground/30"
                      )}>
                      {d}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {view === "months" && (
        <div className="grid grid-cols-3 gap-1.5 py-1" role="group" aria-label={`Months of ${focusYear}`}>
          {MONTHS_SHORT.map((label, i) => {
            const m = i + 1
            const active = m === focusMonth
            return (
              <button
                key={label}
                type="button"
                disabled={monthOutOfRange(focusYear, m)}
                aria-pressed={active}
                aria-label={`${MONTHS_LONG[i]} ${focusYear}`}
                onClick={() => {
                  const { d } = splitDateKey(focusKey)
                  moveTo(toDateKey(focusYear, m, Math.min(d, daysInMonth(focusYear, m))))
                  setView("days")
                }}
                className={cn(tileBtn, active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>
                {label}
              </button>
            )
          })}
        </div>
      )}

      {view === "years" && (
        <div className="grid grid-cols-3 gap-1.5 py-1" role="group" aria-label="Years">
          {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPage + i).map((y) => {
            const active = y === focusYear
            return (
              <button
                key={y}
                type="button"
                disabled={yearOutOfRange(y)}
                aria-pressed={active}
                onClick={() => {
                  const { m, d } = splitDateKey(focusKey)
                  moveTo(toDateKey(y, m, Math.min(d, daysInMonth(y, m))), { focus: false })
                  setView("months")
                }}
                className={cn(tileBtn, "tabular-nums", active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>
                {y}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { Calendar }
