import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FileText, Calendar, ArrowRight, Stethoscope } from "lucide-react";
import { formatDate } from "@/lib/datetime";
import { SearchableSection } from "@/components/searchable-section";

export default async function PatientPrescriptionsPage() {
  const session = await auth();

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      prescriptions: {
        where: { status: "finalized" },
        include: { doctor: true },
        orderBy: { visitDate: "desc" },
      },
    },
  });

  if (!patient) notFound();

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Prescription Records</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Patient: {patient.fullName} · ID: <span className="font-mono">{patient.patientCode}</span>
        </p>
      </div>

      <SearchableSection
        placeholder="Search your prescriptions"
        index={patient.prescriptions.map((rx) => ({ key: rx.id, text: [rx.prescriptionCode, rx.doctor?.fullName, rx.diagnosis, formatDate(rx.visitDate)].join(" ") }))}
      >
        {/* Mobile Card View (< md: 768px) */}
        <div data-search-list className="md:hidden space-y-3">
          {patient.prescriptions.map((rx) => (
            <div key={rx.id} data-search-key={rx.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  <span className="font-semibold text-sm text-foreground">Rx {rx.prescriptionCode}</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Finalized
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Visit Date:
                  </span>
                  <span className="font-medium text-foreground">{formatDate(rx.visitDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    Doctor:
                  </span>
                  <span className="font-medium text-foreground">Dr. {rx.doctor.fullName}</span>
                </div>
                {rx.diagnosis && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Diagnosis:</span>
                    <span className="font-medium text-foreground">{rx.diagnosis}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <Button size="sm" className="w-full min-h-[40px] text-xs" nativeButton={false} render={<Link href={`/patient/prescriptions/${rx.id}`} className="block" />}>
                    View Prescription & Details
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
              </div>
            </div>
          ))}
          {patient.prescriptions.length === 0 && (
            <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="font-medium text-foreground">No prescriptions on record</p>
              <p className="text-xs text-muted-foreground mt-1">Your doctor&apos;s digital prescriptions will appear here once issued.</p>
            </div>
          )}
        </div>

        {/* Desktop & Tablet Table (>= md: 768px) */}
        <div data-search-list className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-card shadow-xs">
          <Table className="min-w-[450px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Visit Date</TableHead>
                <TableHead>Prescription Code</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patient.prescriptions.map((rx) => (
                <TableRow key={rx.id} data-search-key={rx.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(rx.visitDate)}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-primary font-medium">
                    {rx.prescriptionCode}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      <span>Dr. {rx.doctor.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{rx.diagnosis || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="h-8 text-xs font-medium shadow-xs" nativeButton={false} render={<Link href={`/patient/prescriptions/${rx.id}`} />}>
                        View Details
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
              {patient.prescriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                    <p className="font-medium text-foreground">No prescriptions on record</p>
                    <p className="text-xs text-muted-foreground mt-1">Your doctor&apos;s digital prescriptions will appear here once issued.</p>
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