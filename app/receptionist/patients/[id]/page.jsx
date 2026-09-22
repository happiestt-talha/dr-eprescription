import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CalendarPlus, Pencil, User } from "lucide-react";

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
      <Breadcrumbs
        segments={[
          { label: "Patients", href: "/receptionist/patients" },
          { label: patient.fullName },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{patient.fullName}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">{patient.patientCode}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Link href={`/receptionist/patients/${patient.id}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
              <Pencil className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Edit
            </Button>
          </Link>
          <Link href={`/receptionist/appointments/new?patientId=${patient.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">
              <CalendarPlus className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-border/60 shadow-xs">
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-4 p-4 sm:p-6">
          {details.map(([label, value]) => (
            <div key={label} className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
              <p className="text-sm font-medium mt-1 text-foreground">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base sm:text-lg font-semibold mb-3">Recent Visits</h2>
        <div className="rounded-xl border border-border/60 overflow-x-auto w-full bg-card shadow-xs">
          <Table className="min-w-[450px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patient.prescriptions.map((rx) => (
                <TableRow key={rx.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="whitespace-nowrap font-medium">{rx.visitDate.toLocaleDateString()}</TableCell>
                  <TableCell className="whitespace-nowrap">Dr. {rx.doctor.fullName}</TableCell>
                  <TableCell className="capitalize">
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                      rx.status === "finalized"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}>
                      {rx.status}
                    </span>
                  </TableCell>
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