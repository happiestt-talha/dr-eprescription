import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/verify";
import { Check, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { formatDate } from "@/lib/datetime";
import { firstParam } from "@/lib/utils";

// Public page. Codes are sequential and guessable, so patient details are only
// shown (as initials) when the link carries a valid signature from the QR code.
// Unsigned links (e.g. QR codes printed before signing existed) only confirm
// the prescription exists, with doctor, clinic and date.

function initials(fullName) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t px-5 py-3 first:border-t-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

export default async function VerifyPage({ params, searchParams }) {
  const { code } = await params;
  const t = firstParam((await searchParams).t);

  const rx = await prisma.prescription.findUnique({
    where: { prescriptionCode: code },
    include: {
      patient: { select: { fullName: true } },
      doctor: { select: { fullName: true, clinicName: true } },
    },
  });

  const valid = rx && rx.status === "finalized";
  const signed = valid && verifyToken(code, t);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-12 sm:py-20">
      <div className="w-full max-w-lg space-y-8">
        <Logo markClassName="h-9" subtitle="Prescription verification" />

        <section className="overflow-hidden rounded-lg border bg-card">
          {valid ? (
            <>
              <div className="bg-success/12 px-5 py-3 text-success-strong">
                <h1 className="flex items-center gap-2 font-semibold">
                  <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                  Valid prescription
                </h1>
                <p className="mt-0.5 text-sm">
                  {signed
                    ? `Issued by ${rx.doctor.clinicName || "the clinic"} and matches its records.`
                    : "A finalised prescription with this code exists. Scan the QR code on the prescription to see the patient's initials."}
                </p>
              </div>
              <dl>
                <Row label="Prescription code">
                  <span className="font-mono">{rx.prescriptionCode}</span>
                </Row>
                {signed && <Row label="Patient">{initials(rx.patient.fullName)}</Row>}
                <Row label="Prescribed by">Dr. {rx.doctor.fullName}</Row>
                {rx.doctor.clinicName ? <Row label="Clinic">{rx.doctor.clinicName}</Row> : null}
                <Row label="Date">{formatDate(rx.visitDate)}</Row>
              </dl>
            </>
          ) : (
            <>
              <div className="bg-destructive/10 px-5 py-3 text-destructive-strong">
                <h1 className="flex items-center gap-2 font-semibold">
                  <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
                  Not a valid prescription
                </h1>
              </div>
              <div className="space-y-3 px-5 py-4 text-sm">
                <p className="text-foreground">
                  This code doesn&apos;t match any finalised prescription. Check the code or contact the clinic that issued it.
                </p>
                <p className="text-muted-foreground">
                  Code <span className="font-mono text-foreground">{code}</span>
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
