"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDoctor, updateDoctor } from "@/lib/actions/doctors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeInput, EmailInput, NameInput, PhoneInput, TitleInput } from "@/components/ui/form-inputs";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

const fields = [
  { name: "fullName", label: "Full Name", placeholder: "Fatima Zahra", required: true, Component: NameInput },
  { name: "qualification", label: "Qualifications / Degrees", placeholder: "MBBS, FCPS, MRCP", Component: TitleInput },
  { name: "specialization", label: "Medical Specialization", placeholder: "Cardiologist, General Physician", Component: TitleInput },
  { name: "registrationNo", label: "PMDC / Medical License No.", placeholder: "12345-P", required: true, Component: CodeInput },
  { name: "phone", label: "Contact Phone", placeholder: "0300-1234567", Component: PhoneInput },
  { name: "clinicName", label: "Primary Clinic / Hospital", placeholder: "Al-Shifa Health Clinic", Component: TitleInput },
  { name: "clinicAddress", label: "Clinic Physical Address", placeholder: "Plot 12, Medical Complex, Lahore", Component: Input, maxLength: 300 },
];

export function DoctorForm({ mode = "create", doctorId, initialValues = {}, email }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    try {
      const res = mode === "edit" ? await updateDoctor(doctorId, formData) : await createDoctor(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      // Keep the button disabled while navigating, so the doctor can't be created twice.
      router.push("/admin/doctors");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/60 shadow-xs">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "edit" ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Account Email (Login Username)</Label>
              <Input value={email} disabled className="min-h-[44px] md:min-h-[38px] bg-muted" />
              <p className="text-[11px] text-muted-foreground">
                Email serves as the doctor&apos;s primary login credentials.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">Doctor Email Address *</Label>
                <EmailInput id="email" name="email" placeholder="doctor@clinic.pk" required className="min-h-[44px] md:min-h-[38px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Temporary Password *</Label>
                <Input id="password" name="password" type="password" minLength={10} autoComplete="new-password" required className="min-h-[44px] md:min-h-[38px]" />
                <p className="text-[11px] text-muted-foreground">At least 10 characters.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
            {fields.map(({ Component, ...field }) => (
              <div key={field.name} className={`space-y-1.5 ${field.name === "fullName" || field.name === "clinicAddress" ? "col-span-1 sm:col-span-2" : ""}`}>
                <Label htmlFor={field.name} className="text-xs font-semibold">{field.label} {field.required ? "*" : ""}</Label>
                <Component
                  id={field.name}
                  name={field.name}
                  defaultValue={initialValues[field.name] || ""}
                  placeholder={field.placeholder}
                  required={field.required}
                  maxLength={field.maxLength}
                  className="min-h-[44px] md:min-h-[38px]"
                />
              </div>
            ))}
          </div>

          {error && <p role="alert" className="text-sm font-medium text-destructive mt-3">{error}</p>}

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px] shadow-xs">
              {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Doctor Account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}