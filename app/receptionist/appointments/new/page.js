import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppointmentForm } from "@/components/receptionist/appointment-form";
import { statusLabel } from "@/components/ui/status-badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FormPage } from "@/components/ui/form-layout";
import { formatAge, formatDateTime } from "@/lib/datetime";
import { doctorPickerItems } from "@/lib/lists";
import { DuplicateNotice } from "@/components/ui/unique-check";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { firstParam } from "@/lib/utils";

export default async function NewAppointmentPage({ searchParams }) {
  const patientId = firstParam((await searchParams).patientId);
  if (!patientId) notFound();

  const [patient, doctorItems, upcoming, upcomingCount] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, fullName: true, patientCode: true, gender: true, dateOfBirth: true, dobEstimated: true, age: true },
    }),
    doctorPickerItems(),
    // Already-booked visits, so the receptionist doesn't book a duplicate by accident.
    prisma.appointment.findMany({
      where: { patientId, status: { in: ["pending", "confirmed"] }, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      select: { id: true, scheduledAt: true, status: true, doctor: { select: { fullName: true } } },
    }),
    prisma.appointment.count({ where: { patientId, status: { in: ["pending", "confirmed"] }, scheduledAt: { gte: new Date() } } }),
  ]);

  if (!patient) notFound();

  return (
    <FormPage
      title="Book appointment"
      top={<Breadcrumbs segments={[{ label: "Appointments", href: "/receptionist/appointments" }, { label: "Book appointment" }]} />}>
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary" aria-hidden="true">
          {patient.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{patient.fullName}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {patient.patientCode} · {patient.gender} · {formatAge(patient)}
          </p>
        </div>
      </div>
      {upcoming.length > 0 && (
        <DuplicateNotice
          title={upcomingCount === 1 ? "This patient already has an upcoming appointment" : `This patient already has ${upcomingCount} upcoming appointments`}
          note={`${upcoming.map((a) => `${formatDateTime(a.scheduledAt)} with Dr. ${a.doctor.fullName} (${statusLabel(a.status).toLowerCase()})`).join(" · ")}${upcomingCount > upcoming.length ? ` · and ${upcomingCount - upcoming.length} more` : ""}`}
          actions={
            <Link href="/receptionist/appointments" className={buttonVariants({ variant: "outline", size: "touch" })}>
              View appointments
            </Link>
          }
        />
      )}
      <AppointmentForm patientId={patient.id} doctorItems={doctorItems} />
    </FormPage>
  );
}
