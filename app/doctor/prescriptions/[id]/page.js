import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { PrintButton } from "@/components/prescriptions/print-button";

export default async function PrescriptionViewPage({ params }) {
  const { id } = await params;

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

  if (!rx) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Prescription {rx.prescriptionCode}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground capitalize">{rx.status} · {rx.visitDate.toLocaleDateString()}</p>
        </div>
        <PrintButton className="w-full sm:w-auto min-h-[44px]" />
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Patient</p>
            <p className="font-medium">{rx.patient.fullName} · {rx.patient.patientCode}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Doctor</p>
            <p className="font-medium">Dr. {rx.doctor.fullName} · {rx.doctor.specialization}</p>
          </div>
        </CardContent>
      </Card>

      {rx.vitals && (
        <Card>
          <CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 text-sm">
            {rx.vitals.bloodPressure && <div><p className="text-xs text-muted-foreground uppercase">BP</p><p className="font-medium">{rx.vitals.bloodPressure}</p></div>}
            {rx.vitals.temperatureF && <div><p className="text-xs text-muted-foreground uppercase">Temp</p><p className="font-medium">{rx.vitals.temperatureF}°F</p></div>}
            {rx.vitals.pulseRate && <div><p className="text-xs text-muted-foreground uppercase">Pulse</p><p className="font-medium">{rx.vitals.pulseRate}</p></div>}
            {rx.vitals.spo2 && <div><p className="text-xs text-muted-foreground uppercase">SpO2</p><p className="font-medium">{rx.vitals.spo2}%</p></div>}
            {rx.vitals.heightCm && <div><p className="text-xs text-muted-foreground uppercase">Height</p><p className="font-medium">{rx.vitals.heightCm} cm</p></div>}
            {rx.vitals.weightKg && <div><p className="text-xs text-muted-foreground uppercase">Weight</p><p className="font-medium">{rx.vitals.weightKg} kg</p></div>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          {rx.symptoms && <div><p className="text-xs text-muted-foreground uppercase">Symptoms</p><p>{rx.symptoms}</p></div>}
          {rx.diagnosis && <div><p className="text-xs text-muted-foreground uppercase">Diagnosis</p><p>{rx.diagnosis}</p></div>}
        </CardContent>
      </Card>

      {rx.medicines.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase mb-3">Medicines</p>
            <ul className="space-y-2 text-sm">
              {rx.medicines.map((pm) => (
                <li key={pm.id}>
                  <span className="font-medium">{pm.medicine.name}</span> — {pm.dosage}, {pm.frequency}, {pm.duration}
                  {pm.instructions && <span className="text-muted-foreground"> ({pm.instructions})</span>}
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
                <li key={plt.id}>
                  {plt.labTest.name}
                  {plt.instructions && <span className="text-muted-foreground"> ({plt.instructions})</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {rx.advice && (
        <Card>
          <CardContent className="pt-6 text-sm">
            <p className="text-xs text-muted-foreground uppercase mb-2">Doctor&apos;s Advice</p>
            <p>{rx.advice}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}