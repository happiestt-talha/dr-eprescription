import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentDoctor } from "@/lib/auth-guards";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";
import { serialize } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FormPage } from "@/components/ui/form-layout";
import { formatAge } from "@/lib/datetime";
import { PATIENT_HEADER_SELECT, prescriptionCatalogs } from "@/lib/lists";
import { isUuid } from "@/lib/rules";

export default async function EditPrescriptionPage({ params }) {
  const [{ id }, doctor] = await Promise.all([params, getCurrentDoctor()]);
  if (!doctor) return null; // layout shows the "profile not set up" message
  if (!isUuid(id)) notFound();

  // Scoped to the signed-in doctor: other doctors' prescriptions 404.
  // The draft and the pickers load together (one round trip).
  const [rx, { medicines, labTests }] = await Promise.all([
    prisma.prescription.findFirst({
      where: { id, doctorId: doctor.id },
      select: {
        id: true,
        status: true,
        prescriptionCode: true,
        patientId: true,
        symptoms: true,
        diagnosis: true,
        advice: true,
        patient: { select: PATIENT_HEADER_SELECT },
        doctor: { select: { fullName: true } },
        vitals: { select: { heightCm: true, weightKg: true, bloodPressure: true, temperatureF: true, pulseRate: true, spo2: true } },
        medicines: { select: { medicineId: true, dosage: true, frequency: true, duration: true, instructions: true } },
        labTests: { select: { labTestId: true, instructions: true } },
      },
    }),
    prescriptionCatalogs(),
  ]);

  if (!rx) notFound();
  if (rx.status === "finalized") redirect(`/doctor/prescriptions/${id}`);

  return (
    <FormPage>
      <Breadcrumbs
        segments={[
          { label: "Patients", href: "/doctor/patients" },
          { label: rx.patient.fullName, href: `/doctor/patients/${rx.patientId}` },
          { label: rx.prescriptionCode || "Edit draft" },
        ]}
      />
      <PageHeader
        title="Edit draft prescription"
        description={`${rx.patient.fullName} · ${rx.patient.patientCode} · ${formatAge(rx.patient)} · Dr. ${rx.doctor.fullName}`}
      />
      <PrescriptionForm
        patient={{ id: rx.patientId }}
        medicines={medicines}
        labTests={labTests}
        mode="edit"
        prescriptionId={rx.id}
        initialData={serialize({ symptoms: rx.symptoms, diagnosis: rx.diagnosis, advice: rx.advice, vitals: rx.vitals, medicines: rx.medicines, labTests: rx.labTests })}
      />
    </FormPage>
  );
}