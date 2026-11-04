"use client";

import Link from "next/link";
import { ArrowRight, FilePen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { StatusBadge } from "@/components/ui/status-badge";

/** The signed-in doctor's draft prescriptions. */
export function DraftsList({ rows, server, initial }) {
  const columns = [
    {
      key: "patientName",
      header: "Patient",
      mobile: "title",
      cell: (rx) => (
        <Link href={`/doctor/prescriptions/${rx.id}/edit`} className="font-semibold text-foreground hover:underline">
          {rx.patientName}
        </Link>
      ),
    },
    { key: "patientCode", header: "Patient code", mobile: "subtitle", cell: (rx) => <span className="font-mono text-xs text-muted-foreground">{rx.patientCode}</span> },
    { key: "started", header: "Started", className: "whitespace-nowrap" },
    { key: "diagnosis", header: "Diagnosis", cell: (rx) => rx.diagnosis || "—" },
    { key: "status", header: "Status", mobile: "badge", cell: () => <StatusBadge status="draft" /> },
  ];
  return (
    <DataList
      rows={rows}
      initial={initial}
      server={server}
      columns={columns}
      noun="drafts"
      searchPlaceholder="Search patient, ID, code or diagnosis"
      empty={{ icon: FilePen, title: "No drafts in progress", text: "Prescriptions you save as drafts appear here." }}
      actions={(rx) => (
        <Button size="sm" className="h-9 gap-1 text-xs" nativeButton={false} render={<Link href={`/doctor/prescriptions/${rx.id}/edit`} />}>
          Resume <ArrowRight className="size-3.5" aria-hidden="true" />
        </Button>
      )}
    />
  );
}

const STATUS_FILTER = { key: "status", label: "Statuses", options: [{ value: "finalized", label: "Finalised" }, { value: "draft", label: "Draft" }] };
const OWNER_FILTER = { key: "owner", label: "Doctors", options: [{ value: "mine", label: "My prescriptions" }, { value: "others", label: "Other doctors" }] };

/**
 * A patient's prescription history. `viewer`:
 * - "doctor": own (any status) + others' finalised; links only to own ones
 * - "receptionist": finalised only, no diagnosis column, no links
 * - "patient": finalised only, links to the patient's own prescription pages
 */
export function HistoryList({ rows, server, viewer, initial }) {
  const showDiagnosis = viewer !== "receptionist";
  const href = (rx) =>
    viewer === "patient" ? `/patient/prescriptions/${rx.id}` : viewer === "doctor" && rx.mine ? (rx.status === "draft" ? `/doctor/prescriptions/${rx.id}/edit` : `/doctor/prescriptions/${rx.id}`) : null;
  const columns = [
    { key: "date", header: "Visit date", mobile: "title", className: "whitespace-nowrap font-medium" },
    { key: "prescriptionCode", header: "Code", mobile: "subtitle", cell: (rx) => <span className="font-mono text-xs">{rx.prescriptionCode || "—"}</span> },
    { key: "doctorName", header: "Doctor" },
    ...(showDiagnosis ? [{ key: "diagnosis", header: "Diagnosis", cell: (rx) => rx.diagnosis || "—" }] : []),
    ...(viewer === "doctor" ? [{ key: "status", header: "Status", mobile: "badge", cell: (rx) => <StatusBadge status={rx.status} /> }] : []),
  ];
  const filters = viewer === "doctor" ? [OWNER_FILTER, STATUS_FILTER] : [];
  const hasLinks = viewer !== "receptionist";
  return (
    <DataList
      rows={rows}
      initial={initial}
      server={server}
      columns={columns}
      filters={filters}
      noun="prescriptions"
      defaultPageSize={10}
      searchPlaceholder={showDiagnosis ? "Search code, doctor, date or diagnosis" : "Search code, doctor or date"}
      empty={{
        icon: FileText,
        title: viewer === "patient" ? "No prescriptions on record" : "No prescriptions yet for this patient",
        text: viewer === "patient" ? "Your doctor's prescriptions appear here once they're issued." : undefined,
      }}
      actions={
        hasLinks
          ? (rx) => {
              const to = href(rx);
              return to ? (
                <Button variant="ghost" size="sm" className="h-9 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary" nativeButton={false} render={<Link href={to} />}>
                  {rx.status === "draft" ? "Edit draft" : "View"}
                </Button>
              ) : (
                <span className="self-center text-xs text-muted-foreground">Other doctor</span>
              );
            }
          : undefined
      }
    />
  );
}
