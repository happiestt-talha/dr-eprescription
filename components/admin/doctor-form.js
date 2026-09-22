"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDoctor, updateDoctor } from "@/lib/actions/doctors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

const fields = [
  { name: "fullName", label: "Full Name", placeholder: "Dr. Fatima Zahra", required: true },
  { name: "qualification", label: "Qualifications / Degrees", placeholder: "MBBS, FCPS, MRCP" },
  { name: "specialization", label: "Medical Specialization", placeholder: "Cardiologist, General Physician" },
  { name: "registrationNo", label: "PMDC / Medical License No.", placeholder: "12345-P", required: true },
  { name: "phone", label: "Contact Phone", placeholder: "03001234567" },
  { name: "clinicName", label: "Primary Clinic / Hospital", placeholder: "Al-Shifa Health Clinic" },
  { name: "clinicAddress", label: "Clinic Physical Address", placeholder: "Plot 12, Medical Complex, Lahore" },
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
    const res =
      mode === "edit" ? await updateDoctor(doctorId, formData) : await createDoctor(formData);

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.push("/admin/doctors");
    router.refresh();
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
                <Input id="email" name="email" type="email" placeholder="doctor@clinic.com" required className="min-h-[44px] md:min-h-[38px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Temporary Password *</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required className="min-h-[44px] md:min-h-[38px]" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
            {fields.map((field) => (
              <div key={field.name} className={`space-y-1.5 ${field.name === "fullName" || field.name === "clinicAddress" ? "col-span-1 sm:col-span-2" : ""}`}>
                <Label htmlFor={field.name} className="text-xs font-semibold">{field.label} {field.required ? "*" : ""}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  defaultValue={initialValues[field.name] || ""}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="min-h-[44px] md:min-h-[38px]"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-sm font-medium text-destructive mt-3">{error}</p>}

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