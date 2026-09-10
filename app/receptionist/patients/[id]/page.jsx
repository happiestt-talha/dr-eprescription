import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CalendarPlus, Pencil } from "lucide-react";

export default async function ReceptionistPatientProfilePage({ params }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      prescriptions: {
        include: { doctor: true },
        orderBy: { visitDate: "desc" },
        take: 10,
      },
    },
  });

  if (!patient) notFound();

  const details = [
    ["Patient ID", patient.patientCode],
    ["Gender", patient.gender],
    ["Age", patient.age ?? "—"],
    ["Phone", patient.phone],
    ["CNIC", patient.cnic || "—"],
    ["Emergency Contact", patient.emergencyContact || "—"],
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">{patient.fullName}</h1>
          <p className="text-sm text-muted-foreground font-mono">{patient.patientCode}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Link href={`/receptionist/patients/${patient.id}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/receptionist/appointments/new?patientId=${patient.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 p-4 sm:p-6">
          {details.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base sm:text-lg font-medium mb-3">Recent Visits</h2>
        <div className="rounded-md border overflow-x-auto w-full">
          <Table className="min-w-[450px] w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patient.prescriptions.map((rx) => (
                <TableRow key={rx.id}>
                  <TableCell className="whitespace-nowrap">{rx.visitDate.toLocaleDateString()}</TableCell>
                  <TableCell className="whitespace-nowrap">Dr. {rx.doctor.fullName}</TableCell>
                  <TableCell className="capitalize">{rx.status}</TableCell>
                </TableRow>
              ))}
              {patient.prescriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No visit history yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}