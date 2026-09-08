import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";

export default async function NewPrescriptionPage({ searchParams }) {
  const { patientId } = await searchParams;
  if (!patientId) notFound();

  const session = await auth();

  const [patient, doctor, medicines, labTests] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.doctor.findUnique({ where: { userId: session.user.id } }),
    prisma.medicine.findMany({ orderBy: { name: "asc" } }),
    prisma.labTest.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!patient) notFound();

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Prescription</h1>
        <p className="text-muted-foreground">
          {patient.fullName} · {patient.patientCode} · Dr. {doctor.fullName}
        </p>
      </div>
      <PrescriptionForm patient={patient} medicines={medicines} labTests={labTests} />
    </div>
  );
}