"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireDoctor() {
  const session = await auth();
  if (!session || session.user.role !== "doctor") {
    throw new Error("Not authorized");
  }
  const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } });
  if (!doctor) throw new Error("Doctor profile not found");
  return { session, doctor };
}

async function generatePrescriptionCode() {
  const count = await prisma.prescription.count();
  return `RX-${String(count + 1).padStart(5, "0")}`;
}

export async function createPrescription(formData) {
  const { session, doctor } = await requireDoctor();

  const patientId = formData.get("patientId");
  const symptoms = formData.get("symptoms");
  const diagnosis = formData.get("diagnosis");
  const advice = formData.get("advice");
  const intent = formData.get("intent"); // "draft" | "finalized"

  const heightCm = formData.get("heightCm");
  const weightKg = formData.get("weightKg");
  const bloodPressure = formData.get("bloodPressure");
  const temperatureF = formData.get("temperatureF");
  const pulseRate = formData.get("pulseRate");
  const spo2 = formData.get("spo2");

  let medicines = [];
  let labTests = [];
  try {
    medicines = JSON.parse(formData.get("medicinesData") || "[]");
    labTests = JSON.parse(formData.get("labTestsData") || "[]");
  } catch {
    return { error: "Something went wrong reading the medicine/lab test rows" };
  }

  if (!patientId) return { error: "No patient selected" };

  if (intent === "finalized") {
    if (!diagnosis) return { error: "Diagnosis is required to finalize a prescription" };
    const incompleteMed = medicines.find((m) => !m.medicineId || !m.dosage || !m.frequency);
    if (incompleteMed) return { error: "Every medicine row needs a medicine, dosage, and frequency" };
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return { error: "Patient not found" };

  const prescriptionCode = await generatePrescriptionCode();

  const hasVitals = heightCm || weightKg || bloodPressure || temperatureF || pulseRate || spo2;

  const prescription = await prisma.$transaction(async (tx) => {
    const rx = await tx.prescription.create({
      data: {
        prescriptionCode,
        patientId,
        doctorId: doctor.id,
        symptoms: symptoms || null,
        diagnosis: diagnosis || null,
        advice: advice || null,
        status: intent === "finalized" ? "finalized" : "draft",
      },
    });

    if (intent === "finalized") {
      await tx.prescription.update({
        where: { id: rx.id },
        data: {
          qrCodeUrl: `/verify/${prescriptionCode}`,
          pdfUrl: `/api/prescriptions/${rx.id}/pdf`,
        },
      });
    }

    if (hasVitals) {
      await tx.vitals.create({
        data: {
          prescriptionId: rx.id,
          heightCm: heightCm ? parseFloat(heightCm) : null,
          weightKg: weightKg ? parseFloat(weightKg) : null,
          bloodPressure: bloodPressure || null,
          temperatureF: temperatureF ? parseFloat(temperatureF) : null,
          pulseRate: pulseRate ? parseInt(pulseRate, 10) : null,
          spo2: spo2 ? parseFloat(spo2) : null,
        },
      });
    }

    for (const med of medicines) {
      if (!med.medicineId) continue;
      await tx.prescriptionMedicine.create({
        data: {
          prescriptionId: rx.id,
          medicineId: med.medicineId,
          dosage: med.dosage || "",
          frequency: med.frequency || "",
          duration: med.duration || "",
          instructions: med.instructions || null,
        },
      });
    }

    for (const test of labTests) {
      if (!test.labTestId) continue;
      await tx.prescriptionLabTest.create({
        data: {
          prescriptionId: rx.id,
          labTestId: test.labTestId,
          instructions: test.instructions || null,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: intent === "finalized" ? "finalized_prescription" : "saved_draft_prescription",
        entityType: "prescription",
        entityId: rx.id,
        details: { patientId, prescriptionCode },
      },
    });

    return rx;
  });

  revalidatePath(`/doctor/patients/${patientId}`);
  revalidatePath(`/doctor/prescriptions/${prescription.id}`);
  return { success: true, prescriptionId: prescription.id };
}

export async function updatePrescription(prescriptionId, formData) {
  const { session, doctor } = await requireDoctor();

  const rx = await prisma.prescription.findUnique({ where: { id: prescriptionId } });
  if (!rx) return { error: "Prescription not found" };
  if (rx.doctorId !== doctor.id) return { error: "Not authorized" };
  if (rx.status === "finalized") {
    return { error: "Finalized prescriptions can't be edited, to keep the medical record intact" };
  }

  const symptoms = formData.get("symptoms");
  const diagnosis = formData.get("diagnosis");
  const advice = formData.get("advice");
  const intent = formData.get("intent");

  const heightCm = formData.get("heightCm");
  const weightKg = formData.get("weightKg");
  const bloodPressure = formData.get("bloodPressure");
  const temperatureF = formData.get("temperatureF");
  const pulseRate = formData.get("pulseRate");
  const spo2 = formData.get("spo2");

  let medicines = [];
  let labTests = [];
  try {
    medicines = JSON.parse(formData.get("medicinesData") || "[]");
    labTests = JSON.parse(formData.get("labTestsData") || "[]");
  } catch {
    return { error: "Something went wrong reading the medicine/lab test rows" };
  }

  if (intent === "finalized") {
    if (!diagnosis) return { error: "Diagnosis is required to finalize a prescription" };
    const incompleteMed = medicines.find((m) => !m.medicineId || !m.dosage || !m.frequency);
    if (incompleteMed) return { error: "Every medicine row needs a medicine, dosage, and frequency" };
  }

  const hasVitals = heightCm || weightKg || bloodPressure || temperatureF || pulseRate || spo2;

  await prisma.$transaction(async (tx) => {
    await tx.prescription.update({
      where: { id: prescriptionId },
      data: {
        symptoms: symptoms || null,
        diagnosis: diagnosis || null,
        advice: advice || null,
        status: intent === "finalized" ? "finalized" : "draft",
        ...(intent === "finalized"
          ? {
              qrCodeUrl: `/verify/${rx.prescriptionCode}`,
              pdfUrl: `/api/prescriptions/${prescriptionId}/pdf`,
            }
          : {}),
      },
    });

    // Simplest correct approach for an edit: clear and recreate the child
    // rows rather than diffing them. At this scale the extra writes cost
    // nothing, and it avoids a much fiddlier "match up old vs new rows" bug.
    await tx.vitals.deleteMany({ where: { prescriptionId } });
    if (hasVitals) {
      await tx.vitals.create({
        data: {
          prescriptionId,
          heightCm: heightCm ? parseFloat(heightCm) : null,
          weightKg: weightKg ? parseFloat(weightKg) : null,
          bloodPressure: bloodPressure || null,
          temperatureF: temperatureF ? parseFloat(temperatureF) : null,
          pulseRate: pulseRate ? parseInt(pulseRate, 10) : null,
          spo2: spo2 ? parseFloat(spo2) : null,
        },
      });
    }

    await tx.prescriptionMedicine.deleteMany({ where: { prescriptionId } });
    for (const med of medicines) {
      if (!med.medicineId) continue;
      await tx.prescriptionMedicine.create({
        data: {
          prescriptionId,
          medicineId: med.medicineId,
          dosage: med.dosage || "",
          frequency: med.frequency || "",
          duration: med.duration || "",
          instructions: med.instructions || null,
        },
      });
    }

    await tx.prescriptionLabTest.deleteMany({ where: { prescriptionId } });
    for (const test of labTests) {
      if (!test.labTestId) continue;
      await tx.prescriptionLabTest.create({
        data: {
          prescriptionId,
          labTestId: test.labTestId,
          instructions: test.instructions || null,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: intent === "finalized" ? "finalized_prescription" : "updated_draft_prescription",
        entityType: "prescription",
        entityId: prescriptionId,
      },
    });
  });

  revalidatePath(`/doctor/prescriptions/${prescriptionId}`);
  revalidatePath("/doctor/drafts");
  return { success: true, prescriptionId };
}