import { cn } from "@/lib/utils"

/** The app's one empty-state block: icon, title, short text, optional action. */
function EmptyState({ icon: Icon, title, text, action, className }) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border px-4 py-12 text-center", className)}>
      {Icon ? <Icon className="mx-auto mb-3 size-6 text-muted-foreground/60" strokeWidth={1.5} aria-hidden="true" /> : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {text ? <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
