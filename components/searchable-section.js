"use client";

import { useId, useMemo, useState } from "react";
import { SearchInput, SearchCount, NoMatches } from "@/components/ui/search-input";
import { matches } from "@/lib/search";

/**
 * Instant search for a server-rendered list, without moving its markup into a
 * client component or refetching anything.
 *
 * The page passes `index` (one `{ key, text }` per row, built from data it has
 * already loaded) and tags every rendered row (mobile card and table row alike)
 * with `data-search-key={key}`. Non-matching rows are hidden with a scoped CSS
 * rule; when nothing matches, elements marked `data-search-list` are hidden and
 * an empty state is shown instead.
 */
export function SearchableSection({ index, placeholder, label, toolbar, children, className }) {
  const [query, setQuery] = useState("");
  const scope = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const hiddenKeys = useMemo(
    () => (query ? index.filter((row) => !matches(query, row.text)).map((row) => row.key) : []),
    [index, query]
  );
  const shown = index.length - hiddenKeys.length;

  const css = useMemo(() => {
    if (!query) return "";
    const rules = hiddenKeys.map((key) => `[data-search-scope="${scope}"] [data-search-key="${CSS.escape(String(key))}"]`);
    if (shown === 0) rules.push(`[data-search-scope="${scope}"] [data-search-list]`);
    return rules.length ? `${rules.join(",")}{display:none!important}` : "";
  }, [hiddenKeys, query, scope, shown]);

  // Nothing to search yet: render the list (and its own empty state) as-is.
  if (index.length === 0) return <div className={className}>{children}</div>;

  return (
    <div data-search-scope={scope} className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 w-full sm:max-w-sm">
          <SearchInput value={query} onValueChange={setQuery} placeholder={placeholder} label={label} />
          <SearchCount shown={shown} total={index.length} query={query} />
        </div>
        {toolbar}
      </div>
      {css ? <style>{css}</style> : null}
      {query && shown === 0 ? <NoMatches query={query} onClear={() => setQuery("")} /> : null}
      {children}
    </div>
  );
}
