import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { PrintButton } from "@/components/prescriptions/print-button";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PrescriptionViewTabs } from "@/components/doctor/prescription-tabs";
import { Download, CheckCircle2, User, Stethoscope, HeartPulse, Pill, FileText } from "lucide-react";

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
  if (rx.status === "draft") redirect(`/doctor/prescriptions/${id}/edit`);

  const overviewCard = (
    <div className="space-y-4">
      {rx.status === "finalized" && (
        <Card className="border-border/60 shadow-xs bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            <img
              src={`/api/prescriptions/${rx.id}/qr`}
              alt="Verification QR code"
              className="h-28 w-28 border rounded-xl shrink-0 bg-white p-1 shadow-xs"
            />
            <div className="space-y-3 w-full sm:w-auto flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="font-semibold text-sm">Verified & Finalized</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Scan QR to verify authenticity online, or download printable PDF.
              </p>
              <a href={`/api/prescriptions/${rx.id}/pdf`} target="_blank" rel="noopener noreferrer" className="inline-block w-full sm:w-auto">
                <Button className="w-full sm:w-auto min-h-[40px] text-xs sm:text-sm">
                  <Download className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  Download PDF
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground uppercase font-semibold">
              <User className="h-3.5 w-3.5 text-primary" />
              Patient Details
            </div>
            <p className="font-semibold text-foreground">{rx.patient.fullName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">ID: {rx.patient.patientCode} · Age: {rx.patient.age || "—"} · Gender: {rx.patient.gender}</p>
          </div>
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground uppercase font-semibold">
              <Stethoscope className="h-3.5 w-3.5 text-primary" />
              Prescribing Doctor
            </div>
            <p className="font-semibold text-foreground">Dr. {rx.doctor.fullName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{rx.doctor.specialization} · Reg #{rx.doctor.licenseNumber || "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const vitalsContent = (rx.vitals || rx.symptoms || rx.diagnosis || rx.advice) ? (
    <div className="space-y-4">
      {rx.vitals && (
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground uppercase font-semibold">
              <HeartPulse className="h-4 w-4 text-rose-500" />
              Patient Vitals
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-sm">
              {rx.vitals.bloodPressure && (
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/40">
                  <p className="text-xs text-muted-foreground">Blood Pressure</p>
                  <p className="font-semibold mt-0.5">{rx.vitals.bloodPressure}</p>
                </div>
              )}
              {rx.vitals.temperatureF && (
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/40">
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className="font-semibold mt-0.5">{rx.vitals.temperatureF.toString()}°F</p>
                </div>
              )}
              {rx.vitals.pulseRate && (
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/40">
                  <p className="text-xs text-muted-foreground">Pulse</p>
                  <p className="font-semibold mt-0.5">{rx.vitals.pulseRate} bpm</p>
                </div>
              )}
              {rx.vitals.spo2 && (
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/40">
                  <p className="text-xs text-muted-foreground">SpO2</p>
                  <p className="font-semibold mt-0.5">{rx.vitals.spo2.toString()}%</p>
                </div>
              )}
              {rx.vitals.heightCm && (
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/40">
                  <p className="text-xs text-muted-foreground">Height</p>
                  <p className="font-semibold mt-0.5">{rx.vitals.heightCm.toString()} cm</p>
                </div>
              )}
              {rx.vitals.weightKg && (
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/40">
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="font-semibold mt-0.5">{rx.vitals.weightKg.toString()} kg</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4 sm:p-6 space-y-3 text-sm">
          {rx.symptoms && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Symptoms</p>
              <p className="text-foreground bg-muted/30 p-2.5 rounded-md border border-border/40">{rx.symptoms}</p>
            </div>
          )}
          {rx.diagnosis && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Diagnosis</p>
              <p className="text-foreground bg-muted/30 p-2.5 rounded-md border border-border/40 font-medium">{rx.diagnosis}</p>
            </div>
          )}
          {rx.advice && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Doctor&apos;s Advice</p>
              <p className="text-foreground bg-muted/30 p-2.5 rounded-md border border-border/40">{rx.advice}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  ) : null;

  const medicinesContent = rx.medicines.length > 0 ? (
    <Card className="border-border/60 shadow-xs">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground uppercase font-semibold">
          <Pill className="h-4 w-4 text-primary" />
          Prescribed Medications ({rx.medicines.length})
        </div>
        <div className="divide-y divide-border/60">
          {rx.medicines.map((pm, idx) => (
            <div key={pm.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-sm text-foreground">{pm.medicine.name}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-7 mt-0.5">
                  {pm.dosage} · {pm.frequency} · {pm.duration}
                </p>
              </div>
              {pm.instructions && (
                <div className="ml-7 sm:ml-0 text-xs px-2.5 py-1 rounded bg-muted text-muted-foreground max-w-xs">
                  {pm.instructions}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ) : null;

  const testsContent = rx.labTests.length > 0 ? (
    <Card className="border-border/60 shadow-xs">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground uppercase font-semibold">
          <Stethoscope className="h-4 w-4 text-primary" />
          Ordered Laboratory Tests ({rx.labTests.length})
        </div>
        <div className="space-y-2">
          {rx.labTests.map((plt) => (
            <div key={plt.id} className="p-3 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between">
              <span className="font-medium text-sm text-foreground">{plt.labTest.name}</span>
              {plt.instructions && (
                <span className="text-xs text-muted-foreground">{plt.instructions}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ) : null;

  const fullContent = (
    <div className="space-y-4">
      {overviewCard}
      {vitalsContent}
      {medicinesContent}
      {testsContent}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4 sm:space-y-6 w-full min-w-0">
      <Breadcrumbs
        segments={[
          { label: "Prescriptions", href: "/doctor/prescriptions" },
          { label: rx.prescriptionCode },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Prescription {rx.prescriptionCode}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground capitalize mt-0.5">
            {rx.status} · {rx.visitDate.toLocaleDateString()}
          </p>
        </div>
        <PrintButton className="w-full sm:w-auto min-h-[44px]" />
      </div>

      <PrescriptionViewTabs
        overviewContent={fullContent}
        medicinesContent={medicinesContent}
        vitalsContent={vitalsContent}
        testsContent={testsContent}
      />
    </div>
  );
}