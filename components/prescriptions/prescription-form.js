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
import { Plus, Trash2 } from "lucide-react";

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
      <Card>
        <CardHeader><CardTitle className="text-base">Vitals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="heightCm">Height (cm)</Label>
            <Input id="heightCm" name="heightCm" type="number" step="0.1" defaultValue={v?.heightCm ?? ""} className="min-h-[44px] md:min-h-[36px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input id="weightKg" name="weightKg" type="number" step="0.1" defaultValue={v?.weightKg ?? ""} className="min-h-[44px] md:min-h-[36px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bloodPressure">Blood Pressure</Label>
            <Input id="bloodPressure" name="bloodPressure" placeholder="120/80" defaultValue={v?.bloodPressure ?? ""} className="min-h-[44px] md:min-h-[36px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temperatureF">Temperature (°F)</Label>
            <Input id="temperatureF" name="temperatureF" type="number" step="0.1" defaultValue={v?.temperatureF ?? ""} className="min-h-[44px] md:min-h-[36px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pulseRate">Pulse Rate</Label>
            <Input id="pulseRate" name="pulseRate" type="number" defaultValue={v?.pulseRate ?? ""} className="min-h-[44px] md:min-h-[36px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="spo2">SpO2 (%)</Label>
            <Input id="spo2" name="spo2" type="number" step="0.1" defaultValue={v?.spo2 ?? ""} className="min-h-[44px] md:min-h-[36px]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Symptoms & Diagnosis</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea id="symptoms" name="symptoms" rows={3} defaultValue={initialData?.symptoms ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea id="diagnosis" name="diagnosis" rows={2} defaultValue={initialData?.diagnosis ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <CardTitle className="text-base">Medicines</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={addMedicineRow} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            <Plus className="mr-1 h-4 w-4" /> Add Medicine
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicineRows.map((row) => (
            <div
              key={row.id}
              className="border rounded-lg p-3.5 space-y-3 bg-muted/20 md:border-0 md:p-0 md:bg-transparent md:grid md:grid-cols-12 md:gap-2 md:items-end md:border-b md:pb-4 md:last:border-0"
            >
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-xs">Medicine</Label>
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
                  <Label className="text-xs">Dosage</Label>
                  <Input
                    placeholder="1 tablet"
                    value={row.dosage}
                    onChange={(e) => updateMedicineRow(row.id, "dosage", e.target.value)}
                    className="min-h-[44px] md:min-h-[36px]"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs">Frequency</Label>
                  <Input
                    placeholder="Twice daily"
                    value={row.frequency}
                    onChange={(e) => updateMedicineRow(row.id, "frequency", e.target.value)}
                    className="min-h-[44px] md:min-h-[36px]"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs">Duration</Label>
                  <Input
                    placeholder="5 days"
                    value={row.duration}
                    onChange={(e) => updateMedicineRow(row.id, "duration", e.target.value)}
                    className="min-h-[44px] md:min-h-[36px]"
                  />
                </div>
              </div>
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-xs">Notes</Label>
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
                  variant="outline"
                  size="sm"
                  onClick={() => removeMedicineRow(row.id)}
                  className="w-full md:w-auto min-h-[44px] md:min-h-[36px] text-destructive hover:text-destructive flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="md:hidden text-xs">Remove Medicine</span>
                </Button>
              </div>
            </div>
          ))}
          {medicineRows.length === 0 && <p className="text-sm text-muted-foreground">No medicines added yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <CardTitle className="text-base">Laboratory Tests</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={addLabTestRow} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            <Plus className="mr-1 h-4 w-4" /> Add Test
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {labTestRows.map((row) => (
            <div
              key={row.id}
              className="border rounded-lg p-3.5 space-y-3 bg-muted/20 md:border-0 md:p-0 md:bg-transparent md:grid md:grid-cols-12 md:gap-2 md:items-end md:border-b md:pb-4 md:last:border-0"
            >
              <div className="md:col-span-6 space-y-1.5">
                <Label className="text-xs">Test</Label>
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
                <Label className="text-xs">Instructions</Label>
                <Input
                  placeholder="Fasting required"
                  value={row.instructions}
                  onChange={(e) => updateLabTestRow(row.id, "instructions", e.target.value)}
                  className="min-h-[44px] md:min-h-[36px]"
                />
              </div>
              <div className="md:col-span-1 pt-1 md:pt-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeLabTestRow(row.id)}
                  className="w-full md:w-auto min-h-[44px] md:min-h-[36px] text-destructive hover:text-destructive flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="md:hidden text-xs">Remove Test</span>
                </Button>
              </div>
            </div>
          ))}
          {labTestRows.length === 0 && <p className="text-sm text-muted-foreground">No lab tests added yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Doctor&apos;s Advice</CardTitle></CardHeader>
        <CardContent>
          <Textarea name="advice" rows={3} placeholder="Rest, hydration, follow-up in 5 days..." defaultValue={initialData?.advice ?? ""} />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button type="submit" name="intent" value="draft" variant="outline" disabled={loading} className="w-full sm:w-auto min-h-[44px]">
          Save Draft
        </Button>
        <Button type="submit" name="intent" value="finalized" disabled={loading} className="w-full sm:w-auto min-h-[44px]">
          {loading ? "Generating..." : "Generate Prescription"}
        </Button>
      </div>
    </form>
  );
}