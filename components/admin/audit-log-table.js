"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ScrollText } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataListRows } from "@/components/ui/data-list";
import { auditActionLabel, auditActionTone } from "@/lib/audit-labels";
import { clinicDateKey } from "@/lib/datetime";

const DEBOUNCE_MS = 300;
// Same columns shape as DataList; the phone card shows the action as a badge.
const COLUMNS = [
  { key: "email", header: "User", mobile: "title", className: "text-sm font-medium" },
  { key: "when", header: "When", mobile: "subtitle", className: "whitespace-nowrap text-xs text-muted-foreground tabular-nums" },
  { key: "action", header: "Action", mobile: "badge", cell: (log) => <StatusBadge tone={auditActionTone(log.action)}>{auditActionLabel(log.action)}</StatusBadge> },
  {
    key: "entity",
    header: "Entity",
    cell: (log) => (
      <span className="text-sm">
        <span className="capitalize">{log.entityType}</span>
        <span className="font-mono text-xs text-muted-foreground"> · {log.entityShort}</span>
      </span>
    ),
  },
  {
    key: "details",
    header: "Details",
    className: "max-w-xs truncate font-mono text-xs text-muted-foreground",
    cell: (log) => <span title={log.details}>{log.details || "—"}</span>,
  },
];

/**
 * Server-paged audit log: search (all pages), entity/action filters and a
 * date range all live in the URL and are applied by the server.
 */
export function AuditLogTable({ logs, page, lastPage, total, pageSize, entityTypes, actions, current }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(current.q);
  const [isPending, startTransition] = useTransition();

  function navigate(changes) {
    const params = new URLSearchParams();
    const next = { ...current, ...changes };
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    if (changes.page) params.set("page", String(changes.page));
    if (changes.page === 1) params.delete("page");
    startTransition(() => router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false }));
  }

  // Search is sent to the server after a short pause (it covers every page).
  useEffect(() => {
    if (query.trim() === current.q) return;
    const timer = setTimeout(() => navigate({ q: query.trim(), page: 1 }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hrefFor = (p) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) if (v) params.set(k, v);
    if (p > 1) params.set("page", String(p));
    return `${pathname}${params.toString() ? `?${params}` : ""}`;
  };
  const filtered = Boolean(current.q || current.entityType || current.action || current.from || current.to);
  const entityItems = { "": "All entity types", ...Object.fromEntries(entityTypes.map((e) => [e, e])) };
  const actionItems = { "": "All actions", ...Object.fromEntries(actions.map((a) => [a, auditActionLabel(a)])) };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="flex w-full items-center gap-2 sm:max-w-xs">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search user, action or entity" />
          {isPending ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-label="Loading" /> : null}
        </div>
        <Select value={current.entityType} onValueChange={(v) => navigate({ entityType: v ?? "", page: 1 })} items={entityItems}>
          <SelectTrigger aria-label="Entity type" className="h-11 w-full capitalize sm:w-48 md:h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(entityItems).map(([v, l]) => <SelectItem key={v || "all"} value={v} className="capitalize">{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={current.action} onValueChange={(v) => navigate({ action: v ?? "", page: 1 })} items={actionItems}>
          <SelectTrigger aria-label="Action" className="h-11 w-full capitalize sm:w-56 md:h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(actionItems).map(([v, l]) => <SelectItem key={v || "all"} value={v} className="capitalize">{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="w-full sm:w-40">
            <DatePicker value={current.from} onValueChange={(v) => navigate({ from: v, page: 1 })} max={current.to || clinicDateKey()} placeholder="From date" aria-describedby={undefined} />
          </div>
          <div className="w-full sm:w-40">
            <DatePicker value={current.to} onValueChange={(v) => navigate({ to: v, page: 1 })} min={current.from || undefined} max={clinicDateKey()} placeholder="To date" />
          </div>
        </div>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              navigate({ q: "", entityType: "", action: "", from: "", to: "", page: 1 });
            }}
            className="text-xs font-medium text-primary underline-offset-2 hover:underline">
            Clear all
          </button>
        ) : null}
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title={filtered ? "No matching audit log entries" : "No audit log entries yet"} text={filtered ? "Try a different search, filter or date range." : undefined} />
      ) : (
        <div className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <DataListRows rows={logs} columns={COLUMNS} />
          <Pagination
            page={page}
            lastPage={lastPage}
            from={(page - 1) * pageSize + 1}
            to={Math.min(page * pageSize, total)}
            total={total}
            pageSize={pageSize}
            noun="entries"
            hrefFor={hrefFor}
          />
        </div>
      )}
    </div>
  );
}
