import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentDoctor } from "@/lib/auth-guards";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";
import { firstParam } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FormPage } from "@/components/ui/form-layout";
import { formatAge } from "@/lib/datetime";
import { PATIENT_HEADER_SELECT, prescriptionCatalogs } from "@/lib/lists";
import { isUuid } from "@/lib/rules";

export default async function NewPrescriptionPage({ searchParams }) {
  const patientId = firstParam((await searchParams).patientId);
  if (!patientId) notFound();

  if (!isUuid(patientId)) notFound();

  const [patient, doctor, { medicines, labTests }] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId }, select: PATIENT_HEADER_SELECT }),
    getCurrentDoctor(),
    prescriptionCatalogs(),
  ]);

  if (!doctor) return null; // layout shows the "profile not set up" message
  if (!patient) notFound();

  return (
    <FormPage>
      <Breadcrumbs
        segments={[
          { label: "Patients", href: "/doctor/patients" },
          { label: patient.fullName, href: `/doctor/patients/${patient.id}` },
          { label: "New prescription" },
        ]}
      />
      <PageHeader
        title="New prescription"
        description={`${patient.fullName} · ${patient.patientCode} · ${formatAge(patient)} · Dr. ${doctor.fullName}`}
      />
      <PrescriptionForm patient={{ id: patient.id }} medicines={medicines} labTests={labTests} />
    </FormPage>
  );
}