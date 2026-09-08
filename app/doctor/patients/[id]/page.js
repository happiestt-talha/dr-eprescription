import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus } from "lucide-react";

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{patient.fullName}</h1>
          <p className="text-muted-foreground">{patient.patientCode}</p>
        </div>
        <Link href={`/doctor/prescriptions/new?patientId=${patient.id}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Prescription
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 pt-6">
          {details.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-sm">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-medium mb-3">Prescription History</h2>
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
                  <Link href={`/doctor/prescriptions/${rx.id}`}>
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
  );
}