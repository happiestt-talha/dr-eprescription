"use client";

import Link from "next/link";
import { CalendarPlus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";

// Per-portal row action: doctors prescribe, reception books a visit.
const ACTIONS = {
  doctor: { href: (id) => `/doctor/prescriptions/new?patientId=${id}`, label: "Prescribe", Icon: Plus },
  receptionist: { href: (id) => `/receptionist/appointments/new?patientId=${id}`, label: "Book visit", Icon: CalendarPlus },
};

const GENDER_FILTER = [
  {
    key: "gender",
    label: "Genders",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "other", label: "Other" },
    ],
  },
];

/** The patient directory (doctor and receptionist): every patient, A–Z. */
export function PatientsList({ rows, server, portal, basePath, initial }) {
  const action = ACTIONS[portal];
  const columns = [
    {
      key: "fullName",
      header: "Name",
      mobile: "title",
      cell: (p) => (
        <Link href={`${basePath}/${p.id}`} className="font-semibold text-foreground hover:underline">
          {p.fullName}
        </Link>
      ),
    },
    {
      key: "patientCode",
      header: "Patient code",
      mobile: "subtitle",
      cell: (p) => <span className="font-mono text-xs text-muted-foreground">{p.patientCode}</span>,
    },
    { key: "phone", header: "Phone", className: "whitespace-nowrap" },
    { key: "cnic", header: "CNIC", className: "hidden lg:table-cell font-mono text-xs" },
    { key: "ageLabel", header: "Gender / age", className: "capitalize", cell: (p) => `${p.gender} · ${p.ageLabel}` },
  ];
  return (
    <DataList
      rows={rows}
      server={server}
      initial={initial}
      columns={columns}
      filters={server ? [] : GENDER_FILTER}
      noun="patients"
      searchPlaceholder="Search name, phone, CNIC or patient ID"
      empty={{ icon: Users, title: "No patients registered yet", text: "Use “Register patient” above to add the first one." }}
      actions={(p) => (
        <>
          <Button variant="outline" size="sm" className="h-9 text-xs" nativeButton={false} render={<Link href={`${basePath}/${p.id}`} />}>
            Profile
          </Button>
          <Button size="sm" className="h-9 gap-1 text-xs" nativeButton={false} render={<Link href={action.href(p.id)} />}>
            <action.Icon className="size-3.5" aria-hidden="true" />
            {action.label}
          </Button>
        </>
      )}
    />
  );
}
