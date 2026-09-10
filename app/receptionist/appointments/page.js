import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AppointmentActions } from "@/components/receptionist/appointment-actions";
import { Plus } from "lucide-react";
import { serialize } from "@/lib/utils";

export default async function AppointmentsPage() {
  const [appointments, doctors] = await Promise.all([
    prisma.appointment.findMany({
      include: { patient: true, doctor: true },
      orderBy: { scheduledAt: "asc" },
      take: 100,
    }),
    prisma.doctor.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Appointments</h1>
        <Link href="/receptionist/patients" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px]">
            <Plus className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </Link>
      </div>

      <div className="rounded-md border overflow-x-auto w-full">
        <Table className="min-w-[600px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appt) => (
              <TableRow key={appt.id}>
                <TableCell className="whitespace-nowrap">{appt.scheduledAt.toLocaleString()}</TableCell>
                <TableCell>
                  <Link href={`/receptionist/patients/${appt.patientId}`} className="hover:underline font-medium">
                    {appt.patient.fullName}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">Dr. {appt.doctor.fullName}</TableCell>
                <TableCell>
                  <AppointmentActions appointment={serialize(appt)} doctors={doctors} />
                </TableCell>
              </TableRow>
            ))}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No appointments booked yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}