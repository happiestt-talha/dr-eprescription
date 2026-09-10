import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PatientForm } from "@/components/patients/patient-form";
import { serialize } from "@/lib/utils";

export default async function EditPatientPage({ params }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-2xl w-full min-w-0">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Edit Patient</h1>
      <PatientForm mode="edit" patientId={patient.id} initialValues={serialize(patient)} redirectBase="/doctor/patients" />
    </div>
  );
}