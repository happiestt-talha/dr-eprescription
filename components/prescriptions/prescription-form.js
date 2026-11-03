"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPrescription, updatePrescription } from "@/lib/actions/prescriptions";
import { Button } from "@/components/ui/button";
import { Field, FormActions, FormSection } from "@/components/ui/form-layout";
import { Form, FormStatus, useFormContext } from "@/components/ui/form";
import { LIMITS } from "@/lib/rules";
import { Combobox } from "@/components/ui/combobox";
import { BloodPressureInput, MeasureInput, TextArea } from "@/components/ui/form-inputs";
import { bmi } from "@/lib/sanitize";
import { QuickChips, SuggestInput } from "@/components/ui/suggest-input";
import { ADVICE_CHIPS, FREQUENCIES, LAB_INSTRUCTIONS, MEDICINE_INSTRUCTIONS, suggestDosage, suggestDuration, suggestFrom } from "@/lib/clinical-vocab";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pill, FlaskConical, CheckCircle } from "lucide-react";

const FIELD = "h-11 md:h-10";

/** Amber note when weight and height together give an implausible BMI. */
function bmiWarning(heightCm, weightKg) {
  const value = bmi(heightCm, weightKg);
  return value !== null && (value < 12 || value > 60) ? `BMI ${value} looks unusual for this height. Please double-check.` : "";
}


let rowId = 0;
const nextId = () => `row-${++rowId}`;

export function PrescriptionForm({ patient, medicines, labTests, mode = "create", prescriptionId, initialData }) {
  const router = useRouter();

  // Searchable pickers filter these already-loaded lists in the browser.
  const medicineItems = useMemo(
    () =>
      medicines.map((m) => ({
        value: m.id,
        label: m.strength ? `${m.name} ${m.strength}` : m.name,
        detail: [m.genericName, m.dosageForm].filter(Boolean).join(" · "),
        keywords: m.manufacturer || "",
      })),
    [medicines]
  );
  // Dosage suggestions follow the chosen medicine's form (tablet, syrup, …).
  const dosageFormById = useMemo(() => new Map(medicines.map((m) => [m.id, m.dosageForm])), [medicines]);
  const labTestItems = useMemo(
    () => labTests.map((t) => ({ value: t.id, label: t.name, detail: t.category || "" })),
    [labTests]
  );

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

  // Runs only after every field passed its inline check. `ctx.intent` is
  // "finalized" from the Finalise button; Enter in a field saves a draft.
  async function handleSubmit(formData, ctx) {
    formData.set("intent", ctx?.intent === "finalized" ? "finalized" : "draft");
    formData.set("patientId", patient.id);
    formData.set("medicinesData", JSON.stringify(medicineRows.map(({ id: _id, ...row }) => row)));
    formData.set("labTestsData", JSON.stringify(labTestRows.map(({ id: _id, ...row }) => row)));
    const res = mode === "edit" ? await updatePrescription(prescriptionId, formData) : await createPrescription(formData);
    // Stays pending while navigating, so a second click can't create a duplicate.
    if (!res?.error) router.push(`/doctor/prescriptions/${res.prescriptionId}`);
    return res;
  }

  // Finalise-only requirements, checked inline before the confirmation opens
  // (the server applies the same ones in readPrescription).
  const finalising = (ctx) => ctx?.intent === "finalized";
  const rowFilled = (row) => Object.entries(row).some(([k, v]) => k !== "id" && v);

  const v = initialData?.vitals;
  const [heightCm, setHeightCm] = useState(String(v?.heightCm ?? ""));
  const [weightKg, setWeightKg] = useState(String(v?.weightKg ?? ""));

  const addButton = (onClick, label) => (
    <Button type="button" variant="outline" onClick={onClick} className="h-10 shrink-0 gap-1.5 rounded-full px-4 text-sm">
      <Plus className="size-4" /> {label}
    </Button>
  );
  const rowNumber = (n) => (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden="true">
      {n}
    </span>
  );
  const removeButton = (onClick, label) => (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={onClick}
      aria-label={label}
      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
      <Trash2 className="size-4" />
    </Button>
  );
  const emptyState = (Icon, text) => (
    <p className="col-span-full flex items-center gap-2 py-2 text-sm text-muted-foreground">
      <Icon className="size-4 text-muted-foreground/60" strokeWidth={1.75} aria-hidden="true" />
      {text}
    </p>
  );

  return (
    <Form onSubmit={handleSubmit}>
      <FormSection title="Vitals" description="Measured at this visit. All optional." columns={6}>
        <Field label="Height" htmlFor="heightCm">
          <MeasureInput measure="heightCm" id="heightCm" name="heightCm" placeholder="175" defaultValue={heightCm} onValueChange={setHeightCm} className={FIELD} />
        </Field>
        <Field label="Weight" htmlFor="weightKg">
          <MeasureInput measure="weightKg" id="weightKg" name="weightKg" placeholder="70" defaultValue={weightKg} onValueChange={setWeightKg} extraWarn={(w) => bmiWarning(heightCm, w)} className={FIELD} />
        </Field>
        <Field label="Blood pressure" htmlFor="bloodPressure">
          <BloodPressureInput id="bloodPressure" name="bloodPressure" defaultValue={v?.bloodPressure ?? ""} className={FIELD} />
        </Field>
        <Field label="Temperature" htmlFor="temperatureF">
          <MeasureInput measure="temperatureF" id="temperatureF" name="temperatureF" placeholder="98.6" defaultValue={v?.temperatureF ?? ""} className={FIELD} />
        </Field>
        <Field label="Pulse" htmlFor="pulseRate">
          <MeasureInput measure="pulseRate" id="pulseRate" name="pulseRate" placeholder="72" defaultValue={v?.pulseRate ?? ""} className={FIELD} />
        </Field>
        <Field label="SpO₂" htmlFor="spo2">
          <MeasureInput measure="spo2" id="spo2" name="spo2" placeholder="98" defaultValue={v?.spo2 ?? ""} className={FIELD} />
        </Field>
      </FormSection>

      <FormSection title="Clinical notes" description="What the patient reports and your assessment." columns="pair">
        <Field label="Symptoms" htmlFor="symptoms">
          <TextArea id="symptoms" name="symptoms" label="Symptoms" maxLength={LIMITS.clinical} rows={3} placeholder="e.g. Fever and cough for 3 days, sore throat" defaultValue={initialData?.symptoms ?? ""} />
        </Field>
        <Field label="Diagnosis" htmlFor="diagnosis">
          <TextArea
            id="diagnosis"
            name="diagnosis"
            label="Diagnosis"
            validate={(value, ctx) => (finalising(ctx) && !String(value ?? "").trim() ? "A diagnosis is required to finalise" : "")}
            maxLength={LIMITS.clinical}
            rows={2} placeholder="e.g. Acute upper respiratory tract infection" defaultValue={initialData?.diagnosis ?? ""} />
        </Field>
      </FormSection>

      <FormSection
        title="Medicines"
        description={medicineRows.length ? `${medicineRows.length} prescribed` : "Add each medicine with its dose and duration."}
        columns={1}
        aside={addButton(addMedicineRow, "Add medicine")}>
        {medicineRows.length === 0 && emptyState(Pill, "No medicines added yet")}
        {medicineRows.map((row, index) => (
          <div key={row.id} className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {rowNumber(index + 1)}
                <span className="text-sm font-medium text-foreground">Medicine {index + 1}</span>
              </div>
              {removeButton(() => removeMedicineRow(row.id), `Remove medicine ${index + 1}`)}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <Field label="Medicine" htmlFor={`${row.id}-medicine`} name={`medicines.${index}.medicineId`} className="sm:col-span-6 xl:col-span-2">
                <Combobox
                  id={`${row.id}-medicine`}
                  name={`medicines.${index}.medicineId`}
                  validate={(value, ctx) => (finalising(ctx) && rowFilled(row) && !value ? "Choose a medicine" : "")}
                  items={medicineItems}
                  value={row.medicineId}
                  onValueChange={(v) => updateMedicineRow(row.id, "medicineId", v)}
                  placeholder="Search medicine by brand or generic name"
                  emptyText="No medicines match"
                />
              </Field>
              <Field label="Dosage" htmlFor={`${row.id}-dosage`} name={`medicines.${index}.dosage`} className="sm:col-span-2 xl:col-span-1">
                <SuggestInput id={`${row.id}-dosage`} name={`medicines.${index}.dosage`} validate={(value, ctx) => (finalising(ctx) && rowFilled(row) && !String(value ?? "").trim() ? "Dosage is required" : "")} placeholder="e.g. 1 tablet" value={row.dosage} onValueChange={(t) => updateMedicineRow(row.id, "dosage", t)} suggest={(q) => suggestDosage(q, dosageFormById.get(row.medicineId))} />
              </Field>
              <Field label="Frequency" htmlFor={`${row.id}-frequency`} name={`medicines.${index}.frequency`} className="sm:col-span-2 xl:col-span-1">
                <SuggestInput id={`${row.id}-frequency`} name={`medicines.${index}.frequency`} validate={(value, ctx) => (finalising(ctx) && rowFilled(row) && !String(value ?? "").trim() ? "Frequency is required" : "")} placeholder="e.g. bd, tds" value={row.frequency} onValueChange={(t) => updateMedicineRow(row.id, "frequency", t)} suggest={(q) => suggestFrom(FREQUENCIES, q)} />
              </Field>
              <Field label="Duration" htmlFor={`${row.id}-duration`} name={`medicines.${index}.duration`} className="sm:col-span-2 xl:col-span-1">
                <SuggestInput id={`${row.id}-duration`} name={`medicines.${index}.duration`} placeholder="e.g. 5d, 2w" value={row.duration} onValueChange={(t) => updateMedicineRow(row.id, "duration", t)} suggest={suggestDuration} />
              </Field>
              <Field label="Instructions" htmlFor={`${row.id}-notes`} name={`medicines.${index}.instructions`} className="sm:col-span-6 xl:col-span-1">
                <SuggestInput id={`${row.id}-notes`} name={`medicines.${index}.instructions`} maxLength={LIMITS.rowNote} placeholder="e.g. After meals" value={row.instructions} onValueChange={(t) => updateMedicineRow(row.id, "instructions", t)} suggest={(q) => suggestFrom(MEDICINE_INSTRUCTIONS, q)} />
              </Field>
            </div>
          </div>
        ))}
      </FormSection>

      <FormSection
        title="Lab tests"
        description={labTestRows.length ? `${labTestRows.length} ordered` : "Order investigations if needed."}
        columns={1}
        aside={addButton(addLabTestRow, "Add test")}>
        {labTestRows.length === 0 && emptyState(FlaskConical, "No lab tests ordered")}
        {labTestRows.map((row, index) => (
          <div key={row.id} className="flex items-start gap-3 border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
            <div className="pt-8 md:pt-[2.15rem]">{rowNumber(index + 1)}</div>
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Test" htmlFor={`${row.id}-test`} name={`labTests.${index}.labTestId`}>
                <Combobox
                  id={`${row.id}-test`}
                  name={`labTests.${index}.labTestId`}
                  validate={(value, ctx) => (finalising(ctx) && rowFilled(row) && !value ? "Choose a test" : "")}
                  items={labTestItems}
                  value={row.labTestId}
                  onValueChange={(v) => updateLabTestRow(row.id, "labTestId", v)}
                  placeholder="Search test"
                  emptyText="No tests match"
                />
              </Field>
              <Field label="Instructions" htmlFor={`${row.id}-test-notes`} name={`labTests.${index}.instructions`}>
                <SuggestInput id={`${row.id}-test-notes`} name={`labTests.${index}.instructions`} maxLength={LIMITS.rowNote} placeholder="e.g. Fasting" value={row.instructions} onValueChange={(t) => updateLabTestRow(row.id, "instructions", t)} suggest={(q) => suggestFrom(LAB_INSTRUCTIONS, q)} />
              </Field>
            </div>
            <div className="pt-7">{removeButton(() => removeLabTestRow(row.id), `Remove lab test ${index + 1}`)}</div>
          </div>
        ))}
      </FormSection>

      <FormSection title="Advice & follow-up" description="Printed at the bottom of the prescription." columns={1}>
        <Field label="Advice" htmlFor="advice">
          <TextArea id="advice" name="advice" label="Advice" maxLength={LIMITS.clinical} rows={3} placeholder="e.g. Rest, plenty of fluids, follow up in 5 days" defaultValue={initialData?.advice ?? ""} />
          <QuickChips targetId="advice" chips={ADVICE_CHIPS} />
        </Field>
      </FormSection>

      <FormStatus />
      <PrescriptionActions />
    </Form>
  );
}

/**
 * Save draft / Finalise. Finalise first runs every inline check with the
 * finalise-only rules (diagnosis, complete medicine rows) and opens the
 * confirmation only when they pass, so problems are shown on the exact cells.
 */
function PrescriptionActions() {
  const form = useFormContext();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [intent, setIntent] = useState("draft");
  const pending = form.pending;

  return (
    <>
      <FormActions>
        <Button type="submit" variant="outline" disabled={pending} onClick={() => setIntent("draft")} className="h-11 px-5">
          {pending && intent === "draft" ? "Saving draft…" : "Save draft"}
        </Button>
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            if (form.validate({ intent: "finalized" })) setConfirmOpen(true);
          }}
          className="h-11 gap-2 px-6">
          <CheckCircle className="size-4" />
          {pending && intent === "finalized" ? "Finalising…" : "Finalise prescription"}
        </Button>
      </FormActions>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Finalise this prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              Once finalised it can&apos;t be edited. It gets a verification QR code and becomes visible to the
              patient. Check the medicines and doses before you continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                setIntent("finalized");
                form.submit({ intent: "finalized" });
              }}>
              Finalise
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}