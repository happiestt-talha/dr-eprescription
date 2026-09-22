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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, User, Phone, ShieldAlert, HeartPulse, CheckCircle2 } from "lucide-react";

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
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xs">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <div className="h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-base text-foreground">Patient Registered Successfully</p>
                <p className="text-xs text-muted-foreground">Share these electronic login credentials with the patient now.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2">
              <div className="p-3.5 bg-card rounded-xl border border-border/60 shadow-xs">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Username (Phone)</p>
                <p className="font-mono text-base font-bold mt-1 text-foreground">{result.credentials.username}</p>
              </div>
              <div className="p-3.5 bg-card rounded-xl border border-border/60 shadow-xs">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Temporary Password</p>
                <p className="font-mono text-base font-bold mt-1 text-primary">{result.credentials.tempPassword}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => router.push(`${redirectBase}/${result.patientId}`)} className="w-full sm:w-auto min-h-[44px] shadow-xs">
          Continue to Patient Profile
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" strokeWidth={2} />
            <span>Personal & Demographics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4">
          <div className="space-y-1.5 col-span-1 sm:col-span-2">
            <Label htmlFor="fullName" className="text-xs font-semibold">Full Legal Name *</Label>
            <Input id="fullName" name="fullName" placeholder="e.g., Muhammad Ali" defaultValue={initialValues.fullName || ""} required className="min-h-[44px] md:min-h-[38px]" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fatherHusbandName" className="text-xs font-semibold">Father / Husband Name</Label>
            <Input id="fatherHusbandName" name="fatherHusbandName" defaultValue={initialValues.fatherHusbandName || ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gender" className="text-xs font-semibold">Gender *</Label>
            <Select name="gender" defaultValue={initialValues.gender || undefined} required>
              <SelectTrigger id="gender" className="w-full min-h-[44px] md:min-h-[38px]"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth" className="text-xs font-semibold">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={initialValues.dateOfBirth ? new Date(initialValues.dateOfBirth).toISOString().slice(0, 10) : ""}
              className="min-h-[44px] md:min-h-[38px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="age" className="text-xs font-semibold">Age (years)</Label>
            <Input id="age" name="age" type="number" min="0" placeholder="e.g., 34" defaultValue={initialValues.age ?? ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bloodGroup" className="text-xs font-semibold">Blood Group</Label>
            <Input id="bloodGroup" name="bloodGroup" placeholder="e.g., O+, A-, B+" defaultValue={initialValues.bloodGroup || ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" strokeWidth={2} />
            <span>Contact & Identification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold">Phone Number (Login Username) *</Label>
            {mode === "edit" ? (
              <>
                <Input value={initialValues.phone || ""} disabled className="min-h-[44px] md:min-h-[38px]" />
                <p className="text-[11px] text-muted-foreground">
                  Phone cannot be changed as it serves as the account login username.
                </p>
              </>
            ) : (
              <>
                <Input id="phone" name="phone" placeholder="03001234567" required className="min-h-[44px] md:min-h-[38px]" />
                <p className="text-[11px] text-muted-foreground">Doubles as this patient&apos;s portal login username.</p>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="patient@example.com" defaultValue={initialValues.email || ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cnic" className="text-xs font-semibold">CNIC / National ID</Label>
            <Input id="cnic" name="cnic" placeholder="xxxxx-xxxxxxx-x" defaultValue={initialValues.cnic || ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emergencyContact" className="text-xs font-semibold">Emergency Contact Phone</Label>
            <Input id="emergencyContact" name="emergencyContact" placeholder="03007654321" defaultValue={initialValues.emergencyContact || ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>

          <div className="space-y-1.5 col-span-1 sm:col-span-2">
            <Label htmlFor="address" className="text-xs font-semibold">Residential Address</Label>
            <Input id="address" name="address" placeholder="House #, Street, City" defaultValue={initialValues.address || ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>
        </CardContent>
      </Card>

      {/* Medical Profile */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" strokeWidth={2} />
            <span>Medical History & Baseline</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="heightCm" className="text-xs font-semibold">Baseline Height (cm)</Label>
              <Input id="heightCm" name="heightCm" type="number" step="0.1" defaultValue={initialValues.heightCm ?? ""} className="min-h-[44px] md:min-h-[38px]" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weightKg" className="text-xs font-semibold">Baseline Weight (kg)</Label>
              <Input id="weightKg" name="weightKg" type="number" step="0.1" defaultValue={initialValues.weightKg ?? ""} className="min-h-[44px] md:min-h-[38px]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="allergies" className="text-xs font-semibold">Known Drug Allergies</Label>
            <Textarea id="allergies" name="allergies" rows={2} placeholder="Penicillin, NSAIDs, Sulfa drugs (or 'None')..." defaultValue={initialValues.allergies || ""} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="existingDiseases" className="text-xs font-semibold">Existing Chronic Conditions</Label>
            <Textarea id="existingDiseases" name="existingDiseases" rows={2} placeholder="Hypertension, Type 2 Diabetes, Asthma..." defaultValue={initialValues.existingDiseases || ""} />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-sm font-medium text-destructive space-y-1 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p>{error}</p>
          {existingPatientId && (
            <Link href={`${redirectBase}/${existingPatientId}`} className="underline font-semibold block text-primary">
              Go to existing patient&apos;s profile →
            </Link>
          )}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px] shadow-xs">
        {loading ? (mode === "edit" ? "Saving..." : "Registering...") : mode === "edit" ? "Save Changes" : "Register Patient"}
      </Button>
    </form>
  );
}