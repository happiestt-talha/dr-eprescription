"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

function actionLabel(action) {
  return action.replace(/_/g, " ");
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
        <Select value={activeEntityType || "all"} onValueChange={(v) => updateFilter("entityType", v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-48 min-h-[44px] md:min-h-[36px]">
            <SelectValue placeholder="All entity types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entity types</SelectItem>
            {entityTypes.map((e) => (
              <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={activeAction || "all"} onValueChange={(v) => updateFilter("action", v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-56 min-h-[44px] md:min-h-[36px]">
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

      {/* Mobile Card View (< md: 768px) */}
      <div className="md:hidden space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="border rounded-lg p-4 bg-card space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded bg-muted text-foreground">
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
                  {log.entityType} <span className="text-muted-foreground">({log.entityId.slice(0, 8)})</span>
                </span>
              </div>
              {log.details && (
                <div className="pt-1.5 border-t mt-1.5">
                  <p className="text-[11px] text-muted-foreground break-all font-mono bg-muted/40 p-2 rounded">
                    {JSON.stringify(log.details)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border rounded-lg bg-card">
            No matching audit log entries.
          </div>
        )}
      </div>

      {/* Desktop & Tablet Table View (>= md: 768px) */}
      <div className="hidden md:block rounded-md border overflow-x-auto w-full">
        <Table className="min-w-[680px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {log.createdAt.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">{log.user.email}</TableCell>
                <TableCell className="capitalize text-sm">{actionLabel(log.action)}</TableCell>
                <TableCell className="text-sm">
                  <span className="capitalize">{log.entityType}</span>
                  <span className="text-muted-foreground"> · {log.entityId.slice(0, 8)}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate font-mono">
                  {log.details ? JSON.stringify(log.details) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No matching audit log entries.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="flex-1 sm:flex-initial min-h-[44px] md:min-h-[36px]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="flex-1 sm:flex-initial min-h-[44px] md:min-h-[36px]"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}