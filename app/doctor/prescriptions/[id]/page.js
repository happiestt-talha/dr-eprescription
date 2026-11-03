import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentDoctor } from "@/lib/auth-guards";
import { PrintButton } from "@/components/prescriptions/print-button";
import { PrescriptionView, verifyUrlFor } from "@/components/prescriptions/prescription-view";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { Download, Pencil } from "lucide-react";
import { isUuid } from "@/lib/rules";

export default async function PrescriptionViewPage({ params }) {
  const { id } = await params;
  const doctor = await getCurrentDoctor();
  if (!doctor) return null; // layout shows the "profile not set up" message
  if (!isUuid(id)) notFound();

  // Scoped to the signed-in doctor: other doctors' prescriptions 404.
  const rx = await prisma.prescription.findFirst({
    where: { id, doctorId: doctor.id },
    include: {
      patient: true,
      doctor: true,
      vitals: true,
      medicines: { include: { medicine: true } },
      labTests: { include: { labTest: true } },
    },
  });

  if (!rx) notFound();

  const finalised = rx.status === "finalized";
  // Drafts get no QR or verification link (the QR route 404s for them).
  const verifyUrl = finalised ? await verifyUrlFor(rx.prescriptionCode) : null;

  return (
    <PageShell>
      <Breadcrumbs
        segments={[
          { label: "Patients", href: "/doctor/patients" },
          { label: rx.patient.fullName, href: `/doctor/patients/${rx.patientId}` },
          { label: rx.prescriptionCode },
        ]}
      />

      <PageHeader
        className="mx-auto max-w-4xl print:hidden"
        title={`Prescription ${rx.prescriptionCode}`}
        description={rx.patient.fullName}
        actions={
          <>
            {!finalised && (
              <Button size="touch" nativeButton={false} render={<Link href={`/doctor/prescriptions/${rx.id}/edit`} />}>
                <Pencil strokeWidth={1.75} aria-hidden="true" />
                Edit
              </Button>
            )}
            <Button
              size="touch"
              variant={finalised ? "default" : "outline"}
              nativeButton={false}
              render={<a href={`/api/prescriptions/${rx.id}/pdf`} target="_blank" rel="noopener noreferrer" />}
            >
              <Download strokeWidth={1.75} aria-hidden="true" />
              Download PDF
            </Button>
            <PrintButton className="h-11 px-4 md:h-9 md:px-3" />
          </>
        }
      />

      <PrescriptionView
        rx={rx}
        qrSrc={finalised ? `/api/prescriptions/${rx.id}/qr` : null}
        verifyUrl={verifyUrl}
      />
    </PageShell>
  );
}
