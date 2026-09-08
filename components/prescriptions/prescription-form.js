"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPrescription } from "@/lib/actions/prescriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

let rowId = 0;
const nextId = () => `row-${++rowId}`;

export function PrescriptionForm({ patient, medicines, labTests }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [medicineRows, setMedicineRows] = useState([]);
  const [labTestRows, setLabTestRows] = useState([]);

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

    const res = await createPrescription(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.push(`/doctor/prescriptions/${res.prescriptionId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Vitals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="heightCm">Height (cm)</Label>
            <Input id="heightCm" name="heightCm" type="number" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input id="weightKg" name="weightKg" type="number" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodPressure">Blood Pressure</Label>
            <Input id="bloodPressure" name="bloodPressure" placeholder="120/80" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="temperatureF">Temperature (°F)</Label>
            <Input id="temperatureF" name="temperatureF" type="number" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pulseRate">Pulse Rate</Label>
            <Input id="pulseRate" name="pulseRate" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spo2">SpO2 (%)</Label>
            <Input id="spo2" name="spo2" type="number" step="0.1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Symptoms & Diagnosis</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea id="symptoms" name="symptoms" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea id="diagnosis" name="diagnosis" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Medicines</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={addMedicineRow}>
            <Plus className="mr-1 h-4 w-4" /> Add Medicine
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicineRows.map((row) => (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4 last:border-0">
              <div className="col-span-4 space-y-1">
                <Label className="text-xs">Medicine</Label>
                <Select
                  value={row.medicineId}
                  onValueChange={(v) => updateMedicineRow(row.id, "medicineId", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
                  <SelectContent>
                    {medicines.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} {m.strength ? `(${m.strength})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Dosage</Label>
                <Input
                  placeholder="1 tablet"
                  value={row.dosage}
                  onChange={(e) => updateMedicineRow(row.id, "dosage", e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Frequency</Label>
                <Input
                  placeholder="Twice daily"
                  value={row.frequency}
                  onChange={(e) => updateMedicineRow(row.id, "frequency", e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Duration</Label>
                <Input
                  placeholder="5 days"
                  value={row.duration}
                  onChange={(e) => updateMedicineRow(row.id, "duration", e.target.value)}
                />
              </div>
              <div className="col-span-1 space-y-1">
                <Label className="text-xs">Notes</Label>
                <Input
                  placeholder="After meals"
                  value={row.instructions}
                  onChange={(e) => updateMedicineRow(row.id, "instructions", e.target.value)}
                />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeMedicineRow(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {medicineRows.length === 0 && (
            <p className="text-sm text-muted-foreground">No medicines added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Laboratory Tests</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={addLabTestRow}>
            <Plus className="mr-1 h-4 w-4" /> Add Test
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {labTestRows.map((row) => (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4 last:border-0">
              <div className="col-span-6 space-y-1">
                <Label className="text-xs">Test</Label>
                <Select
                  value={row.labTestId}
                  onValueChange={(v) => updateLabTestRow(row.id, "labTestId", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                  <SelectContent>
                    {labTests.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-5 space-y-1">
                <Label className="text-xs">Instructions</Label>
                <Input
                  placeholder="Fasting required"
                  value={row.instructions}
                  onChange={(e) => updateLabTestRow(row.id, "instructions", e.target.value)}
                />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeLabTestRow(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {labTestRows.length === 0 && (
            <p className="text-sm text-muted-foreground">No lab tests added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Doctor&apos;s Advice</CardTitle></CardHeader>
        <CardContent>
          <Textarea name="advice" rows={3} placeholder="Rest, hydration, follow-up in 5 days..." />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" name="intent" value="draft" variant="outline" disabled={loading}>
          Save Draft
        </Button>
        <Button type="submit" name="intent" value="finalized" disabled={loading}>
          {loading ? "Generating..." : "Generate Prescription"}
        </Button>
      </div>
    </form>
  );
}