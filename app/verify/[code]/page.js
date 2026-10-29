import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/verify";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { formatDate } from "@/lib/datetime";

// Public page. Codes are sequential and guessable, so patient details are only
// shown (as initials) when the link carries a valid signature from the QR code.
// Unsigned links (e.g. QR codes printed before signing existed) only confirm
// the prescription exists, with doctor and date.

function initials(fullName) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");
}

export default async function VerifyPage({ params, searchParams }) {
  const { code } = await params;
  const { t } = await searchParams;

  const rx = await prisma.prescription.findUnique({
    where: { prescriptionCode: code },
    include: { patient: { select: { fullName: true } }, doctor: { select: { fullName: true } } },
  });

  const valid = rx && rx.status === "finalized";
  const signed = valid && verifyToken(code, t);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Brand Header */}
      <Logo className="mb-6" markClassName="h-9" subtitle="Prescription verification" />

      <div className="max-w-md w-full text-center space-y-5 border border-border/70 rounded-2xl p-6 sm:p-8 bg-card shadow-md">
        {valid ? (
          <>
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="h-9 w-9" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {signed ? "Prescription Verified" : "Prescription On Record"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {signed
                  ? "Authentic digital prescription recorded in clinic database."
                  : "A finalized prescription with this code exists. Scan the QR code on the prescription to see full verification details."}
              </p>
            </div>

            <div className="text-sm bg-muted/40 rounded-xl p-4 space-y-2 text-left border border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Prescription Code:</span>
                <span className="font-mono font-bold text-primary">{rx.prescriptionCode}</span>
              </div>
              {signed && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Patient:</span>
                  <span className="font-medium text-foreground">{initials(rx.patient.fullName)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Doctor:</span>
                <span className="font-medium text-foreground">Dr. {rx.doctor.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Visit Date:</span>
                <span className="font-medium text-foreground">{formatDate(rx.visitDate)}</span>
              </div>
            </div>

            {signed && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified against clinic records</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <XCircle className="h-9 w-9" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Not a Valid Prescription</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Code: <span className="font-mono text-foreground font-semibold">{code}</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/40 p-4 rounded-xl border border-border/40">
              This code doesn&apos;t match any finalized prescription in our electronic health records system. Please check the code or contact the issuing clinic.
            </p>
          </>
        )}
      </div>
    </div>
  );
}