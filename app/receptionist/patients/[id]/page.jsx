import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { CalendarPlus, Pencil } from "lucide-react";
import { formatAge, formatCalendarDate } from "@/lib/datetime";
import { ResetPasswordButton } from "@/components/account/reset-password-button";
import { HistoryList } from "@/components/lists/prescription-lists";
import { historyRows } from "@/lib/lists";
import { listStateFrom } from "@/lib/list-state";
import { isUuid } from "@/lib/rules";

const GENDER = { male: "Male", female: "Female", other: "Other" };

// Front-desk details only: clinical fields (allergies, conditions, blood group)
// stay on the doctor's view of the patient.
function PatientDetails({ patient }) {
  const rows = [
    ["Patient code", <span key="code" className="font-mono">{patient.patientCode}</span>],
    ["Gender", GENDER[patient.gender] || patient.gender],
    ["Age", formatAge(patient)],
    ["Date of birth", patient.dateOfBirth ? `${formatCalendarDate(patient.dateOfBirth)}${patient.dobEstimated ? " (estimated)" : ""}` : "—"],
    ["Phone", patient.phone],
    ["CNIC", patient.cnic || "—"],
    ["Emergency contact", patient.emergencyContact || "—"],
  ];

  return (
    <section aria-label="Patient details" className="overflow-hidden rounded-lg border bg-card">
      <dl className="-mb-px grid sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b px-4 py-3 sm:px-5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function ReceptionistPatientProfilePage({ params, searchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();

  // Full visit history (finalised prescriptions only: drafts are the doctor's
  // work in progress), paged in the browser.
  const [patient, visits] = await Promise.all([prisma.patient.findUnique({ where: { id } }), historyRows(id, { viewer: "receptionist", q: listStateFrom(query).q, page: listStateFrom(query).page })]);

  if (!patient) notFound();

  return (
    <PageShell>
      <Breadcrumbs
        segments={[
          { label: "Patients", href: "/receptionist/patients" },
          { label: patient.fullName },
        ]}
      />

      <PageHeader
        title={patient.fullName}
        description={<span className="font-mono">{patient.patientCode}</span>}
        actions={
          <>
            {patient.userId ? (
              <ResetPasswordButton kind="patient" targetId={patient.id} name={patient.fullName} />
            ) : null}
            <Button variant="outline" size="touch" nativeButton={false} render={<Link href={`/receptionist/patients/${patient.id}/edit`} />}>
              <Pencil strokeWidth={1.75} aria-hidden="true" />
              Edit
            </Button>
            <Button size="touch" nativeButton={false} render={<Link href={`/receptionist/appointments/new?patientId=${patient.id}`} />}>
              <CalendarPlus strokeWidth={1.75} aria-hidden="true" />
              Book appointment
            </Button>
          </>
        }
      />

      <PatientDetails patient={patient} />

      <section>
        <h2 className="mb-3 text-base font-semibold">
          Visit history <span className="font-normal text-muted-foreground">· {visits.total}</span>
        </h2>
        <HistoryList rows={visits.rows} server={visits.server} viewer="receptionist" initial={listStateFrom(query)} />
      </section>
    </PageShell>
  );
}
