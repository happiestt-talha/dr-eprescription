import { cn } from "@/lib/utils"

// One palette for every status label in the app (prescriptions, appointments,
// accounts, audit actions), built on the status tokens in globals.css.
// Unknown values fall back to neutral.
const TONE_CLASSES = {
  success: "bg-success/12 text-success-strong",
  warning: "bg-warning/18 text-warning-strong",
  info: "bg-info/12 text-info-strong",
  danger: "bg-destructive/10 text-destructive-strong",
  neutral: "bg-muted text-muted-foreground",
}

const DOT_CLASSES = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground/50",
}

// Status value → tone. Also accepts a tone name directly.
const STATUS_TONES = {
  finalized: "success",
  draft: "warning",
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
  active: "success",
  inactive: "neutral",
  create: "success",
  update: "info",
  delete: "danger",
}

// Display labels for stored values (British spelling; the DB keeps "finalized").
const STATUS_LABELS = {
  finalized: "Finalised",
  draft: "Draft",
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  active: "Active",
  inactive: "Inactive",
}

function toneFor(value) {
  if (!value) return "neutral"
  if (TONE_CLASSES[value]) return value
  return STATUS_TONES[value] || "neutral"
}

/** Label for a stored status value, for places that show it without a badge. */
function statusLabel(status) {
  return STATUS_LABELS[status] || status
}

/** `tone` picks the colour (defaults to the status itself); children override the label. */
function StatusBadge({ status, tone, children, className, dot = true }) {
  const t = toneFor(tone || status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[t],
        className
      )}>
      {dot && t !== "neutral" ? <span className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASSES[t])} aria-hidden="true" /> : null}
      {children ?? statusLabel(status)}
    </span>
  )
}

export { StatusBadge, statusLabel }
