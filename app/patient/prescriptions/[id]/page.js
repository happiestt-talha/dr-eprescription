import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default async function PatientPrescriptionViewPage({ params }) {
  const { id } = await params;
  const session = await auth();

  const rx = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
      vitals: true,
      medicines: { include: { medicine: true } },
      labTests: { include: { labTest: true } },
    },
  });

  if (!rx || rx.patient.userId !== session.user.id || rx.status !== "finalized") {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Prescription {rx.prescriptionCode}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{rx.visitDate.toLocaleDateString()}</p>
        </div>
        <a href={`/api/prescriptions/${rx.id}/pdf`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px]">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </a>
      </div>

      <Card>
        <CardContent className="pt-6 text-sm">
          <p className="text-xs text-muted-foreground uppercase">Doctor</p>
          <p>Dr. {rx.doctor.fullName} · {rx.doctor.specialization}</p>
        </CardContent>
      </Card>

      {rx.diagnosis && (
        <Card>
          <CardContent className="pt-6 text-sm">
            <p className="text-xs text-muted-foreground uppercase">Diagnosis</p>
            <p>{rx.diagnosis}</p>
          </CardContent>
        </Card>
      )}

      {rx.medicines.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase mb-3">Medicines</p>
            <ul className="space-y-2 text-sm">
              {rx.medicines.map((pm) => (
                <li key={pm.id}>
                  <span className="font-medium">{pm.medicine.name}</span> — {pm.dosage}, {pm.frequency}, {pm.duration}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {rx.labTests.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase mb-3">Laboratory Tests</p>
            <ul className="space-y-2 text-sm">
              {rx.labTests.map((plt) => (
                <li key={plt.id}>{plt.labTest.name}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {rx.advice && (
        <Card>
          <CardContent className="pt-6 text-sm">
            <p className="text-xs text-muted-foreground uppercase mb-2">Advice</p>
            <p>{rx.advice}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}