"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPatient, updatePatient } from "@/lib/actions/patients";
import { checkPatientUnique } from "@/lib/actions/lookup";
import { DuplicateNotice, UniqueStatus, useUniqueCheck } from "@/components/ui/unique-check";
import { Button } from "@/components/ui/button";
import { ChoiceGroup, CnicInput, EmailInput, MeasureInput, NameInput, PhoneInput, TextArea, TextInput } from "@/components/ui/form-inputs";
import { Form, FormStatus, SubmitButton } from "@/components/ui/form";
import { LIMITS } from "@/lib/rules";
import { checkMeasure, MEASURES } from "@/lib/sanitize";
import { DatePicker } from "@/components/ui/date-picker";
import { QuickChips } from "@/components/ui/suggest-input";
import { ALLERGY_CHIPS, CONDITION_CHIPS } from "@/lib/clinical-vocab";
import { Field, FormActions, FormSection } from "@/components/ui/form-layout";
import { BLOOD_GROUPS, bmi, formatPhoneDisplay, normalizeCnic, normalizePhonePK } from "@/lib/sanitize";
import { ageFromDob, calendarKeyOf, clinicDateKey, estimatedDobKey } from "@/lib/datetime";
import { CalendarPlus, Check, Copy, FilePlus2 } from "lucide-react";

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const BLOOD_GROUP_OPTIONS = [{ value: "", label: "Unknown" }, ...BLOOD_GROUPS.map((g) => ({ value: g, label: g }))];

const FIELD = "h-11 md:h-10";

// Only ask the server once the value is a complete phone / CNIC.
const phoneComplete = (v) => Boolean(normalizePhonePK(v));
const cnicComplete = (v) => Boolean(normalizeCnic(v));

/** Amber note when weight and height together give an implausible BMI. */
function bmiWarning(heightCm, weightKg) {
  const value = bmi(heightCm, weightKg);
  return value !== null && (value < 12 || value > 60) ? `BMI ${value} looks unusual for this height. Please double-check.` : "";
}


function AgeBadge({ years, estimated }) {
  if (years === null || years === undefined) {
    return <span className="truncate text-xs text-muted-foreground">Age: auto</span>;
  }
  return (
    <span className="shrink-0 text-xs font-semibold text-primary" aria-live="polite">
      {estimated ? "≈ " : ""}
      {years} {years === 1 ? "year" : "years"} old
    </span>
  );
}

function CopyValue({ label, value, display, accent }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 truncate font-mono tabular-nums text-foreground ${accent ? "text-2xl font-medium tracking-wide" : "text-base"}`}>{display ?? value}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            /* clipboard blocked: the value is still visible */
          }
        }}>
        {copied ? <Check className="text-success-strong" /> : <Copy />}
      </Button>
    </div>
  );
}

export function PatientForm({ redirectBase = "/doctor/patients", mode = "create", patientId, initialValues = {} }) {
  const router = useRouter();
  const [result, setResult] = useState(null);

  // Age always comes from the date of birth; an approximate age is stored as 1 Jan of that year.
  const [dobMode, setDobMode] = useState(initialValues.dobEstimated ? "approx" : "exact");
  const [dob, setDob] = useState(initialValues.dobEstimated ? "" : calendarKeyOf(initialValues.dateOfBirth));
  const [approxAge, setApproxAge] = useState(
    initialValues.dobEstimated && initialValues.dateOfBirth ? String(ageFromDob(initialValues.dateOfBirth)) : ""
  );
  // Phone and CNIC are unique: check them as soon as they're complete, so
  // staff can jump to the existing patient instead of filling in the form.
  const portal = redirectBase.startsWith("/receptionist") ? "receptionist" : "doctor";
  const excludeId = mode === "edit" ? patientId : undefined;
  const phoneCheck = useUniqueCheck(checkPatientUnique, {
    field: "phone",
    excludeId,
    isComplete: phoneComplete,
    initialValue: initialValues.phone ? formatPhoneDisplay(initialValues.phone) : "",
  });
  const cnicCheck = useUniqueCheck(checkPatientUnique, { field: "cnic", excludeId, isComplete: cnicComplete, initialValue: initialValues.cnic || "" });
  const duplicateFound = mode === "create" && (phoneCheck.status === "found" || cnicCheck.status === "found");

  function duplicateNotice(check, what) {
    if (check.status !== "found") return null;
    const { match, otherAccount } = check.result;
    if (otherAccount) {
      return (
        <DuplicateNotice
          className="col-span-full"
          title={`This ${what} is already used by another account`}
          note="It can't be used for a new patient login. Check the number, or ask an admin."
        />
      );
    }
    const profileHref = `${redirectBase}/${match.id}`;
    const primary =
      mode === "edit" ? null : portal === "receptionist" ? (
        <Button nativeButton={false} render={<Link href={`/receptionist/appointments/new?patientId=${match.id}`} />} size="touch">
          <CalendarPlus className="size-4" /> Book appointment
        </Button>
      ) : (
        <Button nativeButton={false} render={<Link href={`/doctor/prescriptions/new?patientId=${match.id}`} />} size="touch">
          <FilePlus2 className="size-4" /> Start prescription
        </Button>
      );
    return (
      <DuplicateNotice
        className="col-span-full"
        title={mode === "edit" ? `This ${what} belongs to another patient` : `Already registered with this ${what}`}
        name={match.fullName}
        meta={`${match.patientCode} · ${match.gender} · ${match.ageLabel}`}
        actions={
          <>
            {primary}
            <Button variant="outline" nativeButton={false} render={<Link href={profileHref} />} size="touch">
              Open profile
            </Button>
          </>
        }
      />
    );
  }

  const [heightCm, setHeightCm] = useState(String(initialValues.heightCm ?? ""));
  const [weightKg, setWeightKg] = useState(String(initialValues.weightKg ?? ""));

  const approxValid = Boolean(approxAge) && !checkMeasure(approxAge, MEASURES.approxAge)?.error;
  const ageYears = dobMode === "exact" ? (dob ? ageFromDob(dob) : null) : approxValid ? +approxAge : null;

  // The <Form> controller validates every field inline first; this only runs
  // when the browser-side rules pass. Server field errors land on the fields.
  async function handleSubmit(formData) {
    if (mode === "edit") {
      const res = await updatePatient(patientId, formData);
      // Stays pending while navigating, so the form can't be submitted twice.
      if (!res?.error) router.push(`${redirectBase}/${patientId}`);
      return res;
    }
    const res = await createPatient(formData);
    if (!res?.error) setResult(res);
    return res;
  }

  if (result) {
    return (
      <div className="space-y-5">
        <section className="max-w-2xl rounded-lg border border-l-4 border-l-success bg-card">
          <div className="px-5 pt-5 pb-4 sm:px-6">
            <h2 className="text-base font-semibold text-foreground">Patient registered</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Give the patient these portal sign-in details now. The password is shown only once.
            </p>
          </div>
          <div className="divide-y border-t">
            <CopyValue label="Temporary password" value={result.credentials.tempPassword} accent />
            <CopyValue label="Username (phone)" value={result.credentials.username} display={formatPhoneDisplay(result.credentials.username)} />
          </div>
        </section>
        <FormActions sticky={false}>
          <Button size="touch" onClick={() => router.push(`${redirectBase}/${result.patientId}`)}>
            Continue to patient profile
          </Button>
        </FormActions>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <FormSection
        title="Contact & identification"
        description="We check the phone and CNIC as you type to catch patients who are already registered.">
        <Field
          label="Phone number"
          htmlFor="phone"
          required
          labelAside={<UniqueStatus status={phoneCheck.status} />}
          hint={mode === "edit" ? "Changing it also changes what the patient signs in with." : "Also the patient's login username."}>
          <PhoneInput id="phone" name="phone" label="Phone number" defaultValue={initialValues.phone || ""} required onValueChange={phoneCheck.check} aria-describedby="phone-hint" className={FIELD} />
        </Field>

        <Field label="CNIC / national ID" htmlFor="cnic" labelAside={<UniqueStatus status={cnicCheck.status} />}>
          <CnicInput id="cnic" name="cnic" defaultValue={initialValues.cnic || ""} onValueChange={cnicCheck.check} className={FIELD} />
        </Field>

        <Field label="Email address" htmlFor="email">
          <EmailInput id="email" name="email" placeholder="patient@example.com" defaultValue={initialValues.email || ""} className={FIELD} />
        </Field>

        {duplicateNotice(phoneCheck, "phone number")}
        {cnicCheck.result?.match?.id !== phoneCheck.result?.match?.id || phoneCheck.status !== "found" ? duplicateNotice(cnicCheck, "CNIC") : null}

        <Field label="Emergency contact phone" htmlFor="emergencyContact">
          <PhoneInput id="emergencyContact" name="emergencyContact" placeholder="0300-7654321" defaultValue={initialValues.emergencyContact || ""} className={FIELD} />
        </Field>

        <Field label="Home address" htmlFor="address" className="sm:col-span-full xl:col-span-2">
          <TextInput id="address" name="address" label="Address" maxLength={LIMITS.address} autoComplete="street-address" placeholder="House #, street, city" defaultValue={initialValues.address || ""} className={FIELD} />
        </Field>
      </FormSection>

      <FormSection title="Personal details" description="Age is calculated from the date of birth.">
        <Field label="Full name" htmlFor="fullName" required span="full">
          <NameInput id="fullName" name="fullName" label="Full name" placeholder="e.g. Muhammad Ali" defaultValue={initialValues.fullName || ""} required className={FIELD} />
        </Field>

        <Field label="Father / husband name" htmlFor="fatherHusbandName">
          <NameInput id="fatherHusbandName" name="fatherHusbandName" placeholder="e.g. Ahmed Ali" defaultValue={initialValues.fatherHusbandName || ""} className={FIELD} />
        </Field>

        <Field label="Gender" name="gender" required>
          <ChoiceGroup name="gender" label="Gender" options={GENDERS} defaultValue={initialValues.gender} required />
        </Field>

        <div className="min-w-0">
          <input type="hidden" name="dobMode" value={dobMode} />
          {dobMode === "exact" ? (
            <Field
              label="Date of birth"
              htmlFor="dateOfBirth"
              required
              labelAside={<AgeBadge years={ageYears} />}
              hint={
                <button
                  type="button"
                  onClick={() => setDobMode("approx")}
                  className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded">
                  Don&apos;t know it? Enter approximate age
                </button>
              }>
              <DatePicker
                id="dateOfBirth"
                name="dateOfBirth"
                value={dob}
                onValueChange={setDob}
                min="1900-01-01"
                max={clinicDateKey()}
                required
                placeholder="Select date of birth"
              />
            </Field>
          ) : (
            <Field
              label="Approximate age"
              htmlFor="approxAge"
              required
              labelAside={<AgeBadge years={ageYears} estimated />}
              hint={
                <span>
                  Saved as an estimated birth date ({approxValid ? estimatedDobKey(+approxAge).slice(0, 4) : "year"}), so the age stays correct over time.{" "}
                  <button
                    type="button"
                    onClick={() => setDobMode("exact")}
                    className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded">
                    Enter the exact date instead
                  </button>
                </span>
              }>
              <div>
                <MeasureInput
                  measure="approxAge"
                  id="approxAge"
                  name="approxAge"
                  required
                  placeholder="e.g. 65"
                  defaultValue={approxAge}
                  onValueChange={setApproxAge}
                  aria-describedby="approxAge-hint"
                  className={FIELD}
                />
              </div>
            </Field>
          )}
        </div>
      </FormSection>

      <FormSection title="Medical baseline" description="Optional, but helps the doctor at the first visit.">
        <Field label="Blood group" name="bloodGroup" span="full">
          <ChoiceGroup name="bloodGroup" label="Blood group" options={BLOOD_GROUP_OPTIONS} defaultValue={initialValues.bloodGroup || ""} size="sm" />
        </Field>

        <Field label="Height" htmlFor="heightCm">
          <MeasureInput measure="heightCm" id="heightCm" name="heightCm" placeholder="e.g. 170 or 5'7" defaultValue={heightCm} onValueChange={setHeightCm} className={FIELD} />
        </Field>

        <Field label="Weight" htmlFor="weightKg">
          <MeasureInput measure="weightKg" id="weightKg" name="weightKg" placeholder="e.g. 68" defaultValue={weightKg} onValueChange={setWeightKg} extraWarn={(w) => bmiWarning(heightCm, w)} className={FIELD} />
        </Field>

        <div className="col-span-full grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Field label="Known drug allergies" htmlFor="allergies">
          <TextArea id="allergies" name="allergies" label="Allergies" rows={2} maxLength={LIMITS.note} placeholder="e.g. Penicillin, NSAIDs (or 'None')" defaultValue={initialValues.allergies || ""} />
          <QuickChips targetId="allergies" chips={ALLERGY_CHIPS} />
        </Field>

        <Field label="Existing chronic conditions" htmlFor="existingDiseases">
          <TextArea id="existingDiseases" name="existingDiseases" label="Existing conditions" rows={2} maxLength={LIMITS.note} placeholder="e.g. Hypertension, type 2 diabetes" defaultValue={initialValues.existingDiseases || ""} />
          <QuickChips targetId="existingDiseases" chips={CONDITION_CHIPS} />
        </Field>
        </div>
      </FormSection>

      <FormStatus
        action={(res) =>
          res?.existingPatientId && (
            <Link href={`${redirectBase}/${res.existingPatientId}`} className="font-semibold text-primary underline underline-offset-4">
              Go to the existing patient&apos;s profile →
            </Link>
          )
        }
      />

      <FormActions>
        <Button type="button" variant="outline" className="h-11 px-5" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton disabled={duplicateFound} pendingText={mode === "edit" ? "Saving…" : "Registering…"} className="h-11 px-6">
          {duplicateFound ? "Already registered" : mode === "edit" ? "Save changes" : "Register patient"}
        </SubmitButton>
      </FormActions>
    </Form>
  );
}
