import { prisma } from "@/lib/db";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function VerifyPage({ params }) {
  const { code } = await params;

  const rx = await prisma.prescription.findUnique({
    where: { prescriptionCode: code },
    include: { patient: true, doctor: true },
  });

  const valid = rx && rx.status === "finalized";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-muted/20">
      <div className="max-w-sm w-full text-center space-y-4 border rounded-xl p-6 sm:p-8 bg-card shadow-sm">
        {valid ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h1 className="text-xl font-semibold">Prescription Verified</h1>
            <div className="text-sm text-muted-foreground space-y-1 text-left">
              <p><span className="font-medium text-foreground">Code:</span> {rx.prescriptionCode}</p>
              <p><span className="font-medium text-foreground">Patient:</span> {rx.patient.fullName}</p>
              <p><span className="font-medium text-foreground">Doctor:</span> Dr. {rx.doctor.fullName}</p>
              <p><span className="font-medium text-foreground">Date:</span> {rx.visitDate.toLocaleDateString()}</p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
            <h1 className="text-xl font-semibold">Not a Valid Prescription</h1>
            <p className="text-sm text-muted-foreground">
              This code doesn&apos;t match any finalized prescription in our system.
            </p>
          </>
        )}
      </div>
    </div>
  );
}