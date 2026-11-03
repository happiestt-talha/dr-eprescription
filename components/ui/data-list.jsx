"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
import { SearchInput } from "@/components/ui/search-input"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DEFAULT_PAGE_SIZE, filterRows, paginate, parsePageSize } from "@/lib/list-state"

const SERVER_DEBOUNCE_MS = 300

/**
 * The app's one list/table: search, filters and pagination over rows the page
 * already loaded, all in the browser (instant, no requests). Rows come from a
 * loader in lib/lists.js: plain display strings plus `searchText`.
 *
 * columns: [{ key, header, cell?(row), className?, mobile?: "title" | "subtitle" | "badge" | "hidden" }]
 *   (no `cell` = show row[key]; `mobile` places the column in the phone card)
 * filters: [{ key, label, options: [{ value, label }], value?(row) }] ("" = all)
 * actions(row): buttons/links for the row (table's last column, card footer)
 * toolbar: extra controls next to the search box (tabs, buttons)
 *
 * State (q, page, size and filters) is kept in the URL with replaceState, so
 * refresh, back and shared links restore the view without a server request.
 *
 * Fallback for very large tables: `server={{ total, page, pageSize, query }}`
 * when the loader couldn't send every row. Then search and paging go through
 * the URL (?q=&page=) and the server, and `rows` is just the current page.
 */
export function DataList({
  rows,
  columns,
  actions,
  filters = [],
  toolbar,
  empty,
  searchPlaceholder = "Search",
  noun = "rows",
  defaultPageSize = DEFAULT_PAGE_SIZE,
  initial = {},
  server,
  className,
  rowClassName,
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Server mode: URLs keep the page's other params (e.g. ?view=past).
  const serverHref = (changes) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(changes)) (v && !(k === "page" && Number(v) <= 1) ? params.set(k, String(v)) : params.delete(k))
    return `${pathname}${params.toString() ? `?${params}` : ""}`
  }
  const topRef = React.useRef(null)
  const [query, setQuery] = React.useState(initial.q ?? "")
  const [page, setPage] = React.useState(Number(initial.page) || 1)
  const [pageSize, setPageSize] = React.useState(parsePageSize(initial.size ?? defaultPageSize))
  const [active, setActive] = React.useState(() => Object.fromEntries(filters.map((f) => [f.key, initial[f.key] ?? ""])))
  const [isPending, startTransition] = React.useTransition()

  // ---- in-browser mode ----
  const filtered = React.useMemo(
    () => (server ? rows : filterRows(rows, { query, filters: active, filterDefs: filters })),
    [rows, query, active, filters, server]
  )
  const view = server
    ? {
        rows,
        page: server.page,
        lastPage: Math.max(1, Math.ceil(server.total / server.pageSize)),
        total: server.total,
        from: server.total ? (server.page - 1) * server.pageSize + 1 : 0,
        to: Math.min(server.page * server.pageSize, server.total),
      }
    : paginate(filtered, page, pageSize)

  // Keep the URL in step (no navigation, no request).
  React.useEffect(() => {
    if (server) return
    const params = new URLSearchParams(window.location.search)
    const set = (k, v, fallback = "") => (v && String(v) !== String(fallback) ? params.set(k, v) : params.delete(k))
    set("q", query.trim())
    set("page", view.page, 1)
    set("size", pageSize, defaultPageSize)
    for (const f of filters) set(f.key, active[f.key])
    const next = `${pathname}${params.toString() ? `?${params}` : ""}`
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", next)
  }, [server, query, view.page, pageSize, active, filters, pathname, defaultPageSize])

  // ---- server fallback: debounced ?q= ----
  React.useEffect(() => {
    if (!server) return
    const q = query.trim()
    if (q === (server.query ?? "")) return
    const timer = setTimeout(() => {
      startTransition(() => router.replace(serverHref({ q, page: 1 }), { scroll: false }))
    }, SERVER_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, query])

  function goTo(p) {
    setPage(p)
    // Bring the top of the list into view when paging from the bottom.
    const top = topRef.current
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: "start", behavior: "smooth" })
  }

  const searching = Boolean(query.trim()) || Object.values(active).some(Boolean)
  const totalRows = server ? server.total : rows.length

  // Nothing at all (not a search miss): the list's own empty state.
  if (!totalRows && !searching) {
    return (
      <div className={className}>
        {toolbar ? <div className="mb-4 flex flex-wrap items-center justify-end gap-2">{toolbar}</div> : null}
        <EmptyState {...empty} />
      </div>
    )
  }

  return (
    <div ref={topRef} className={cn("min-w-0 scroll-mt-20", className)}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-2xl">
          <div className="flex w-full items-center gap-2 sm:max-w-sm">
            <SearchInput
              value={query}
              onValueChange={(v) => {
                setQuery(v)
                setPage(1)
              }}
              placeholder={searchPlaceholder}
            />
            {isPending ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-label="Searching" /> : null}
          </div>
          {!server &&
            filters.map((f) => {
              const items = { "": `All ${f.label.toLowerCase()}`, ...Object.fromEntries(f.options.map((o) => [o.value, o.label])) }
              return (
                <Select
                  key={f.key}
                  value={active[f.key]}
                  onValueChange={(v) => {
                    setActive((prev) => ({ ...prev, [f.key]: v ?? "" }))
                    setPage(1)
                  }}
                  items={items}>
                  <SelectTrigger aria-label={f.label} className={cn("h-11 w-full sm:w-44 md:h-9", active[f.key] && "border-primary/60 bg-primary/5")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{items[""]}</SelectItem>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            })}
        </div>
        {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
      </div>

      {view.total === 0 ? (
        <EmptyState
          icon={SearchX}
          title={query.trim() ? `No ${noun} match “${query.trim()}”` : `No ${noun} match these filters`}
          action={
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setActive(Object.fromEntries(filters.map((f) => [f.key, ""])))
                setPage(1)
              }}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline">
              Clear search and filters
            </button>
          }
        />
      ) : (
        <div className={cn("transition-opacity", isPending && "opacity-60")}>
          <DataListRows rows={view.rows} columns={columns} actions={actions} rowClassName={rowClassName} />

          <Pagination
            page={view.page}
            lastPage={view.lastPage}
            from={view.from}
            to={view.to}
            total={view.total}
            unfilteredTotal={server ? undefined : rows.length}
            pageSize={server ? server.pageSize : pageSize}
            noun={noun}
            onPageChange={goTo}
            onPageSizeChange={
              server
                ? undefined
                : (n) => {
                    setPageSize(n)
                    setPage(1)
                  }
            }
            hrefFor={server ? (p) => serverHref({ q: server.query, page: p }) : undefined}
          />
        </div>
      )}
    </div>
  )
}

/**
 * The rows of a list: cards on phones, a table from md up. Used by DataList,
 * and directly by lists that page on the server (the audit log), so every
 * list in the app looks the same. Same `columns`/`actions` shape as DataList.
 */
export function DataListRows({ rows, columns, actions, rowClassName }) {
  const titleCol = columns.find((c) => c.mobile === "title") ?? columns[0]
  const subtitleCols = columns.filter((c) => c.mobile === "subtitle")
  const badgeCols = columns.filter((c) => c.mobile === "badge")
  const detailCols = columns.filter((c) => c !== titleCol && !c.mobile)
  const cell = (col, row) => (col.cell ? col.cell(row) : row[col.key])

  return (
    <>
      {/* Phones: cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className={cn("space-y-3 rounded-lg border bg-card p-4", rowClassName?.(row))}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{cell(titleCol, row)}</div>
                {subtitleCols.map((c) => (
                  <div key={c.key} className="mt-0.5 truncate text-xs text-muted-foreground">
                    {cell(c, row)}
                  </div>
                ))}
              </div>
              {badgeCols.length ? <div className="flex shrink-0 flex-col items-end gap-1">{badgeCols.map((c) => <React.Fragment key={c.key}>{cell(c, row)}</React.Fragment>)}</div> : null}
            </div>
            {detailCols.length ? (
              <dl className="space-y-1.5 text-xs">
                {detailCols.map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-muted-foreground">{c.header}</dt>
                    <dd className="min-w-0 text-right font-medium text-foreground">{cell(c, row) || "—"}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {actions ? <div className="flex flex-wrap gap-2 border-t pt-3 [&>*]:flex-1">{actions(row)}</div> : null}
          </li>
        ))}
      </ul>

      {/* Tablets and up: table */}
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.header}
                </TableHead>
              ))}
              {actions ? <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={cn("transition-colors hover:bg-muted/30", rowClassName?.(row))}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {cell(c, row)}
                  </TableCell>
                ))}
                {actions ? (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">{actions(row)}</div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
