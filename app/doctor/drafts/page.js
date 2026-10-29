import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentDoctor } from "@/lib/auth-guards";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FilePen, ArrowRight, User } from "lucide-react";
import { formatDate } from "@/lib/datetime";
import { SearchableSection } from "@/components/searchable-section";

export default async function DraftsPage() {
  const doctor = await getCurrentDoctor();
  if (!doctor) return null; // layout shows the "profile not set up" message

  const drafts = await prisma.prescription.findMany({
    where: { doctorId: doctor.id, status: "draft" },
    include: { patient: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Draft Prescriptions</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Unfinalized prescriptions waiting to be completed and generated.
        </p>
      </div>

      <SearchableSection
        placeholder="Search drafts by patient or code"
        index={drafts.map((rx) => ({ key: rx.id, text: [rx.patient.fullName, rx.patient.patientCode, rx.prescriptionCode, rx.diagnosis].join(" ") }))}
      >
        {/* Mobile Card View (< md: 768px) */}
        <div data-search-list className="md:hidden space-y-3">
          {drafts.map((rx) => (
            <div key={rx.id} data-search-key={rx.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <FilePen className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                  <span className="font-semibold text-sm text-foreground">{rx.patient.fullName}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Draft
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Patient Code:</span>
                  <span className="font-mono text-foreground">{rx.patient.patientCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Started On:</span>
                  <span className="text-foreground">{formatDate(rx.createdAt)}</span>
                </div>
                {rx.diagnosis && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Diagnosis:</span>
                    <span className="text-foreground font-medium">{rx.diagnosis}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <Button size="sm" className="w-full min-h-[40px] text-xs" nativeButton={false} render={<Link href={`/doctor/prescriptions/${rx.id}/edit`} className="block" />}>
                    Continue Prescription
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
              </div>
            </div>
          ))}
          {drafts.length === 0 && (
            <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
              <FilePen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="font-medium text-foreground">No draft prescriptions in progress</p>
              <p className="text-xs text-muted-foreground mt-1">Prescriptions you save as drafts appear here.</p>
            </div>
          )}
        </div>

        {/* Desktop & Tablet Table (>= md: 768px) */}
        <div data-search-list className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-card shadow-xs">
          <Table className="min-w-[500px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Patient</TableHead>
                <TableHead>Started On</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((rx) => (
                <TableRow key={rx.id} data-search-key={rx.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Link href={`/doctor/prescriptions/${rx.id}/edit`} className="hover:underline font-semibold text-foreground">
                      {rx.patient.fullName}
                    </Link>
                    <span className="block text-xs text-muted-foreground font-mono">{rx.patient.patientCode}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(rx.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">{rx.diagnosis || "—"}</TableCell>
                  <TableCell>
                    <span className="inline-flex text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Draft
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="h-8 text-xs font-medium shadow-xs" nativeButton={false} render={<Link href={`/doctor/prescriptions/${rx.id}/edit`} />}>
                        Resume
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
              {drafts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                    <FilePen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                    <p className="font-medium text-foreground">No draft prescriptions in progress</p>
                    <p className="text-xs text-muted-foreground mt-1">Prescriptions you save as drafts appear here.</p>
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