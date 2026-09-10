import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";

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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">{patient.fullName}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{patient.patientCode}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Link href={`/doctor/patients/${patient.id}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/doctor/prescriptions/new?patientId=${patient.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">
              <Plus className="mr-2 h-4 w-4" />
              New Prescription
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-8 sm:gap-y-3 pt-6">
          {details.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base sm:text-lg font-medium mb-3">Prescription History</h2>

        {/* Mobile Cards (below md: 768px) */}
        <div className="md:hidden space-y-3">
          {patient.prescriptions.map((rx) => (
            <div key={rx.id} className="border rounded-lg p-4 bg-card space-y-3 shadow-xs">
              {/* Primary identifying info prominently at top */}
              <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                <span className="font-semibold text-sm text-foreground">
                  Prescription #{rx.id.slice(0, 8)}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full capitalize font-medium bg-muted text-muted-foreground">
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
            <div className="text-center text-muted-foreground py-8 border rounded-lg bg-card">
              No prescriptions yet for this patient.
            </div>
          )}
        </div>

        {/* Desktop & Tablet Table (md: 768px+) */}
        <div className="hidden md:block border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patient.prescriptions.map((rx) => (
                <TableRow key={rx.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={rx.status === "draft" ? `/doctor/prescriptions/${rx.id}/edit` : `/doctor/prescriptions/${rx.id}`}
                      className="hover:underline font-medium"
                    >
                      {rx.visitDate.toLocaleDateString()}
                    </Link>
                  </TableCell>
                  <TableCell>{rx.doctor.fullName}</TableCell>
                  <TableCell>{rx.diagnosis || "—"}</TableCell>
                  <TableCell className="capitalize">{rx.status}</TableCell>
                </TableRow>
              ))}
              {patient.prescriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No prescriptions yet for this patient.
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