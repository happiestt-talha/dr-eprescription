"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function createDoctor(formData) {
  const session = await requireAdmin();

  const email = formData.get("email");
  const password = formData.get("password");
  const fullName = formData.get("fullName");
  const qualification = formData.get("qualification");
  const specialization = formData.get("specialization");
  const registrationNo = formData.get("registrationNo");
  const phone = formData.get("phone");
  const clinicName = formData.get("clinicName");
  const clinicAddress = formData.get("clinicAddress");

  if (!email || !password || !fullName || !registrationNo) {
    return { error: "Missing required fields" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A user with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const doctor = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, role: "doctor", isActive: true },
    });

    const doctor = await tx.doctor.create({
      data: {
        userId: user.id,
        fullName,
        qualification,
        specialization,
        registrationNo,
        phone,
        clinicName,
        clinicAddress,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "created_doctor",
        entityType: "doctor",
        entityId: doctor.id,
        details: { fullName, email },
      },
    });

    return doctor;
  });

  revalidatePath("/admin/doctors");
  return { success: true, doctorId: doctor.id };
}

export async function toggleDoctorActive(doctorId, userId, nextActive) {
  const session = await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: nextActive },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: nextActive ? "activated_doctor" : "deactivated_doctor",
      entityType: "doctor",
      entityId: doctorId,
    },
  });

  revalidatePath("/admin/doctors");
  return { success: true };
}

export async function updateDoctor(doctorId, formData) {
  const session = await requireAdmin();

  const fullName = formData.get("fullName");
  const qualification = formData.get("qualification");
  const specialization = formData.get("specialization");
  const registrationNo = formData.get("registrationNo");
  const phone = formData.get("phone");
  const clinicName = formData.get("clinicName");
  const clinicAddress = formData.get("clinicAddress");

  if (!fullName || !registrationNo) {
    return { error: "Missing required fields" };
  }

  const duplicate = await prisma.doctor.findFirst({
    where: { registrationNo, NOT: { id: doctorId } },
  });
  if (duplicate) {
    return { error: "Another doctor already uses this registration number" };
  }

  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      fullName,
      qualification,
      specialization,
      registrationNo,
      phone,
      clinicName,
      clinicAddress,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "updated_doctor",
      entityType: "doctor",
      entityId: doctorId,
    },
  });

  revalidatePath("/admin/doctors");
  revalidatePath(`/admin/doctors/${doctorId}`);
  return { success: true };
}