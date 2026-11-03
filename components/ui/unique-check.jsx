"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

/**
 * Asks the server whether a unique value (phone, CNIC, email, PMDC no.) is
 * already taken, as soon as it's complete. Feed it the field's value through
 * `check(value)` (e.g. from MaskedInput's `onValueChange`).
 *
 * `isComplete(value)` decides when to ask (no request for half-typed values);
 * stale responses are ignored. Returns { status, result, check } where status
 * is "idle" | "checking" | "clear" | "found".
 */
function useUniqueCheck(checkFn, { field, excludeId, isComplete, delay = 350, initialValue = "" }) {
  const [state, setState] = React.useState({ status: "idle", result: null })
  const timer = React.useRef(null)
  const seq = React.useRef(0)
  // On edit forms the starting value is the record's own: don't flag it.
  const initial = React.useRef(initialValue)

  React.useEffect(() => () => clearTimeout(timer.current), [])

  const check = React.useCallback(
    (value) => {
      clearTimeout(timer.current)
      const request = ++seq.current
      if (!value || !isComplete(value) || value === initial.current) {
        setState({ status: "idle", result: null })
        return
      }
      setState((s) => ({ status: "checking", result: s.result }))
      timer.current = setTimeout(async () => {
        try {
          const res = await checkFn({ field, value, excludeId })
          if (request !== seq.current) return
          if (res?.exists) setState({ status: "found", result: res })
          else setState({ status: res?.error ? "idle" : "clear", result: null })
        } catch {
          // Offline or similar: say nothing; the server still checks on submit.
          if (request === seq.current) setState({ status: "idle", result: null })
        }
      }, delay)
    },
    [checkFn, field, excludeId, isComplete, delay]
  )

  return { ...state, check }
}

/** Small status shown next to the field label. */
function UniqueStatus({ status, clearText = "Available" }) {
  if (status === "checking") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Checking…
      </span>
    )
  }
  if (status === "clear") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary" aria-live="polite">
        <CheckCircle2 className="size-3.5" aria-hidden="true" /> {clearText}
      </span>
    )
  }
  return null
}

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

/**
 * Inline panel under a field when its value already belongs to someone.
 * `title` is the headline, `name`/`meta` describe the match, `actions` are
 * the next steps (buttons or links).
 */
function DuplicateNotice({ title, name, meta, note, actions, className }) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-warning/40 border-l-4 border-l-warning bg-warning/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}>
      <div className="flex min-w-0 items-center gap-3">
        {name ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/18 text-xs font-semibold text-warning-strong" aria-hidden="true">
            {initials(name)}
          </span>
        ) : (
          <AlertTriangle className="size-5 shrink-0 text-warning-strong" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-warning-strong">{title}</p>
          {name && <p className="truncate text-sm font-semibold text-foreground">{name}</p>}
          {meta && <p className="truncate text-xs text-muted-foreground capitalize">{meta}</p>}
          {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export { useUniqueCheck, UniqueStatus, DuplicateNotice }
