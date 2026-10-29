"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { ActionError, safely } from "@/lib/action-errors";
import { id, str } from "@/lib/validate";
import { revalidatePath } from "next/cache";

function readLabTest(formData) {
  return {
    name: str(formData, "name", { label: "Test name", required: true, max: 120 }),
    category: str(formData, "category", { label: "Category", max: 60 }),
    normalRange: str(formData, "normalRange", { label: "Normal range", max: 120 }),
  };
}

function audit(session, action, entityId, details) {
  return prisma.auditLog.create({
    data: { userId: session.user.id, action, entityType: "lab_test", entityId, ...(details ? { details } : {}) },
  });
}

export async function createLabTest(formData) {
  return safely(async () => {
    const session = await requireRole("admin");
    const data = readLabTest(formData);
    await prisma.$transaction(async (tx) => {
      const labTest = await tx.labTest.create({ data });
      await tx.auditLog.create({
        data: { userId: session.user.id, action: "created_lab_test", entityType: "lab_test", entityId: labTest.id, details: { name: data.name } },
      });
    }, { maxWait: 10000, timeout: 20000 });
    revalidatePath("/admin/lab-tests");
    return { success: true };
  });
}

export async function updateLabTest(labTestId, formData) {
  return safely(async () => {
    const session = await requireRole("admin");
    const data = readLabTest(formData);
    const labTest = await prisma.labTest.findUnique({ where: { id: id(labTestId, "Lab test") } });
    if (!labTest) throw new ActionError("Lab test not found");
    await prisma.$transaction([
      prisma.labTest.update({ where: { id: labTest.id }, data }),
      audit(session, "updated_lab_test", labTest.id, { from: labTest.name, to: data.name }),
    ]);
    revalidatePath("/admin/lab-tests");
    return { success: true };
  });
}

export async function deleteLabTest(labTestId) {
  return safely(async () => {
    const session = await requireRole("admin");
    const labTestIdChecked = id(labTestId, "Lab test");
    await prisma.$transaction(async (tx) => {
      const inUse = await tx.prescriptionLabTest.findFirst({ where: { labTestId: labTestIdChecked } });
      if (inUse) throw new ActionError("Can't delete: this test has already been used in a prescription");
      await tx.labTest.delete({ where: { id: labTestIdChecked } });
      await tx.auditLog.create({
        data: { userId: session.user.id, action: "deleted_lab_test", entityType: "lab_test", entityId: labTestIdChecked },
      });
    }, { maxWait: 10000, timeout: 20000 });
    revalidatePath("/admin/lab-tests");
    return { success: true };
  });
}
