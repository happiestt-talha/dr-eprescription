import { headers } from "next/headers";
import { LogoMark } from "@/components/brand/logo";
import { StatusBadge } from "@/components/ui/status-badge";
import { buildVerifyUrl } from "@/lib/verify";
import { formatAge, formatDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";

// The on-screen prescription. It mirrors the printed one in
// lib/pdf/prescription-document.js (header rule, patient strip, "Rx" table,
// QR and signature block) so the web view and the PDF read as one document.
// Server component: Prisma Decimals are formatted here and never reach the client.

/**
 * Signed verification URL for a prescription, for the QR caption. Uses the
 * same base as the QR and PDF routes (AUTH_URL, falling back to this request).
 */
export async function verifyUrlFor(code) {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (/^(localhost|127\.)/.test(host) ? "http" : "https");
  return buildVerifyUrl(`${proto}://${host}`, code);
}

const LABEL = "text-xs font-medium uppercase tracking-wider text-muted-foreground";

function vitalsList(v) {
  if (!v) return [];
  const has = (x) => x !== null && x !== undefined && x !== "";
  return [
    has(v.bloodPressure) && ["BP", v.bloodPressure, "mmHg"],
    has(v.pulseRate) && ["Pulse", `${v.pulseRate}`, "bpm"],
    has(v.temperatureF) && ["Temp", `${v.temperatureF}`, "°F"],
    has(v.spo2) && ["SpO₂", `${v.spo2}`, "%"],
    has(v.weightKg) && ["Weight", `${v.weightKg}`, "kg"],
    has(v.heightCm) && ["Height", `${v.heightCm}`, "cm"],
  ].filter(Boolean);
}

function genderLabel(g) {
  return g ? g[0].toUpperCase() + g.slice(1) : "—";
}

function Section({ label, children, className }) {
  return (
    <section className={className}>
      <h2 className={cn(LABEL, "mb-1.5")}>{label}</h2>
      {children}
    </section>
  );
}

function StripItem({ label, children, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

/**
 * @param {object}  props.rx         Prescription with `patient`, `doctor`, `vitals`,
 *                                   `medicines[{ medicine }]` and `labTests[{ labTest }]`.
 * @param {string}  [props.qrSrc]    QR image URL (finalised prescriptions only).
 * @param {string}  [props.verifyUrl] Signed verification URL (from `verifyUrlFor`).
 * @param {string}  [props.followUp] Pre-formatted follow-up date, if any.
 */
export function PrescriptionView({ rx, qrSrc, verifyUrl, followUp, className }) {
  const { doctor, patient } = rx;
  const isDraft = rx.status === "draft";
  const vitals = vitalsList(rx.vitals);
  const verifyLabel = verifyUrl ? `${new URL(verifyUrl).host}/verify` : null;

  return (
    <article
      className={cn(
        "mx-auto w-full max-w-4xl overflow-hidden rounded-lg border bg-card text-card-foreground print:max-w-none print:border-0",
        className
      )}
    >
      {isDraft && (
        <p className="border-b border-warning/40 bg-warning/12 px-5 py-2.5 text-sm text-warning-strong sm:px-10">
          <span className="font-semibold">Draft</span> — not valid until finalised
        </p>
      )}

      <div className="space-y-8 p-5 sm:p-10">
        {/* Header: prescriber on the left, document identity on the right */}
        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <LogoMark className="h-10" bg="var(--card)" />
              <div className="min-w-0 space-y-0.5">
                <p className="text-lg font-semibold leading-tight text-foreground">Dr. {doctor.fullName}</p>
                {doctor.qualification ? <p className="text-sm text-foreground">{doctor.qualification}</p> : null}
                <p className="text-sm text-muted-foreground">
                  {[doctor.specialization, doctor.clinicName].filter(Boolean).join(" · ")}
                </p>
                {doctor.registrationNo ? (
                  <p className="text-xs text-muted-foreground">
                    PMDC Reg. No. <span className="font-mono">{doctor.registrationNo}</span>
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1 sm:flex-col sm:items-end">
              <p className="font-mono text-sm font-medium text-foreground">{rx.prescriptionCode}</p>
              <p className="text-sm text-muted-foreground">{formatDate(rx.visitDate)}</p>
              <StatusBadge status={rx.status} />
            </div>
          </div>
          <div className="mt-5 flex" aria-hidden="true">
            <div className="h-0.5 flex-1 bg-brand-ink dark:bg-primary" />
            <div className="h-0.5 w-14 bg-brand-mint" />
          </div>
        </header>

        {/* Patient strip */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-md border border-l-[3px] border-l-primary px-4 py-3 sm:grid-cols-4">
          <StripItem label="Patient">{patient.fullName}</StripItem>
          <StripItem label="Patient code">
            <span className="font-mono">{patient.patientCode}</span>
          </StripItem>
          <StripItem label="Age / gender">
            <span className="tabular-nums">{formatAge(patient, { at: rx.visitDate })}</span> / {genderLabel(patient.gender)}
          </StripItem>
          <StripItem label="Phone">
            <span className="tabular-nums">{patient.phone || "—"}</span>
          </StripItem>
          {patient.allergies ? (
            <div className="col-span-full border-t pt-2.5">
              <dt className="text-xs font-medium uppercase tracking-wider text-warning-strong">Allergies</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">{patient.allergies}</dd>
            </div>
          ) : null}
        </dl>

        {vitals.length > 0 && (
          <Section label="Vitals">
            <dl className="flex flex-wrap gap-x-6 gap-y-2">
              {vitals.map(([label, value, unit]) => (
                <div key={label} className="flex items-baseline gap-1.5">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium tabular-nums text-foreground">
                    {value}
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {(rx.symptoms || rx.diagnosis) && (
          <div className="grid gap-6 sm:grid-cols-2">
            {rx.symptoms ? (
              <Section label="Symptoms">
                <p className="whitespace-pre-line text-sm text-foreground">{rx.symptoms}</p>
              </Section>
            ) : null}
            {rx.diagnosis ? (
              <Section label="Diagnosis">
                <p className="whitespace-pre-line text-sm font-medium text-foreground">{rx.diagnosis}</p>
              </Section>
            ) : null}
          </div>
        )}

        {rx.medicines.length > 0 && (
          <section aria-labelledby="rx-medicines">
            <div className="mb-3 flex items-end gap-2.5">
              <span
                className="font-display text-4xl italic leading-none text-brand-sage dark:text-brand-mint"
                aria-hidden="true"
              >
                Rx
              </span>
              <h2 id="rx-medicines" className={cn(LABEL, "mb-1")}>
                Medicines
              </h2>
            </div>

            {/* Table from sm up */}
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b-2 border-foreground/15 text-left">
                  <th scope="col" className={cn(LABEL, "w-8 px-3 py-2")}>#</th>
                  <th scope="col" className={cn(LABEL, "px-3 py-2")}>Medicine</th>
                  <th scope="col" className={cn(LABEL, "px-3 py-2")}>Dosage</th>
                  <th scope="col" className={cn(LABEL, "px-3 py-2")}>Frequency</th>
                  <th scope="col" className={cn(LABEL, "px-3 py-2")}>Duration</th>
                  <th scope="col" className={cn(LABEL, "px-3 py-2")}>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {rx.medicines.map((pm, i) => (
                  <tr key={pm.id} className="border-b align-top last:border-b-0 even:bg-muted/50">
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {pm.medicine.name}
                      {pm.medicine.strength ? <span className="font-normal text-muted-foreground"> {pm.medicine.strength}</span> : null}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{pm.dosage}</td>
                    <td className="px-3 py-2.5">{pm.frequency}</td>
                    <td className="px-3 py-2.5 tabular-nums">{pm.duration}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{pm.instructions || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Stacked rows on phones */}
            <ol className="divide-y rounded-md border sm:hidden">
              {rx.medicines.map((pm, i) => (
                <li key={pm.id} className="px-3 py-2.5 text-sm even:bg-muted/50">
                  <p className="font-medium text-foreground">
                    <span className="mr-1.5 tabular-nums text-muted-foreground">{i + 1}.</span>
                    {pm.medicine.name}
                    {pm.medicine.strength ? <span className="font-normal text-muted-foreground"> {pm.medicine.strength}</span> : null}
                  </p>
                  <p className="mt-0.5 tabular-nums text-foreground">
                    {[pm.dosage, pm.frequency, pm.duration].filter(Boolean).join(" · ")}
                  </p>
                  {pm.instructions ? <p className="mt-0.5 text-muted-foreground">{pm.instructions}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        )}

        {rx.labTests.length > 0 && (
          <Section label="Lab tests">
            <ul className="list-disc space-y-1 pl-5 text-sm marker:text-primary">
              {rx.labTests.map((plt) => (
                <li key={plt.id} className="text-foreground">
                  {plt.labTest.name}
                  {plt.instructions ? <span className="text-muted-foreground"> — {plt.instructions}</span> : null}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {(rx.advice || followUp) && (
          <Section label="Doctor's advice">
            {rx.advice ? <p className="whitespace-pre-line text-sm text-foreground">{rx.advice}</p> : null}
            {followUp ? (
              <p className="mt-2 text-sm text-foreground">
                <span className="text-muted-foreground">Follow-up</span> {followUp}
              </p>
            ) : null}
          </Section>
        )}

        {/* QR and signature */}
        <footer className="flex flex-col gap-8 border-t pt-6 sm:flex-row sm:items-end sm:justify-between">
          {qrSrc ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image, not optimisable */}
              <img
                src={qrSrc}
                alt={`QR code to check prescription ${rx.prescriptionCode}`}
                className="size-24 shrink-0 rounded-md border bg-white p-2"
              />
              <div className="space-y-1 text-sm">
                <p className="text-foreground">
                  Scan to check this prescription
                  {verifyLabel ? (
                    <>
                      {" "}at{" "}
                      <a href={verifyUrl} className="font-medium underline-offset-4 hover:underline">
                        {verifyLabel}
                      </a>
                    </>
                  ) : null}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{rx.prescriptionCode}</p>
              </div>
            </div>
          ) : isDraft ? (
            <p className="text-sm text-muted-foreground">The QR code is added when the prescription is finalised.</p>
          ) : (
            <span />
          )}
          <div className="w-full max-w-56 self-end text-center sm:self-auto">
            <div className="mb-1.5 border-t border-foreground/50" />
            <p className="text-sm font-medium text-foreground">Dr. {doctor.fullName}</p>
            <p className="text-xs text-muted-foreground">Signature & stamp</p>
          </div>
        </footer>
      </div>
    </article>
  );
}
