"use client";

import Link from "next/link";
import { Pencil, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { DoctorStatusToggle } from "@/components/admin/doctor-status-toggle";

const FILTERS = [
  { key: "status", label: "Statuses", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
];

export function DoctorsList({ rows, server, initial }) {
  const columns = [
    {
      key: "fullName",
      header: "Doctor",
      mobile: "title",
      cell: (d) => (
        <span className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden="true">
            {d.fullName.charAt(0)}
          </span>
          Dr. {d.fullName}
        </span>
      ),
    },
    { key: "specialization", header: "Specialisation", mobile: "subtitle" },
    { key: "registrationNo", header: "PMDC number", className: "font-mono text-xs" },
    { key: "clinicName", header: "Clinic", className: "hidden lg:table-cell" },
    { key: "phone", header: "Phone", className: "hidden xl:table-cell whitespace-nowrap" },
    {
      key: "status",
      header: "Active",
      mobile: "badge",
      cell: (d) => <DoctorStatusToggle doctorId={d.id} doctorName={d.fullName} isActive={d.isActive} />,
    },
  ];
  return (
    <DataList
      rows={rows}
      initial={initial}
      server={server}
      columns={columns}
      filters={FILTERS}
      noun="doctors"
      searchPlaceholder="Search name, specialisation, PMDC number, clinic or email"
      empty={{ icon: Stethoscope, title: "No doctors registered yet", text: "Add your first doctor to begin issuing prescriptions." }}
      actions={(d) => (
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" aria-label={`Edit Dr. ${d.fullName}`} nativeButton={false} render={<Link href={`/admin/doctors/${d.id}`} />}>
          <Pencil className="size-3.5" aria-hidden="true" /> Edit
        </Button>
      )}
    />
  );
}
