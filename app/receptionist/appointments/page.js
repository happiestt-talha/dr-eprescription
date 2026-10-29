import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AppointmentActions } from "@/components/receptionist/appointment-actions";
import { Plus, CalendarDays, Clock, User, Stethoscope } from "lucide-react";
import { firstParam, serialize } from "@/lib/utils";
import { formatDateTime, startOfClinicDay } from "@/lib/datetime";
import { SearchableSection } from "@/components/searchable-section";

function getStatusBadge(status) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "confirmed":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "cancelled":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    default:
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }
}

export default async function AppointmentsPage({ searchParams }) {
  const view = firstParam((await searchParams).view);
  const showPast = view === "past";
  const today = startOfClinicDay();

  // Upcoming: today onwards, soonest first. Past: most recent first.
  const [appointments, doctors] = await Promise.all([
    prisma.appointment.findMany({
      where: { scheduledAt: showPast ? { lt: today } : { gte: today } },
      include: { patient: true, doctor: true },
      orderBy: { scheduledAt: showPast ? "desc" : "asc" },
      take: 100,
    }),
    prisma.doctor.findMany({ where: { user: { isActive: true } }, orderBy: { fullName: "asc" } }),
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Appointments Schedule</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage clinic bookings, attendance status, and doctor schedules.
          </p>
        </div>
        <Button className="w-full sm:w-auto min-h-[44px] shadow-xs" nativeButton={false} render={<Link href="/receptionist/patients" className="w-full sm:w-auto" />}>
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Book Appointment
          </Button>
      </div>

      <div className="flex gap-2">
        {[
          { label: "Upcoming", href: "/receptionist/appointments", active: !showPast },
          { label: "Past", href: "/receptionist/appointments?view=past", active: showPast },
        ].map((tab) => (
          <Button key={tab.label} variant={tab.active ? "default" : "outline"} size="sm" className="min-h-[36px]" nativeButton={false} render={<Link href={tab.href} aria-current={tab.active ? "page" : undefined} />}>
              {tab.label}
            </Button>
        ))}
      </div>

      <SearchableSection
        placeholder="Search by patient, doctor or status"
        index={appointments.map((appt) => ({ key: appt.id, text: [appt.patient.fullName, appt.patient.patientCode, appt.doctor.fullName, appt.status, formatDateTime(appt.scheduledAt)].join(" ") }))}
      >
        {/* Mobile Card View (< md: 768px) */}
        <div data-search-list className="md:hidden space-y-3">
          {appointments.map((appt) => (
            <div key={appt.id} data-search-key={appt.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
              <div className="flex items-start justify-between border-b pb-2.5">
                <div>
                  <Link href={`/receptionist/patients/${appt.patientId}`} className="font-semibold text-base text-foreground hover:underline">
                    {appt.patient.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{appt.patient.patientCode}</p>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium border ${getStatusBadge(appt.status)}`}>
                  {appt.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Scheduled:
                  </span>
                  <span className="font-medium text-foreground">{formatDateTime(appt.scheduledAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    Doctor:
                  </span>
                  <span className="font-medium text-foreground">Dr. {appt.doctor.fullName}</span>
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Update Status:</span>
                <AppointmentActions appointment={serialize(appt)} doctors={doctors} />
              </div>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="font-medium text-foreground">{showPast ? "No past appointments" : "No upcoming appointments"}</p>
              <p className="text-xs text-muted-foreground mt-1">Book an appointment by searching for a patient.</p>
            </div>
          )}
        </div>

        {/* Desktop & Tablet Table (>= md: 768px) */}
        <div data-search-list className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-card shadow-xs">
          <Table className="min-w-[600px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Date & Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status & Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appt) => (
                <TableRow key={appt.id} data-search-key={appt.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDateTime(appt.scheduledAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/receptionist/patients/${appt.patientId}`} className="hover:underline font-semibold text-foreground">
                      {appt.patient.fullName}
                    </Link>
                    <span className="block text-xs text-muted-foreground font-mono">{appt.patient.patientCode}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      <span>Dr. {appt.doctor.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AppointmentActions appointment={serialize(appt)} doctors={doctors} />
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-16">
                    <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                    <p className="font-medium text-foreground">{showPast ? "No past appointments" : "No upcoming appointments"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Book an appointment by searching for a patient.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SearchableSection>
    </div>
  );
}