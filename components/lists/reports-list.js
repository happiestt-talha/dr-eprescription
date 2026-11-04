"use client";

import { Download, FileBarChart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataList } from "@/components/ui/data-list";
import { StatusBadge } from "@/components/ui/status-badge";

const TYPE_LABELS = { patients: "Patients report", prescriptions: "Prescriptions report", appointments: "Appointments report", doctors: "Doctors report", medicines: "Medicines report" };
const FILTERS = [
  { key: "reportType", label: "Report types", options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })) },
  { key: "format", label: "Formats", options: [{ value: "pdf", label: "PDF" }, { value: "csv", label: "CSV" }] },
];

/** Every generated report (no cap), newest first. */
export function ReportsList({ rows, server, initial }) {
  const columns = [
    {
      key: "reportType",
      header: "Report",
      mobile: "title",
      cell: (r) => (
        <span className="font-medium text-foreground">{TYPE_LABELS[r.reportType] ?? r.reportType}</span>
      ),
    },
    { key: "range", header: "Date range" },
    { key: "generated", header: "Generated", mobile: "subtitle", className: "whitespace-nowrap" },
    { key: "format", header: "Format", mobile: "badge", cell: (r) => <StatusBadge tone="neutral" className="uppercase">{r.format}</StatusBadge> },
  ];
  return (
    <DataList
      rows={rows}
      initial={initial}
      server={server}
      columns={columns}
      filters={FILTERS}
      noun="reports"
      defaultPageSize={10}
      searchPlaceholder="Search report type, format or date"
      empty={{ icon: FileBarChart, title: "No reports generated yet", text: "Use the generator above to create your first report." }}
      actions={(r) => (
        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5 text-xs")}>
          <Download className="size-3.5" aria-hidden="true" /> Download {r.format.toUpperCase()}
        </a>
      )}
    />
  );
}
