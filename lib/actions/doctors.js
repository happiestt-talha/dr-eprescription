"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { ActionError, FieldErrors, safely } from "@/lib/action-errors";
import { createReader, id } from "@/lib/validate";
import { LIMITS } from "@/lib/rules";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// The UI always renders "Dr. {fullName}", so store the name without the title.
function stripDoctorTitle(name) {
  return name ? name.replace(/^\s*dr\.?\s+/i, "").trim() : name;
}

const TX = { maxWait: 10000, timeout: 20000 };

/**
 * Profile fields shared by create and update, read with `r` so every invalid
 * field is reported. Columns that are NOT NULL default to "".
 */
function readProfile(r) {
  return {
    fullName: stripDoctorTitle(r.personName("fullName", { label: "Full name", required: true })),
    qualification: r.title("qualification", { label: "Qualification" }) ?? "",
    specialization: r.title("specialization", { label: "Specialisation" }) ?? "",
    registrationNo: r.code("registrationNo", { label: "Registration number", required: true }),
    phone: r.phonePK("phone", { label: "Contact phone" }) ?? "",
    clinicName: r.title("clinicName", { label: "Clinic name" }) ?? "",
    clinicAddress: r.text("clinicAddress", { label: "Clinic address", max: LIMITS.address }) ?? "",
  };
}

export async function createDoctor(formData) {
  return safely(async () => {
    const session = await requireRole("admin");

    const r = createReader(formData);
    const email = r.email("email", { required: true });
    const password = r.password("password", { label: "Temporary password" });
    const profile = readProfile(r);
    r.done();

    const [emailTaken, regTaken] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      prisma.doctor.findUnique({ where: { registrationNo: profile.registrationNo }, select: { id: true } }),
    ]);
    const duplicates = {};
    if (emailTaken) duplicates.email = "An account with this email already exists";
    if (regTaken) duplicates.registrationNo = "Another doctor already uses this registration number";
    if (Object.keys(duplicates).length) throw new FieldErrors(duplicates);

    const passwordHash = await bcrypt.hash(password, 10);

    const doctor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash, role: "doctor", isActive: true, mustChangePassword: true } });
      const doctor = await tx.doctor.create({ data: { userId: user.id, ...profile } });
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "created_doctor",
          entityType: "doctor",
          entityId: doctor.id,
          details: { fullName: profile.fullName, email },
        },
      });
      return doctor;
    }, TX);

    revalidatePath("/admin/doctors");
    return { success: true, doctorId: doctor.id };
  });
}

export async function toggleDoctorActive(doctorId, nextActive) {
  return safely(async () => {
    const session = await requireRole("admin");
    const active = nextActive === true;

    // The user to (de)activate is looked up from the doctor, never taken from
    // the client, so this can only ever switch a doctor's own account.
    const doctor = await prisma.doctor.findUnique({
      where: { id: id(doctorId, "Doctor") },
      select: { id: true, userId: true, user: { select: { role: true } } },
    });
    if (!doctor || doctor.user.role !== "doctor") throw new ActionError("Doctor not found");

    await prisma.$transaction([
      prisma.user.update({ where: { id: doctor.userId }, data: { isActive: active } }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: active ? "activated_doctor" : "deactivated_doctor",
          entityType: "doctor",
          entityId: doctor.id,
        },
      }),
    ]);

    revalidatePath("/admin/doctors");
    return { success: true };
  });
}

export async function updateDoctor(doctorId, formData) {
  return safely(async () => {
    const session = await requireRole("admin");
    const existing = await prisma.doctor.findUnique({ where: { id: id(doctorId, "Doctor") } });
    if (!existing) throw new ActionError("Doctor not found");
    const r = createReader(formData);
    const profile = readProfile(r);
    r.done();

    const duplicate = await prisma.doctor.findFirst({
      where: { registrationNo: profile.registrationNo, NOT: { id: existing.id } },
      select: { id: true },
    });
    if (duplicate) throw new FieldErrors({ registrationNo: "Another doctor already uses this registration number" });

    const changed = Object.keys(profile).filter((k) => profile[k] !== existing[k]);
    await prisma.$transaction([
      prisma.doctor.update({ where: { id: existing.id }, data: profile }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "updated_doctor",
          entityType: "doctor",
          entityId: existing.id,
          details: { changedFields: changed },
        },
      }),
    ]);

    revalidatePath("/admin/doctors");
    revalidatePath(`/admin/doctors/${existing.id}`);
    return { success: true };
  });
}
