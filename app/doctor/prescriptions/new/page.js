import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentDoctor } from "@/lib/auth-guards";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";
import { firstParam, serialize } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function NewPrescriptionPage({ searchParams }) {
  const patientId = firstParam((await searchParams).patientId);
  if (!patientId) notFound();

  const [patient, doctor, medicines, labTests] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    getCurrentDoctor(),
    prisma.medicine.findMany({ orderBy: { name: "asc" } }),
    prisma.labTest.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!doctor) return null; // layout shows the "profile not set up" message
  if (!patient) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4 sm:space-y-6 w-full min-w-0">
      <Breadcrumbs
        segments={[
          { label: "Patients", href: "/doctor/patients" },
          { label: patient.fullName, href: `/doctor/patients/${patient.id}` },
          { label: "New Prescription" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">New Prescription</h1>
        <p className="text-xs sm:text-sm text-muted-foreground break-words mt-0.5">
          {patient.fullName} · {patient.patientCode} · Dr. {doctor.fullName}
        </p>
      </div>
      <PrescriptionForm patient={serialize(patient)} medicines={medicines} labTests={labTests} />
    </div>
  );
}