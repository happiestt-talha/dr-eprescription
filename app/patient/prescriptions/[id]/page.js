import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PrescriptionView, verifyUrlFor } from "@/components/prescriptions/prescription-view";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { Download } from "lucide-react";
import { isUuid } from "@/lib/rules";

export default async function PatientPrescriptionViewPage({ params }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
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

  // Patients see only their own finalised prescriptions.
  if (!rx || rx.patient.userId !== session.user.id || rx.status !== "finalized") {
    notFound();
  }

  const verifyUrl = await verifyUrlFor(rx.prescriptionCode);

  return (
    <PageShell>
      <Breadcrumbs
        segments={[
          { label: "Prescriptions", href: "/patient/prescriptions" },
          { label: rx.prescriptionCode },
        ]}
      />

      <PageHeader
        className="mx-auto max-w-4xl print:hidden"
        title={`Prescription ${rx.prescriptionCode}`}
        description="A pharmacy can scan this QR code to confirm the prescription is genuine. You can also download it as a PDF."
        actions={
          <Button
            size="touch"
            nativeButton={false}
            render={<a href={`/api/prescriptions/${rx.id}/pdf`} target="_blank" rel="noopener noreferrer" />}
          >
            <Download strokeWidth={1.75} aria-hidden="true" />
            Download PDF
          </Button>
        }
      />

      <PrescriptionView rx={rx} qrSrc={`/api/prescriptions/${rx.id}/qr`} verifyUrl={verifyUrl} />
    </PageShell>
  );
}
