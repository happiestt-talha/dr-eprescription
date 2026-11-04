"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createDoctor, updateDoctor } from "@/lib/actions/doctors";
import { checkDoctorUnique } from "@/lib/actions/lookup";
import { DuplicateNotice, UniqueStatus, useUniqueCheck } from "@/components/ui/unique-check";
import { isValidEmail } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeInput, EmailInput, NameInput, PasswordInput, PhoneInput, TextInput, TitleInput } from "@/components/ui/form-inputs";
import { Field, FormActions, FormSection } from "@/components/ui/form-layout";
import { Form, FormStatus, SubmitButton } from "@/components/ui/form";
import { LIMITS } from "@/lib/rules";

const FIELD = "h-11 md:h-10";

const emailComplete = (v) => isValidEmail(v);
const registrationComplete = (v) => String(v || "").trim().length >= 3;

// Grouped into sections; `span: "full"` takes the whole row.
const SECTIONS = [
  {
    title: "Professional profile",
    description: "Shown on every prescription the doctor signs.",
    fields: [
      { name: "fullName", label: "Full name", placeholder: "e.g. Fatima Zahra", required: true, Component: NameInput, span: "full", hint: "Without the \"Dr.\" title, which is added automatically." },
      { name: "qualification", label: "Qualifications", placeholder: "e.g. MBBS, FCPS", Component: TitleInput },
      { name: "specialization", label: "Specialisation", placeholder: "e.g. Cardiologist", Component: TitleInput },
      { name: "registrationNo", label: "PMDC registration number", placeholder: "e.g. 12345-P", required: true, Component: CodeInput },
      { name: "phone", label: "Contact phone", placeholder: "0300-1234567", Component: PhoneInput },
    ],
  },
  {
    title: "Clinic",
    description: "Printed in the prescription header.",
    fields: [
      { name: "clinicName", label: "Clinic / hospital name", placeholder: "e.g. Al-Shifa Health Clinic", Component: TitleInput },
      { name: "clinicAddress", label: "Clinic address", placeholder: "e.g. Plot 12, Medical Complex, Lahore", Component: TextInput, maxLength: LIMITS.address, span: "wide" },
    ],
  },
];

export function DoctorForm({ mode = "create", doctorId, initialValues = {}, email }) {
  const router = useRouter();

  // Email and PMDC no. are unique: check them as they're typed.
  const excludeId = mode === "edit" ? doctorId : undefined;
  const emailCheck = useUniqueCheck(checkDoctorUnique, { field: "email", isComplete: emailComplete });
  const regCheck = useUniqueCheck(checkDoctorUnique, {
    field: "registrationNo",
    excludeId,
    isComplete: registrationComplete,
    delay: 600,
    initialValue: initialValues.registrationNo || "",
  });
  const duplicateFound = mode === "create" && (emailCheck.status === "found" || regCheck.status === "found");

  function duplicateNotice(check, what) {
    if (check.status !== "found") return null;
    const { match, otherAccount } = check.result;
    if (otherAccount) {
      return <DuplicateNotice className="col-span-full" title={`This ${what} is used by another account`} note="Use a different email for the doctor's login." />;
    }
    return (
      <DuplicateNotice
        className="col-span-full"
        title={`A doctor already has this ${what}`}
        name={`Dr. ${match.fullName}`}
        meta={match.isActive ? "Active account" : "Account deactivated"}
        note={!match.isActive && mode === "create" ? "Reactivate this doctor from their page instead of creating a new account." : undefined}
        actions={
          <Button nativeButton={false} render={<Link href={`/admin/doctors/${match.id}`} />} className="h-10 px-4">
            {match.isActive ? "Open doctor" : "Open & reactivate"}
          </Button>
        }
      />
    );
  }

  async function handleSubmit(formData) {
    const res = mode === "edit" ? await updateDoctor(doctorId, formData) : await createDoctor(formData);
    if (!res?.error) {
      // Stays pending while navigating, so the doctor can't be created twice.
      router.push("/admin/doctors");
      router.refresh();
    }
    return res;
  }

  return (
    <Form onSubmit={handleSubmit}>
      <FormSection title="Sign-in account" description="The doctor signs in with this email address.">
        {mode === "edit" ? (
          <Field label="Account email" htmlFor="email" span="full" hint="The login email can't be changed here.">
            <Input id="email" value={email} disabled aria-describedby="email-hint" className={`${FIELD} bg-muted`} />
          </Field>
        ) : (
          <>
            <Field label="Email address" htmlFor="email" required labelAside={<UniqueStatus status={emailCheck.status} />}>
              <EmailInput id="email" name="email" label="Email" placeholder="doctor@clinic.pk" required onValueChange={emailCheck.check} className={FIELD} />
            </Field>
            <Field label="Temporary password" htmlFor="password" required hint="At least 10 characters. The doctor must change it at first sign-in.">
              <PasswordInput id="password" name="password" label="Temporary password" autoComplete="new-password" aria-describedby="password-hint" className={FIELD} />
            </Field>
            {duplicateNotice(emailCheck, "email")}
          </>
        )}
      </FormSection>

      {SECTIONS.map((section) => (
        <FormSection key={section.title} title={section.title} description={section.description}>
          {section.fields.map(({ Component, span, hint, label, ...field }) => [
            <Field key={field.name} label={label} htmlFor={field.name} required={field.required} labelAside={field.name === "registrationNo" ? <UniqueStatus status={regCheck.status} /> : undefined} span={span === "full" ? "full" : undefined} className={span === "wide" ? "xl:col-span-2" : undefined} hint={hint}>
              <Component
                id={field.name}
                name={field.name}
                defaultValue={initialValues[field.name] || ""}
                placeholder={field.placeholder}
                required={field.required}
                label={label}
                maxLength={field.maxLength}
                aria-describedby={hint ? `${field.name}-hint` : undefined}
                onValueChange={field.name === "registrationNo" ? regCheck.check : undefined}
                className={FIELD}
              />
            </Field>,
            field.name === "registrationNo" ? <React.Fragment key="reg-dup">{duplicateNotice(regCheck, "PMDC number")}</React.Fragment> : null,
          ])}
        </FormSection>
      ))}

      <FormStatus />

      <FormActions>
        <Button type="button" variant="outline" className="h-11 px-5" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton disabled={duplicateFound} pendingText="Saving…" className="h-11 px-6">
          {duplicateFound ? "Already exists" : mode === "edit" ? "Save changes" : "Create doctor account"}
        </SubmitButton>
      </FormActions>
    </Form>
  );
}
