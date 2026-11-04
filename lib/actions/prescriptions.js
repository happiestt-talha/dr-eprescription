"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { nextPrescriptionCode, withUniqueRetry } from "@/lib/codes";
import { ActionError, safely } from "@/lib/action-errors";
import { verifyPath } from "@/lib/verify";
import { createReader, id, jsonRows } from "@/lib/validate";
import { LIMITS, isUuid } from "@/lib/rules";
import { revalidatePath } from "next/cache";

const TX = { maxWait: 10000, timeout: 30000 };

async function requireDoctor() {
  const session = await requireRole("doctor");
  const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } });
  if (!doctor) throw new ActionError("Your doctor profile isn't set up. Please contact an administrator.");
  return { session, doctor };
}

/**
 * Validate and coerce everything the prescription form sends, reporting every
 * problem at once. Row errors are keyed by the row's position in the form,
 * e.g. "medicines.2.dosage", so the exact cell is highlighted.
 */
async function readPrescription(formData) {
  const r = createReader(formData);
  const intent = r.raw("intent") === "finalized" ? "finalized" : "draft";
  const symptoms = r.text("symptoms", { label: "Symptoms", max: LIMITS.clinical, multiline: true });
  const diagnosis = r.text("diagnosis", { label: "Diagnosis", max: LIMITS.clinical, multiline: true });
  const advice = r.text("advice", { label: "Advice", max: LIMITS.clinical, multiline: true });

  const vitals = {
    heightCm: r.measure("heightCm", { measure: "heightCm" }),
    weightKg: r.measure("weightKg", { measure: "weightKg" }),
    bloodPressure: r.bloodPressure("bloodPressure"),
    temperatureF: r.measure("temperatureF", { measure: "temperatureF" }),
    pulseRate: r.measure("pulseRate", { measure: "pulseRate" }),
    spo2: r.measure("spo2", { measure: "spo2" }),
  };
  const hasVitals = Object.values(vitals).some((v) => v !== null);

  // Fully empty rows are ignored; partly filled ones must be completed to finalize.
  const medicineRows = jsonRows(formData, "medicinesData", {
    label: "Medicines",
    maxRows: 30,
    fields: ["medicineId", "dosage", "frequency", "duration", "instructions"],
    maxLen: { medicineId: 36, dosage: LIMITS.rowText, frequency: LIMITS.rowText, duration: LIMITS.rowText, instructions: LIMITS.rowNote },
    reader: r,
    prefix: "medicines",
  })
    .map((row, index) => ({ ...row, index }))
    .filter((m) => m.medicineId || m.dosage || m.frequency || m.duration || m.instructions);
  const labTestRows = jsonRows(formData, "labTestsData", {
    label: "Lab tests",
    maxRows: 20,
    fields: ["labTestId", "instructions"],
    maxLen: { labTestId: 36, instructions: LIMITS.rowNote },
    reader: r,
    prefix: "labTests",
  })
    .map((row, index) => ({ ...row, index }))
    .filter((t) => t.labTestId || t.instructions);

  for (const m of medicineRows) if (m.medicineId && !isUuid(m.medicineId)) r.fail(`medicines.${m.index}.medicineId`, "Pick the medicine again");
  for (const t of labTestRows) if (t.labTestId && !isUuid(t.labTestId)) r.fail(`labTests.${t.index}.labTestId`, "Pick the test again");

  if (intent === "finalized") {
    if (!diagnosis && !r.has("diagnosis")) r.fail("diagnosis", "A diagnosis is required to finalise");
    for (const m of medicineRows) {
      if (!m.medicineId) r.fail(`medicines.${m.index}.medicineId`, "Choose a medicine");
      if (!m.dosage) r.fail(`medicines.${m.index}.dosage`, "Dosage is required");
      if (!m.frequency) r.fail(`medicines.${m.index}.frequency`, "Frequency is required");
    }
    for (const t of labTestRows) if (!t.labTestId) r.fail(`labTests.${t.index}.labTestId`, "Choose a test");
  }
  r.done();

  const medicineIds = [...new Set(medicineRows.map((m) => m.medicineId).filter(Boolean))];
  const labTestIds = [...new Set(labTestRows.map((t) => t.labTestId).filter(Boolean))];
  const [knownMeds, knownTests] = await Promise.all([
    medicineIds.length ? prisma.medicine.count({ where: { id: { in: medicineIds } } }) : 0,
    labTestIds.length ? prisma.labTest.count({ where: { id: { in: labTestIds } } }) : 0,
  ]);
  if (knownMeds !== medicineIds.length) throw new ActionError("A selected medicine no longer exists. Please pick it again.");
  if (knownTests !== labTestIds.length) throw new ActionError("A selected lab test no longer exists. Please pick it again.");

  return {
    intent,
    fields: { symptoms, diagnosis, advice },
    vitals: hasVitals ? vitals : null,
    medicines: medicineRows
      .filter((m) => m.medicineId)
      .map((m) => ({
        medicineId: m.medicineId,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions || null,
      })),
    labTests: labTestRows
      .filter((t) => t.labTestId)
      .map((t) => ({ labTestId: t.labTestId, instructions: t.instructions || null })),
  };
}

async function writeChildren(tx, prescriptionId, { vitals, medicines, labTests }) {
  if (vitals) await tx.vitals.create({ data: { prescriptionId, ...vitals } });
  if (medicines.length) {
    await tx.prescriptionMedicine.createMany({ data: medicines.map((m) => ({ ...m, prescriptionId })) });
  }
  if (labTests.length) {
    await tx.prescriptionLabTest.createMany({ data: labTests.map((t) => ({ ...t, prescriptionId })) });
  }
}

export async function createPrescription(formData) {
  return safely(async () => {
    const { session, doctor } = await requireDoctor();
    const patientId = id(formData.get("patientId"), "Patient");
    const input = await readPrescription(formData);

    const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
    if (!patient) throw new ActionError("Patient not found");

    const prescription = await withUniqueRetry(
      () =>
        prisma.$transaction(async (tx) => {
          const prescriptionCode = await nextPrescriptionCode(tx);
          const finalized = input.intent === "finalized";
          const rx = await tx.prescription.create({
            data: {
              prescriptionCode,
              patientId,
              doctorId: doctor.id,
              ...input.fields,
              status: input.intent,
              ...(finalized ? { qrCodeUrl: verifyPath(prescriptionCode) } : {}),
            },
          });
          if (finalized) {
            await tx.prescription.update({ where: { id: rx.id }, data: { pdfUrl: `/api/prescriptions/${rx.id}/pdf` } });
          }
          await writeChildren(tx, rx.id, input);
          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              action: finalized ? "finalized_prescription" : "saved_draft_prescription",
              entityType: "prescription",
              entityId: rx.id,
              details: { patientId, prescriptionCode },
            },
          });
          return rx;
        }, TX),
      "prescriptionCode"
    );

    revalidatePath(`/doctor/patients/${patientId}`);
    revalidatePath(`/doctor/prescriptions/${prescription.id}`);
    revalidatePath("/doctor/drafts");
    return { success: true, prescriptionId: prescription.id };
  });
}

export async function updatePrescription(prescriptionId, formData) {
  return safely(async () => {
    const { session, doctor } = await requireDoctor();
    const rx = await prisma.prescription.findUnique({ where: { id: id(prescriptionId, "Prescription") } });
    if (!rx || rx.doctorId !== doctor.id) throw new ActionError("Prescription not found");
    if (rx.status === "finalized") {
      throw new ActionError("Finalised prescriptions can't be edited");
    }

    const input = await readPrescription(formData);
    const finalized = input.intent === "finalized";

    await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction: another tab may have finalized it meanwhile.
      const { count } = await tx.prescription.updateMany({
        where: { id: rx.id, doctorId: doctor.id, status: "draft" },
        data: {
          ...input.fields,
          status: input.intent,
          ...(finalized
            ? {
                // The prescription is issued when it's finalized, not when the draft was started.
                visitDate: new Date(),
                qrCodeUrl: verifyPath(rx.prescriptionCode),
                pdfUrl: `/api/prescriptions/${rx.id}/pdf`,
              }
            : {}),
        },
      });
      if (count === 0) throw new ActionError("This prescription was finalised in another tab or session and can no longer be edited");

      // Simplest correct approach for an edit: clear and recreate the child
      // rows rather than diffing them.
      await tx.vitals.deleteMany({ where: { prescriptionId: rx.id } });
      await tx.prescriptionMedicine.deleteMany({ where: { prescriptionId: rx.id } });
      await tx.prescriptionLabTest.deleteMany({ where: { prescriptionId: rx.id } });
      await writeChildren(tx, rx.id, input);

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: finalized ? "finalized_prescription" : "updated_draft_prescription",
          entityType: "prescription",
          entityId: rx.id,
        },
      });
    }, TX);

    revalidatePath(`/doctor/prescriptions/${rx.id}`);
    revalidatePath("/doctor/drafts");
    return { success: true, prescriptionId: rx.id };
  });
}
