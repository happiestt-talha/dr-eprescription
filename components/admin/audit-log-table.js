"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ScrollText, Filter } from "lucide-react";

function actionLabel(action) {
  return action.replace(/_/g, " ");
}

function getActionBadgeStyle(action) {
  const act = action.toLowerCase();
  if (act.includes("create") || act.includes("register") || act.includes("add") || act.includes("active")) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  }
  if (act.includes("delete") || act.includes("remove") || act.includes("deactivate") || act.includes("inactive")) {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
  }
  if (act.includes("update") || act.includes("edit") || act.includes("modify")) {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
  }
  return "bg-muted text-muted-foreground border border-border/40";
}

export function AuditLogTable({
  logs, currentPage, totalPages, entityTypes, actions, activeEntityType, activeAction,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/admin/audit-logs?${params.toString()}`);
  }

  function goToPage(page) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/admin/audit-logs?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Responsive Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-52">
          <Select value={activeEntityType || "all"} onValueChange={(v) => updateFilter("entityType", v === "all" ? "" : v)}>
            <SelectTrigger className="w-full min-h-[44px] md:min-h-[38px] bg-card">
              <SelectValue placeholder="All entity types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entity types</SelectItem>
              {entityTypes.map((e) => (
                <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-60">
          <Select value={activeAction || "all"} onValueChange={(v) => updateFilter("action", v === "all" ? "" : v)}>
            <SelectTrigger className="w-full min-h-[44px] md:min-h-[38px] bg-card">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a} className="capitalize">{actionLabel(a)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Card View (< md: 768px) */}
      <div className="md:hidden space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${getActionBadgeStyle(log.action)}`}>
                {actionLabel(log.action)}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {log.createdAt.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium text-foreground truncate">{log.user.email}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Entity:</span>
                <span className="font-medium text-foreground capitalize">
                  {log.entityType} <span className="text-muted-foreground font-mono text-[11px]">({log.entityId.slice(0, 8)})</span>
                </span>
              </div>
              {log.details && (
                <div className="pt-1.5 border-t mt-1.5">
                  <p className="text-[11px] text-muted-foreground break-all font-mono bg-muted/40 p-2 rounded-lg border border-border/40">
                    {JSON.stringify(log.details)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
            <ScrollText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="font-medium text-foreground">No matching audit log entries</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting the filter options above.</p>
          </div>
        )}
      </div>

      {/* Desktop & Tablet Table View (>= md: 768px) */}
      <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-card shadow-xs">
        <Table className="min-w-[680px] w-full">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details / Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-mono">
                  {log.createdAt.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground">{log.user.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${getActionBadgeStyle(log.action)}`}>
                    {actionLabel(log.action)}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="capitalize font-medium">{log.entityType}</span>
                  <span className="text-muted-foreground font-mono text-xs"> · {log.entityId.slice(0, 8)}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate font-mono">
                  {log.details ? JSON.stringify(log.details) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                  <ScrollText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                  <p className="font-medium text-foreground">No matching audit log entries</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting the filter options above.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="flex-1 sm:flex-initial min-h-[40px] md:min-h-[36px]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" strokeWidth={1.75} />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="flex-1 sm:flex-initial min-h-[40px] md:min-h-[36px]"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </div>
  );
}