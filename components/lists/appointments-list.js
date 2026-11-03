"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { DataList } from "@/components/ui/data-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppointmentActions } from "@/components/receptionist/appointment-actions";

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));

/** Appointments (upcoming or past). Doctor and status filters run in the browser. */
export function AppointmentsList({ rows, server, doctorItems, past, toolbar, initial }) {
  const doctorFilter = { key: "doctor", label: "Doctors", options: doctorItems.map((d) => ({ value: d.value, label: d.label })), value: (a) => a.doctorId };
  const columns = [
    { key: "when", header: "Date & time", mobile: "subtitle", className: "whitespace-nowrap font-medium" },
    {
      key: "patientName",
      header: "Patient",
      mobile: "title",
      cell: (a) => (
        <span>
          <Link href={`/receptionist/patients/${a.patientId}`} className="font-semibold text-foreground hover:underline">
            {a.patientName}
          </Link>
          <span className="block font-mono text-xs text-muted-foreground">{a.patientCode}</span>
        </span>
      ),
    },
    { key: "doctorName", header: "Doctor" },
    { key: "status", header: "Status", mobile: "badge", cell: (a) => <StatusBadge status={a.status} /> },
  ];
  return (
    <DataList
      rows={rows}
      initial={initial}
      server={server}
      columns={columns}
      filters={[doctorFilter, { key: "status", label: "Statuses", options: STATUS_OPTIONS }]}
      toolbar={toolbar}
      noun="appointments"
      searchPlaceholder="Search patient, ID, doctor, status or date"
      empty={{ icon: CalendarDays, title: past ? "No past appointments" : "No upcoming appointments", text: past ? undefined : "To book one, find the patient on the Patients page." }}
      actions={(a) => <AppointmentActions key={`${a.id}-${a.status}`} appointment={a.action} doctorItems={doctorItems} />}
    />
  );
}
