import { cn } from "@/lib/utils"

/**
 * The one page title block: h1, optional one-line description, optional
 * actions on the right (stacked full-width under the title on phones).
 * Every portal page uses this, so titles look the same everywhere.
 */
function PageHeader({ title, description, actions, className }) {
  return (
    <header className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-col gap-2 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">{actions}</div> : null}
    </header>
  )
}

/** Standard page padding and vertical rhythm for list and detail pages. */
function PageShell({ children, className }) {
  return <div className={cn("w-full min-w-0 space-y-6 p-4 sm:p-6 lg:px-8", className)}>{children}</div>
}

export { PageHeader, PageShell }
