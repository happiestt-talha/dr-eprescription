import Link from "next/link"

/**
 * A titled list block: bordered, with a small header row and an optional
 * "View all" link. Used on the dashboards for lists that need action.
 */
function Panel({ title, href, linkLabel = "View all", children }) {
  return (
    <section className="min-w-0 rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {href ? (
          <Link href={href} className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** Muted one-line message for an empty Panel. */
function PanelEmpty({ children }) {
  return <p className="px-4 py-6 text-sm text-muted-foreground">{children}</p>
}

export { Panel, PanelEmpty }
