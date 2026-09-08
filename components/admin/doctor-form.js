"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDoctor, updateDoctor } from "@/lib/actions/doctors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fields = [
  { name: "fullName", label: "Full Name", required: true },
  { name: "qualification", label: "Qualification", placeholder: "MBBS, FCPS" },
  { name: "specialization", label: "Specialization", placeholder: "General Physician" },
  { name: "registrationNo", label: "Registration No.", required: true },
  { name: "phone", label: "Phone" },
  { name: "clinicName", label: "Clinic Name" },
  { name: "clinicAddress", label: "Clinic Address" },
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "edit" ? (
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} disabled />
          <p className="text-xs text-muted-foreground">
            Email can&apos;t be changed here. This doubles as the doctor&apos;s login.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </>
      )}

      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            defaultValue={initialValues[field.name] || ""}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px]">
        {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Doctor"}
      </Button>
    </form>
  );
}