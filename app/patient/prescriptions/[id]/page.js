import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Download, Stethoscope, Pill, CheckCircle2, HeartPulse, FileText } from "lucide-react";

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
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0">
      <Breadcrumbs
        segments={[
          { label: "Prescriptions", href: "/patient/prescriptions" },
          { label: rx.prescriptionCode },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Prescription {rx.prescriptionCode}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Visit Date: {rx.visitDate.toLocaleDateString()}
          </p>
        </div>
        <a href={`/api/prescriptions/${rx.id}/pdf`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px] shadow-xs">
            <Download className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Download PDF
          </Button>
        </a>
      </div>

      {/* Verification Card */}
      <Card className="border-border/60 shadow-xs bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <img
            src={`/api/prescriptions/${rx.id}/qr`}
            alt="Verification QR code"
            className="h-28 w-28 border rounded-xl shrink-0 bg-white p-1 shadow-xs"
          />
          <div className="space-y-2 w-full sm:w-auto flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <span className="font-semibold text-sm">Official E-Prescription</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This prescription is digitally verified. You can present the QR code to any participating pharmacy or download the official PDF copy.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Card */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4 sm:p-6 text-sm">
          <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground uppercase font-semibold">
            <Stethoscope className="h-3.5 w-3.5 text-primary" />
            Prescribed By
          </div>
          <p className="font-bold text-base text-foreground">Dr. {rx.doctor.fullName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rx.doctor.specialization} · {rx.doctor.clinicName}
          </p>
        </CardContent>
      </Card>

      {/* Diagnosis */}
      {rx.diagnosis && (
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-6 text-sm">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Diagnosis</p>
            <p className="text-foreground bg-muted/30 p-3 rounded-lg border border-border/40 font-medium">{rx.diagnosis}</p>
          </CardContent>
        </Card>
      )}

      {/* Medicines */}
      {rx.medicines.length > 0 && (
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
      )}

      {/* Lab Tests */}
      {rx.labTests.length > 0 && (
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">Ordered Lab Tests</p>
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
      )}

      {/* Doctor's Advice */}
      {rx.advice && (
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-6 text-sm">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1.5">Doctor&apos;s Advice & Instructions</p>
            <div className="text-foreground bg-muted/30 p-3 rounded-lg border border-border/40 whitespace-pre-wrap">
              {rx.advice}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}