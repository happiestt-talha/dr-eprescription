"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PAGE_SIZES, pageWindow } from "@/lib/list-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const btn =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-40"

/** One page button: a Link for server-paged lists, a button otherwise. */
function Control({ target, disabled, label, children, current, hrefFor, onPageChange }) {
  const common = {
    "aria-label": label,
    "aria-disabled": disabled || undefined,
    "aria-current": current ? "page" : undefined,
    className: cn(btn, current && "border-primary bg-primary text-primary-foreground hover:bg-primary"),
  }
  if (hrefFor) {
    return disabled ? (
      <span {...common}>{children}</span>
    ) : (
      <Link href={hrefFor(target)} scroll={false} {...common}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" disabled={disabled} onClick={() => onPageChange(target)} {...common}>
      {children}
    </button>
  )
}

/**
 * Shared pagination: "Showing 26–50 of 312", page numbers with gaps,
 * Previous/Next, and a rows-per-page select.
 *
 * In-browser lists pass `onPageChange`/`onPageSizeChange` (no navigation).
 * Server-paged lists pass `hrefFor(page)` and get real links instead.
 */
function Pagination({ page, lastPage, from, to, total, unfilteredTotal, pageSize, onPageChange, onPageSizeChange, hrefFor, noun = "rows", className }) {
  if (!total) return null
  const pages = pageWindow(page, lastPage)
  return (
    <nav aria-label="Pagination" className={cn("flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground tabular-nums">{from.toLocaleString("en-GB")}–{to.toLocaleString("en-GB")}</span> of{" "}
        <span className="tabular-nums">{total.toLocaleString("en-GB")}</span> {noun}
        {unfilteredTotal && unfilteredTotal !== total ? <> (filtered from {unfilteredTotal.toLocaleString("en-GB")})</> : null}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {onPageSizeChange ? (
          <div className="mr-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Rows</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))} items={Object.fromEntries(PAGE_SIZES.map((n) => [String(n), String(n)]))}>
              <SelectTrigger aria-label="Rows per page" className="h-9 w-[4.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {lastPage > 1 ? (
          <>
            <Control hrefFor={hrefFor} onPageChange={onPageChange} target={page - 1} disabled={page <= 1} label="Previous page">
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Previous</span>
            </Control>
            {pages.map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground" aria-hidden="true">
                  …
                </span>
              ) : (
                <Control key={p} hrefFor={hrefFor} onPageChange={onPageChange} target={p} label={`Page ${p}`} current={p === page}>
                  <span className="tabular-nums">{p}</span>
                </Control>
              )
            )}
            <Control hrefFor={hrefFor} onPageChange={onPageChange} target={page + 1} disabled={page >= lastPage} label="Next page">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Control>
          </>
        ) : null}
      </div>
    </nav>
  )
}

export { Pagination }
