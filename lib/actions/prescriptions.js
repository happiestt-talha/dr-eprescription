"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { nextPrescriptionCode, withUniqueRetry } from "@/lib/codes";
import { ActionError, safely } from "@/lib/action-errors";
import { verifyPath } from "@/lib/verify";
import { bloodPressure, id, jsonRows, num, str } from "@/lib/validate";
import { revalidatePath } from "next/cache";

const TX = { maxWait: 10000, timeout: 30000 };

async function requireDoctor() {
  const session = await requireRole("doctor");
  const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } });
  if (!doctor) throw new ActionError("Your doctor profile isn't set up. Please contact an administrator.");
  return { session, doctor };
}

/** Validate and coerce everything the prescription form sends. */
async function readPrescription(formData) {
  const intent = formData.get("intent") === "finalized" ? "finalized" : "draft";
  const symptoms = str(formData, "symptoms", { label: "Symptoms", max: 2000, multiline: true });
  const diagnosis = str(formData, "diagnosis", { label: "Diagnosis", max: 2000, multiline: true });
  const advice = str(formData, "advice", { label: "Advice", max: 2000, multiline: true });

  const vitals = {
    heightCm: num(formData, "heightCm", { label: "Height (cm)", min: 20, max: 260 }),
    weightKg: num(formData, "weightKg", { label: "Weight (kg)", min: 0.5, max: 400 }),
    bloodPressure: bloodPressure(formData, "bloodPressure"),
    temperatureF: num(formData, "temperatureF", { label: "Temperature (°F)", min: 80, max: 115 }),
    pulseRate: num(formData, "pulseRate", { label: "Pulse", min: 20, max: 250, integer: true }),
    spo2: num(formData, "spo2", { label: "SpO2", min: 50, max: 100 }),
  };
  const hasVitals = Object.values(vitals).some((v) => v !== null);

  // Fully empty rows are ignored; partly filled ones must be completed to finalize.
  const medicineRows = jsonRows(formData, "medicinesData", {
    label: "Medicines",
    maxRows: 30,
    fields: ["medicineId", "dosage", "frequency", "duration", "instructions"],
  }).filter((m) => Object.values(m).some(Boolean));
  const labTestRows = jsonRows(formData, "labTestsData", {
    label: "Lab tests",
    maxRows: 20,
    fields: ["labTestId", "instructions"],
  }).filter((t) => t.labTestId || t.instructions);

  if (intent === "finalized") {
    if (!diagnosis) throw new ActionError("Diagnosis is required to finalize a prescription");
    if (medicineRows.some((m) => !m.medicineId || !m.dosage || !m.frequency)) {
      throw new ActionError("Every medicine row needs a medicine, dosage, and frequency");
    }
    if (labTestRows.some((t) => !t.labTestId)) throw new ActionError("Every lab test row needs a test");
  }

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
    const patientId = id(str(formData, "patientId", { label: "Patient", required: true }), "Patient");
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
      throw new ActionError("Finalized prescriptions can't be edited, to keep the medical record intact");
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
      if (count === 0) throw new ActionError("This prescription was finalized elsewhere and can no longer be edited");

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
