import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";

export default async function EditPrescriptionPage({ params }) {
  const { id } = await params;

  const rx = await prisma.prescription.findUnique({
    where: { id },
    include: { patient: true, doctor: true, vitals: true, medicines: true, labTests: true },
  });

  if (!rx) notFound();
  if (rx.status === "finalized") redirect(`/doctor/prescriptions/${id}`);

  const [medicines, labTests] = await Promise.all([
    prisma.medicine.findMany({ orderBy: { name: "asc" } }),
    prisma.labTest.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4 sm:space-y-6 w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Continue Draft Prescription</h1>
        <p className="text-xs sm:text-sm text-muted-foreground break-words mt-1">
          {rx.patient.fullName} · {rx.patient.patientCode} · Dr. {rx.doctor.fullName}
        </p>
      </div>
      <PrescriptionForm
        patient={rx.patient}
        medicines={medicines}
        labTests={labTests}
        mode="edit"
        prescriptionId={rx.id}
        initialData={rx}
      />
    </div>
  );
}