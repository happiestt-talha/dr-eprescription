"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function createLabTest(formData) {
  const session = await requireAdmin();

  const name = formData.get("name");
  const category = formData.get("category");
  const normalRange = formData.get("normalRange");

  if (!name) return { error: "Test name is required" };

  const labTest = await prisma.labTest.create({
    data: { name, category, normalRange },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "created_lab_test",
      entityType: "lab_test",
      entityId: labTest.id,
      details: { name },
    },
  });

  revalidatePath("/admin/lab-tests");
  return { success: true };
}

export async function updateLabTest(id, formData) {
  const session = await requireAdmin();

  const name = formData.get("name");
  const category = formData.get("category");
  const normalRange = formData.get("normalRange");

  if (!name) return { error: "Test name is required" };

  await prisma.labTest.update({
    where: { id },
    data: { name, category, normalRange },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "updated_lab_test",
      entityType: "lab_test",
      entityId: id,
    },
  });

  revalidatePath("/admin/lab-tests");
  return { success: true };
}

export async function deleteLabTest(id) {
  const session = await requireAdmin();

  const inUse = await prisma.prescriptionLabTest.findFirst({
    where: { labTestId: id },
  });
  if (inUse) {
    return { error: "Can't delete: this test has already been used in a prescription" };
  }

  await prisma.labTest.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "deleted_lab_test",
      entityType: "lab_test",
      entityId: id,
    },
  });

  revalidatePath("/admin/lab-tests");
  return { success: true };
}