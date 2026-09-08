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

export async function createMedicine(formData) {
  const session = await requireAdmin();

  const name = formData.get("name");
  const genericName = formData.get("genericName");
  const dosageForm = formData.get("dosageForm");
  const strength = formData.get("strength");
  const manufacturer = formData.get("manufacturer");

  if (!name) return { error: "Medicine name is required" };

  const medicine = await prisma.medicine.create({
    data: { name, genericName, dosageForm, strength, manufacturer },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "created_medicine",
      entityType: "medicine",
      entityId: medicine.id,
      details: { name },
    },
  });

  revalidatePath("/admin/medicines");
  return { success: true };
}

export async function updateMedicine(id, formData) {
  const session = await requireAdmin();

  const name = formData.get("name");
  const genericName = formData.get("genericName");
  const dosageForm = formData.get("dosageForm");
  const strength = formData.get("strength");
  const manufacturer = formData.get("manufacturer");

  if (!name) return { error: "Medicine name is required" };

  await prisma.medicine.update({
    where: { id },
    data: { name, genericName, dosageForm, strength, manufacturer },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "updated_medicine",
      entityType: "medicine",
      entityId: id,
    },
  });

  revalidatePath("/admin/medicines");
  return { success: true };
}

export async function deleteMedicine(id) {
  const session = await requireAdmin();

  const inUse = await prisma.prescriptionMedicine.findFirst({
    where: { medicineId: id },
  });
  if (inUse) {
    return { error: "Can't delete: this medicine has already been used in a prescription" };
  }

  await prisma.medicine.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "deleted_medicine",
      entityType: "medicine",
      entityId: id,
    },
  });

  revalidatePath("/admin/medicines");
  return { success: true };
}