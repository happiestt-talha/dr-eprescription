"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { ActionError, safely } from "@/lib/action-errors";
import { createReader, id } from "@/lib/validate";
import { LIMITS } from "@/lib/rules";
import { revalidatePath } from "next/cache";

function readMedicine(formData) {
  const r = createReader(formData);
  const data = {
    name: r.text("name", { label: "Brand name", required: true, max: LIMITS.shortText }),
    genericName: r.text("genericName", { label: "Generic name", max: LIMITS.shortText }),
    dosageForm: r.dosageForm("dosageForm"),
    strength: r.strength("strength"),
    manufacturer: r.text("manufacturer", { label: "Manufacturer", max: LIMITS.shortText }),
  };
  r.done();
  return data;
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
