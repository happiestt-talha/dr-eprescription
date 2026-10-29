"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { ActionError, safely } from "@/lib/action-errors";
import { code, email as emailField, id, personName, phonePK, str, title } from "@/lib/validate";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// The UI always renders "Dr. {fullName}", so store the name without the title.
function stripDoctorTitle(name) {
  return name ? name.replace(/^\s*dr\.?\s+/i, "").trim() : name;
}

const MIN_PASSWORD_LENGTH = 10;
const TX = { maxWait: 10000, timeout: 20000 };

/** Profile fields shared by create and update. Columns that are NOT NULL default to "". */
function readProfile(formData) {
  return {
    fullName: stripDoctorTitle(personName(formData, "fullName", { label: "Full name", required: true })),
    qualification: title(formData, "qualification", { label: "Qualification" }) ?? "",
    specialization: title(formData, "specialization", { label: "Specialization" }) ?? "",
    registrationNo: code(formData, "registrationNo", { label: "Registration number", required: true }),
    phone: phonePK(formData, "phone", { label: "Contact phone" }) ?? "",
    clinicName: title(formData, "clinicName", { label: "Clinic name" }) ?? "",
    clinicAddress: str(formData, "clinicAddress", { label: "Clinic address", max: 300 }) ?? "",
  };
}

export async function createDoctor(formData) {
  return safely(async () => {
    const session = await requireRole("admin");

    const email = emailField(formData, "email", { required: true });
    const password = formData.get("password");
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH || password.length > 200) {
      throw new ActionError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    const profile = readProfile(formData);

    if (await prisma.user.findUnique({ where: { email } })) {
      throw new ActionError("A user with this email already exists");
    }
    if (await prisma.doctor.findUnique({ where: { registrationNo: profile.registrationNo } })) {
      throw new ActionError("Another doctor already uses this registration number");
    }

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
    const profile = readProfile(formData);

    const duplicate = await prisma.doctor.findFirst({
      where: { registrationNo: profile.registrationNo, NOT: { id: existing.id } },
    });
    if (duplicate) throw new ActionError("Another doctor already uses this registration number");

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
