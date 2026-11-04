import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentDoctor } from "@/lib/auth-guards";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { Plus, Pencil } from "lucide-react";
import { HistoryList } from "@/components/lists/prescription-lists";
import { historyRows } from "@/lib/lists";
import { listStateFrom } from "@/lib/list-state";
import { isUuid } from "@/lib/rules";
import { formatAge, formatCalendarDate } from "@/lib/datetime";
import { ResetPasswordButton } from "@/components/account/reset-password-button";

const GENDER = { male: "Male", female: "Female", other: "Other" };

// Allergies first and highlighted when present: they matter before prescribing.
function PatientDetails({ patient }) {
  const rows = [
    ["Patient code", <span key="code" className="font-mono">{patient.patientCode}</span>],
    ["Gender", GENDER[patient.gender] || patient.gender],
    ["Age", formatAge(patient)],
    ["Date of birth", patient.dateOfBirth ? `${formatCalendarDate(patient.dateOfBirth)}${patient.dobEstimated ? " (estimated)" : ""}` : "—"],
    ["Phone", patient.phone],
    ["Blood group", patient.bloodGroup || "—"],
    ["CNIC", patient.cnic || "—"],
    ["Emergency contact", patient.emergencyContact || "—"],
    ["Existing conditions", patient.existingDiseases || "None recorded"],
    ...(patient.allergies ? [] : [["Allergies", "None recorded"]]),
  ];

  return (
    <section aria-label="Patient details" className="overflow-hidden rounded-lg border bg-card">
      <dl className="-mb-px grid sm:grid-cols-2">
        {patient.allergies ? (
          <div className="border-b border-l-4 border-l-warning bg-warning/8 px-4 py-3 sm:col-span-2 sm:px-5">
            <dt className="text-sm font-medium text-warning-strong">Allergies</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">{patient.allergies}</dd>
          </div>
        ) : null}
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

export default async function PatientProfilePage({ params, searchParams }) {
  const [{ id }, query, doctor] = await Promise.all([params, searchParams, getCurrentDoctor()]);
  if (!doctor) return null; // layout shows the "profile not set up" message
  if (!isUuid(id)) notFound();

  // Other doctors' prescriptions appear as summary rows only (no diagnosis,
  // no link), and their drafts are hidden entirely (see historyRows).
  const [patient, history] = await Promise.all([
    prisma.patient.findUnique({ where: { id } }),
    historyRows(id, { viewer: "doctor", doctorId: doctor.id, q: listStateFrom(query).q, page: listStateFrom(query).page }),
  ]);

  if (!patient) notFound();

  return (
    <PageShell>
      <Breadcrumbs
        segments={[
          { label: "Patients", href: "/doctor/patients" },
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
            <Button variant="outline" size="touch" nativeButton={false} render={<Link href={`/doctor/patients/${patient.id}/edit`} />}>
              <Pencil strokeWidth={1.75} aria-hidden="true" />
              Edit
            </Button>
            <Button size="touch" nativeButton={false} render={<Link href={`/doctor/prescriptions/new?patientId=${patient.id}`} />}>
              <Plus strokeWidth={1.75} aria-hidden="true" />
              New prescription
            </Button>
          </>
        }
      />

      <PatientDetails patient={patient} />

      <section>
        <h2 className="mb-3 text-base font-semibold">
          Prescription history <span className="font-normal text-muted-foreground">· {history.total}</span>
        </h2>
        <HistoryList rows={history.rows} server={history.server} viewer="doctor" initial={listStateFrom(query, ["owner", "status"])} />
      </section>
    </PageShell>
  );
}
