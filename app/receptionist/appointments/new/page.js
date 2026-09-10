import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppointmentForm } from "@/components/receptionist/appointment-form";

export default async function NewAppointmentPage({ searchParams }) {
  const { patientId } = await searchParams;
  if (!patientId) notFound();

  const [patient, doctors] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.doctor.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  if (!patient) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-lg w-full space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Book Appointment</h1>
        <p className="text-sm text-muted-foreground">{patient.fullName} · {patient.patientCode}</p>
      </div>
      <AppointmentForm patientId={patient.id} doctors={doctors} />
    </div>
  );
}