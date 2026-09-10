"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPatient, updatePatient } from "@/lib/actions/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { KeyRound } from "lucide-react";

export function PatientForm({ redirectBase = "/doctor/patients", mode = "create", patientId, initialValues = {} }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [existingPatientId, setExistingPatientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setExistingPatientId(null);
    setLoading(true);

    const formData = new FormData(e.target);

    if (mode === "edit") {
      const res = await updatePatient(patientId, formData);
      setLoading(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push(`${redirectBase}/${patientId}`);
      return;
    }

    const res = await createPatient(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      if (res.existingPatientId) setExistingPatientId(res.existingPatientId);
      return;
    }

    setResult(res);
  }

  if (result) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <KeyRound className="h-5 w-5 shrink-0" />
              <p className="font-medium text-sm sm:text-base">Patient registered. Share these login details with them now.</p>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This password won&apos;t be shown again. Write it down or hand it over before continuing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2">
              <div className="p-3 bg-muted/40 rounded-md border">
                <p className="text-xs text-muted-foreground uppercase">Username (phone)</p>
                <p className="font-mono text-base font-semibold mt-0.5">{result.credentials.username}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-md border">
                <p className="text-xs text-muted-foreground uppercase">Temporary Password</p>
                <p className="font-mono text-base font-semibold mt-0.5">{result.credentials.tempPassword}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => router.push(`${redirectBase}/${result.patientId}`)} className="w-full sm:w-auto min-h-[44px]">
          Continue to Patient Profile
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5 col-span-1 sm:col-span-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" defaultValue={initialValues.fullName || ""} required className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fatherHusbandName">Father / Husband Name</Label>
          <Input id="fatherHusbandName" name="fatherHusbandName" defaultValue={initialValues.fatherHusbandName || ""} className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gender">Gender</Label>
          <Select name="gender" defaultValue={initialValues.gender || undefined} required>
            <SelectTrigger id="gender" className="w-full min-h-[44px] md:min-h-[36px]"><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={initialValues.dateOfBirth ? new Date(initialValues.dateOfBirth).toISOString().slice(0, 10) : ""}
            className="min-h-[44px] md:min-h-[36px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="age">Age</Label>
          <Input id="age" name="age" type="number" min="0" defaultValue={initialValues.age ?? ""} className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          {mode === "edit" ? (
            <>
              <Input value={initialValues.phone || ""} disabled className="min-h-[44px] md:min-h-[36px]" />
              <p className="text-xs text-muted-foreground">
                Phone can&apos;t be changed here since it&apos;s this patient&apos;s login username.
              </p>
            </>
          ) : (
            <>
              <Input id="phone" name="phone" required className="min-h-[44px] md:min-h-[36px]" />
              <p className="text-xs text-muted-foreground">Doubles as this patient&apos;s login username.</p>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={initialValues.email || ""} className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cnic">CNIC</Label>
          <Input id="cnic" name="cnic" placeholder="xxxxx-xxxxxxx-x" defaultValue={initialValues.cnic || ""} className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bloodGroup">Blood Group</Label>
          <Input id="bloodGroup" name="bloodGroup" placeholder="O+" defaultValue={initialValues.bloodGroup || ""} className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5 col-span-1 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={initialValues.address || ""} className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="emergencyContact">Emergency Contact</Label>
          <Input id="emergencyContact" name="emergencyContact" defaultValue={initialValues.emergencyContact || ""} className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="heightCm">Height (cm)</Label>
          <Input id="heightCm" name="heightCm" type="number" step="0.1" defaultValue={initialValues.heightCm ?? ""} className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input id="weightKg" name="weightKg" type="number" step="0.1" defaultValue={initialValues.weightKg ?? ""} className="min-h-[44px] md:min-h-[36px]" />
        </div>

        <div className="space-y-1.5 col-span-1 sm:col-span-2">
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea id="allergies" name="allergies" rows={2} defaultValue={initialValues.allergies || ""} />
        </div>

        <div className="space-y-1.5 col-span-1 sm:col-span-2">
          <Label htmlFor="existingDiseases">Existing Diseases</Label>
          <Textarea id="existingDiseases" name="existingDiseases" rows={2} defaultValue={initialValues.existingDiseases || ""} />
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

      <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px]">
        {loading ? (mode === "edit" ? "Saving..." : "Registering...") : mode === "edit" ? "Save Changes" : "Register Patient"}
      </Button>
    </form>
  );
}