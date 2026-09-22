"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPrescription, updatePrescription } from "@/lib/actions/prescriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Trash2, HeartPulse, Stethoscope, Pill, FlaskConical, FileText, CheckCircle } from "lucide-react";

let rowId = 0;
const nextId = () => `row-${++rowId}`;

export function PrescriptionForm({ patient, medicines, labTests, mode = "create", prescriptionId, initialData }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [medicineRows, setMedicineRows] = useState(
    () =>
      initialData?.medicines?.map((pm) => ({
        id: nextId(),
        medicineId: pm.medicineId,
        dosage: pm.dosage,
        frequency: pm.frequency,
        duration: pm.duration,
        instructions: pm.instructions || "",
      })) || []
  );
  const [labTestRows, setLabTestRows] = useState(
    () =>
      initialData?.labTests?.map((plt) => ({
        id: nextId(),
        labTestId: plt.labTestId,
        instructions: plt.instructions || "",
      })) || []
  );

  function addMedicineRow() {
    setMedicineRows((rows) => [
      ...rows,
      { id: nextId(), medicineId: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  }
  function updateMedicineRow(id, field, value) {
    setMedicineRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function removeMedicineRow(id) {
    setMedicineRows((rows) => rows.filter((r) => r.id !== id));
  }

  function addLabTestRow() {
    setLabTestRows((rows) => [...rows, { id: nextId(), labTestId: "", instructions: "" }]);
  }
  function updateLabTestRow(id, field, value) {
    setLabTestRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function removeLabTestRow(id) {
    setLabTestRows((rows) => rows.filter((r) => r.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target, e.nativeEvent.submitter);
    formData.set("patientId", patient.id);
    formData.set("medicinesData", JSON.stringify(medicineRows));
    formData.set("labTestsData", JSON.stringify(labTestRows));

    const res =
      mode === "edit"
        ? await updatePrescription(prescriptionId, formData)
        : await createPrescription(formData);

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.push(`/doctor/prescriptions/${res.prescriptionId}`);
  }

  const v = initialData?.vitals;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vitals Section */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-500" strokeWidth={2} />
            <span>Patient Vitals</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="heightCm" className="text-xs font-semibold">Height (cm)</Label>
            <Input id="heightCm" name="heightCm" type="number" step="0.1" placeholder="e.g., 175" defaultValue={v?.heightCm ?? ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weightKg" className="text-xs font-semibold">Weight (kg)</Label>
            <Input id="weightKg" name="weightKg" type="number" step="0.1" placeholder="e.g., 70" defaultValue={v?.weightKg ?? ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bloodPressure" className="text-xs font-semibold">Blood Pressure</Label>
            <Input id="bloodPressure" name="bloodPressure" placeholder="120/80" defaultValue={v?.bloodPressure ?? ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temperatureF" className="text-xs font-semibold">Temperature (°F)</Label>
            <Input id="temperatureF" name="temperatureF" type="number" step="0.1" placeholder="98.6" defaultValue={v?.temperatureF ?? ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pulseRate" className="text-xs font-semibold">Pulse Rate (bpm)</Label>
            <Input id="pulseRate" name="pulseRate" type="number" placeholder="72" defaultValue={v?.pulseRate ?? ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="spo2" className="text-xs font-semibold">SpO2 Oxygen (%)</Label>
            <Input id="spo2" name="spo2" type="number" step="0.1" placeholder="98" defaultValue={v?.spo2 ?? ""} className="min-h-[44px] md:min-h-[38px]" />
          </div>
        </CardContent>
      </Card>

      {/* Symptoms & Diagnosis */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" strokeWidth={2} />
            <span>Symptoms & Clinical Diagnosis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="symptoms" className="text-xs font-semibold">Reported Symptoms</Label>
            <Textarea id="symptoms" name="symptoms" rows={3} placeholder="Fever, cough for 3 days, sore throat..." defaultValue={initialData?.symptoms ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diagnosis" className="text-xs font-semibold">Diagnosis</Label>
            <Textarea id="diagnosis" name="diagnosis" rows={2} placeholder="Acute Upper Respiratory Tract Infection (URTI)..." defaultValue={initialData?.diagnosis ?? ""} />
          </div>
        </CardContent>
      </Card>

      {/* Medicines */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" strokeWidth={2} />
            <span>Prescribed Medications</span>
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addMedicineRow} className="w-full sm:w-auto min-h-[40px] sm:min-h-0 text-xs shadow-xs">
            <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={1.75} /> Add Medication
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {medicineRows.map((row) => (
            <div
              key={row.id}
              className="border border-border/60 rounded-xl p-3.5 space-y-3 bg-muted/20 md:border-0 md:p-0 md:bg-transparent md:grid md:grid-cols-12 md:gap-2 md:items-end md:border-b md:pb-4 md:last:border-0"
            >
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-xs font-semibold">Medicine</Label>
                <Select value={row.medicineId} onValueChange={(v) => updateMedicineRow(row.id, "medicineId", v)}>
                  <SelectTrigger className="w-full min-h-[44px] md:min-h-[36px]">
                    <SelectValue placeholder="Select medicine" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicines.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} {m.strength ? `(${m.strength})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:contents">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Dosage</Label>
                  <Input
                    placeholder="1 tablet"
                    value={row.dosage}
                    onChange={(e) => updateMedicineRow(row.id, "dosage", e.target.value)}
                    className="min-h-[44px] md:min-h-[36px]"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Frequency</Label>
                  <Input
                    placeholder="Twice daily"
                    value={row.frequency}
                    onChange={(e) => updateMedicineRow(row.id, "frequency", e.target.value)}
                    className="min-h-[44px] md:min-h-[36px]"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Duration</Label>
                  <Input
                    placeholder="5 days"
                    value={row.duration}
                    onChange={(e) => updateMedicineRow(row.id, "duration", e.target.value)}
                    className="min-h-[44px] md:min-h-[36px]"
                  />
                </div>
              </div>
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-xs font-semibold">Notes</Label>
                <Input
                  placeholder="After meals"
                  value={row.instructions}
                  onChange={(e) => updateMedicineRow(row.id, "instructions", e.target.value)}
                  className="min-h-[44px] md:min-h-[36px]"
                />
              </div>
              <div className="md:col-span-1 pt-1 md:pt-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMedicineRow(row.id)}
                  className="w-full md:w-auto min-h-[44px] md:min-h-[36px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5"
                  aria-label="Remove medicine"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  <span className="md:hidden text-xs text-destructive">Remove</span>
                </Button>
              </div>
            </div>
          ))}
          {medicineRows.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">No medications added yet. Click &quot;Add Medication&quot; above.</p>
          )}
        </CardContent>
      </Card>

      {/* Lab Tests */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" strokeWidth={2} />
            <span>Diagnostic Laboratory Tests</span>
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLabTestRow} className="w-full sm:w-auto min-h-[40px] sm:min-h-0 text-xs shadow-xs">
            <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={1.75} /> Add Test
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {labTestRows.map((row) => (
            <div
              key={row.id}
              className="border border-border/60 rounded-xl p-3.5 space-y-3 bg-muted/20 md:border-0 md:p-0 md:bg-transparent md:grid md:grid-cols-12 md:gap-2 md:items-end md:border-b md:pb-4 md:last:border-0"
            >
              <div className="md:col-span-6 space-y-1.5">
                <Label className="text-xs font-semibold">Test</Label>
                <Select value={row.labTestId} onValueChange={(v) => updateLabTestRow(row.id, "labTestId", v)}>
                  <SelectTrigger className="w-full min-h-[44px] md:min-h-[36px]">
                    <SelectValue placeholder="Select test" />
                  </SelectTrigger>
                  <SelectContent>
                    {labTests.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-5 space-y-1.5">
                <Label className="text-xs font-semibold">Instructions / Special Notes</Label>
                <Input
                  placeholder="Fasting required, morning sample..."
                  value={row.instructions}
                  onChange={(e) => updateLabTestRow(row.id, "instructions", e.target.value)}
                  className="min-h-[44px] md:min-h-[36px]"
                />
              </div>
              <div className="md:col-span-1 pt-1 md:pt-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLabTestRow(row.id)}
                  className="w-full md:w-auto min-h-[44px] md:min-h-[36px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5"
                  aria-label="Remove test"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  <span className="md:hidden text-xs text-destructive">Remove</span>
                </Button>
              </div>
            </div>
          ))}
          {labTestRows.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">No laboratory tests added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Advice */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" strokeWidth={2} />
            <span>Doctor&apos;s Advice & Follow-Up</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Textarea name="advice" rows={3} placeholder="Rest, hydration, follow-up in 5 days, dietary instructions..." defaultValue={initialData?.advice ?? ""} />
        </CardContent>
      </Card>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button type="submit" name="intent" value="draft" variant="outline" disabled={loading} className="w-full sm:w-auto min-h-[44px]">
          Save Draft
        </Button>
        <Button type="submit" name="intent" value="finalized" disabled={loading} className="w-full sm:w-auto min-h-[44px] shadow-xs">
          {loading ? "Generating..." : "Generate & Finalize Prescription"}
        </Button>
      </div>
    </form>
  );
}