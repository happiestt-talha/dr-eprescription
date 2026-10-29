import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppointmentForm } from "@/components/receptionist/appointment-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { toClinicInputValue } from "@/lib/datetime";
import { firstParam } from "@/lib/utils";

export default async function NewAppointmentPage({ searchParams }) {
  const patientId = firstParam((await searchParams).patientId);
  if (!patientId) notFound();

  const [patient, doctors] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.doctor.findMany({ where: { user: { isActive: true } }, orderBy: { fullName: "asc" } }),
  ]);

  if (!patient) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-lg w-full space-y-4 sm:space-y-6 min-w-0">
      <Breadcrumbs
        segments={[
          { label: "Appointments", href: "/receptionist/appointments" },
          { label: "Book Appointment" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Book Appointment</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{patient.fullName} · {patient.patientCode}</p>
      </div>
      <AppointmentForm patientId={patient.id} doctors={doctors} minDateTime={toClinicInputValue(new Date())} />
    </div>
  );
}