"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { ActionError, safely } from "@/lib/action-errors";
import { id, str, strength } from "@/lib/validate";
import { revalidatePath } from "next/cache";

function readMedicine(formData) {
  return {
    name: str(formData, "name", { label: "Medicine name", required: true, max: 120 }),
    genericName: str(formData, "genericName", { label: "Generic name", max: 120 }),
    dosageForm: str(formData, "dosageForm", { label: "Dosage form", max: 40 }),
    strength: strength(formData, "strength"),
    manufacturer: str(formData, "manufacturer", { label: "Manufacturer", max: 120 }),
  };
}

function audit(session, action, entityId, details) {
  return prisma.auditLog.create({
    data: { userId: session.user.id, action, entityType: "medicine", entityId, ...(details ? { details } : {}) },
  });
}

export async function createMedicine(formData) {
  return safely(async () => {
    const session = await requireRole("admin");
    const data = readMedicine(formData);
    await prisma.$transaction(async (tx) => {
      const medicine = await tx.medicine.create({ data });
      await tx.auditLog.create({
        data: { userId: session.user.id, action: "created_medicine", entityType: "medicine", entityId: medicine.id, details: { name: data.name } },
      });
    }, { maxWait: 10000, timeout: 20000 });
    revalidatePath("/admin/medicines");
    return { success: true };
  });
}

export async function updateMedicine(medicineId, formData) {
  return safely(async () => {
    const session = await requireRole("admin");
    const data = readMedicine(formData);
    const medicine = await prisma.medicine.findUnique({ where: { id: id(medicineId, "Medicine") } });
    if (!medicine) throw new ActionError("Medicine not found");
    await prisma.$transaction([
      prisma.medicine.update({ where: { id: medicine.id }, data }),
      audit(session, "updated_medicine", medicine.id, { from: medicine.name, to: data.name }),
    ]);
    revalidatePath("/admin/medicines");
    return { success: true };
  });
}

export async function deleteMedicine(medicineId) {
  return safely(async () => {
    const session = await requireRole("admin");
    const medicineIdChecked = id(medicineId, "Medicine");
    await prisma.$transaction(async (tx) => {
      const inUse = await tx.prescriptionMedicine.findFirst({ where: { medicineId: medicineIdChecked } });
      if (inUse) throw new ActionError("Can't delete: this medicine has already been used in a prescription");
      await tx.medicine.delete({ where: { id: medicineIdChecked } });
      await tx.auditLog.create({
        data: { userId: session.user.id, action: "deleted_medicine", entityType: "medicine", entityId: medicineIdChecked },
      });
    }, { maxWait: 10000, timeout: 20000 });
    revalidatePath("/admin/medicines");
    return { success: true };
  });
}
