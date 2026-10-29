"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * The app's standard search field: the regular Input with a search icon and a
 * clear button. Escape clears it. Filtering happens wherever `onValueChange`
 * is handled (normally on data the page already has).
 */
function SearchInput({ value, onValueChange, label, placeholder, className, inputClassName, ...props }) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault()
            onValueChange("")
          }
        }}
        aria-label={label || placeholder}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        maxLength={100}
        className={cn(
          "min-h-[44px] md:min-h-[36px] pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none",
          inputClassName
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange("")}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

/** Quiet "12 of 20" counter, shown only while a filter is active. */
function SearchCount({ shown, total, query, className }) {
  if (!query) return null
  return (
    <p className={cn("text-xs text-muted-foreground whitespace-nowrap", className)} aria-live="polite">
      {shown} of {total}
    </p>
  )
}

/** Empty state for a filter with no results, matching the pages' dashed empty blocks. */
function NoMatches({ query, onClear, className }) {
  return (
    <div className={cn("text-center py-10 px-4 border border-dashed rounded-xl bg-card", className)}>
      <p className="text-sm font-medium text-foreground">No matches for &ldquo;{query}&rdquo;</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-xs font-medium text-primary hover:underline underline-offset-2"
      >
        Clear search
      </button>
    </div>
  )
}

export { SearchInput, SearchCount, NoMatches }
