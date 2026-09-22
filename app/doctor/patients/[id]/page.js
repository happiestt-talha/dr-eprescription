import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PatientProfileTabs } from "@/components/doctor/patient-tabs";
import { Plus, Pencil, FileText, Calendar, User, Activity } from "lucide-react";

export default async function PatientProfilePage({ params }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      prescriptions: {
        include: { doctor: true },
        orderBy: { visitDate: "desc" },
      },
    },
  });

  if (!patient) notFound();

  const details = [
    ["Patient ID", patient.patientCode],
    ["Gender", patient.gender],
    ["Age", patient.age ?? "—"],
    ["Phone", patient.phone],
    ["Blood Group", patient.bloodGroup || "—"],
    ["CNIC", patient.cnic || "—"],
    ["Emergency Contact", patient.emergencyContact || "—"],
    ["Allergies", patient.allergies || "None recorded"],
    ["Existing Diseases", patient.existingDiseases || "None recorded"],
  ];

  const profileContent = (
    <Card className="border-border/60 shadow-xs">
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-4 pt-6">
        {details.map(([label, value]) => (
          <div key={label} className="p-3 rounded-lg bg-muted/30 border border-border/40">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
            <p className="text-sm font-medium mt-1 text-foreground">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const historyContent = (
    <div className="space-y-3">
      {/* Mobile Cards (below md: 768px) */}
      <div className="md:hidden space-y-3">
        {patient.prescriptions.map((rx) => (
          <div key={rx.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
            {/* Primary identifying info prominently at top */}
            <div className="flex items-center justify-between gap-2 border-b pb-2.5">
              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" strokeWidth={1.75} />
                Prescription #{rx.id.slice(0, 8)}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${
                rx.status === "finalized"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}>
                {rx.status}
              </span>
            </div>

            {/* Stacked Label: Value lines */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Visit Date:</span>
                <span className="font-medium text-foreground">{rx.visitDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Doctor:</span>
                <span className="font-medium text-foreground">Dr. {rx.doctor.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Diagnosis:</span>
                <span className="font-medium text-foreground">{rx.diagnosis || "—"}</span>
              </div>
            </div>

            {/* Row-level action at bottom of card with min 44x44px touch target */}
            <div className="pt-2 border-t">
              <Link
                href={rx.status === "draft" ? `/doctor/prescriptions/${rx.id}/edit` : `/doctor/prescriptions/${rx.id}`}
                className="block"
              >
                <Button variant="outline" size="sm" className="w-full min-h-[44px] justify-center text-xs font-medium">
                  {rx.status === "draft" ? "Edit Draft" : "View Prescription"}
                </Button>
              </Link>
            </div>
          </div>
        ))}
        {patient.prescriptions.length === 0 && (
          <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm font-medium">No prescriptions yet for this patient.</p>
          </div>
        )}
      </div>

      {/* Desktop & Tablet Table (md: 768px+) */}
      <div className="hidden md:block border border-border/60 rounded-xl overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Date</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patient.prescriptions.map((rx) => (
              <TableRow key={rx.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  {rx.visitDate.toLocaleDateString()}
                </TableCell>
                <TableCell>Dr. {rx.doctor.fullName}</TableCell>
                <TableCell>{rx.diagnosis || "—"}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                    rx.status === "finalized"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}>
                    {rx.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={rx.status === "draft" ? `/doctor/prescriptions/${rx.id}/edit` : `/doctor/prescriptions/${rx.id}`}
                  >
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10">
                      {rx.status === "draft" ? "Edit Draft" : "View"}
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {patient.prescriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No prescriptions yet for this patient.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <Breadcrumbs
        segments={[
          { label: "Patients", href: "/doctor/patients" },
          { label: patient.fullName },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{patient.fullName}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">{patient.patientCode}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Link href={`/doctor/patients/${patient.id}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
              <Pencil className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Edit
            </Button>
          </Link>
          <Link href={`/doctor/prescriptions/new?patientId=${patient.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">
              <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
              New Prescription
            </Button>
          </Link>
        </div>
      </div>

      <PatientProfileTabs
        profileContent={profileContent}
        historyContent={historyContent}
        historyCount={patient.prescriptions.length}
      />
    </div>
  );
}