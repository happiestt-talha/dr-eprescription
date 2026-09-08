"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPatient } from "@/lib/actions/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function PatientForm({ redirectBase = "/doctor/patients" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [existingPatientId, setExistingPatientId] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setExistingPatientId(null);
    setLoading(true);

    const formData = new FormData(e.target);
    const res = await createPatient(formData);

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      if (res.existingPatientId) setExistingPatientId(res.existingPatientId);
      return;
    }

    router.push(`${redirectBase}/${res.patientId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fatherHusbandName">Father / Husband Name</Label>
          <Input id="fatherHusbandName" name="fatherHusbandName" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select name="gender" required>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input id="age" name="age" type="number" min="0" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnic">CNIC</Label>
          <Input id="cnic" name="cnic" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood Group</Label>
          <Input id="bloodGroup" name="bloodGroup" placeholder="O+" />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyContact">Emergency Contact</Label>
          <Input id="emergencyContact" name="emergencyContact" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heightCm">Height (cm)</Label>
          <Input id="heightCm" name="heightCm" type="number" step="0.1" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input id="weightKg" name="weightKg" type="number" step="0.1" />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea id="allergies" name="allergies" rows={2} />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="existingDiseases">Existing Diseases</Label>
          <Textarea id="existingDiseases" name="existingDiseases" rows={2} />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 space-y-1">
          <p>{error}</p>
          {existingPatientId && (
            <Link href={`${redirectBase}/${existingPatientId}`} className="underline block">
              Go to existing patient&apos;s profile →
            </Link>
          )}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Registering..." : "Register Patient"}
      </Button>
    </form>
  );
}