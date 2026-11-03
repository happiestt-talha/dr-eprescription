"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ALL_ROLES, requireRole } from "@/lib/auth-guards";
import { ActionError, FieldErrors, safely } from "@/lib/action-errors";
import { clearFailures, isLimited, recordFailure } from "@/lib/rate-limit";
import { generateTempPassword } from "@/lib/passwords";
import { createReader, id } from "@/lib/validate";


export async function changePassword(formData) {
  return safely(async () => {
    // Allowed while a change is pending: this is how the user clears it.
    const session = await requireRole(...ALL_ROLES, { allowPendingPasswordChange: true });
    const limitKey = [`pw:${session.user.id}`];
    if (isLimited(limitKey)) throw new ActionError("Too many attempts. Please wait 15 minutes and try again.");

    // Passwords are never trimmed or otherwise altered; only checked.
    const r = createReader(formData);
    const current = r.password("currentPassword", { label: "Current password", min: 1 });
    const next = r.password("newPassword", { label: "New password" });
    const confirm = r.password("confirmPassword", { label: "Confirmation", min: 1 });
    if (next && confirm && next !== confirm) r.fail("confirmPassword", "The new passwords don't match");
    if (next && current && next === current) r.fail("newPassword", "Choose a password different from your current one");
    r.done();

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) throw new Error("Not authorized");

    // Don't allow the login itself (email, or the phone's digits) inside the password.
    const loginDigits = user.email.replace(/\D/g, "").slice(-10);
    const lowered = next.toLowerCase();
    if (lowered.includes(user.email.split("@")[0]) || (loginDigits.length >= 7 && next.includes(loginDigits))) {
      throw new FieldErrors({ newPassword: "Your password can't contain your email or phone number" });
    }

    if (!(await bcrypt.compare(current, user.passwordHash))) {
      recordFailure(limitKey);
      throw new FieldErrors({ currentPassword: "Your current password is incorrect" });
    }
    clearFailures(limitKey);

    const passwordHash = await bcrypt.hash(next, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "changed_password",
          entityType: "user",
          entityId: user.id,
          details: { wasRequired: user.mustChangePassword },
        },
      }),
    ]);
    return { success: true };
  });
}

// ---------- Resets by staff ----------

const RESET_TX = { maxWait: 10000, timeout: 20000 };

/**
 * Give `user` a new temporary password they must change on next sign-in.
 * Returns it once so staff can hand it over; it isn't stored anywhere.
 */
async function resetUserPassword(session, user, entity) {
  if (user.id === session.user.id) throw new ActionError("Use Change password to change your own password");
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.$transaction(
    [
      prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: true } }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "reset_password",
          entityType: entity.type,
          entityId: entity.id,
          details: { login: user.email },
        },
      }),
    ],
    RESET_TX
  );
  return { success: true, username: user.email, tempPassword };
}

/** Reception, doctors and admins reset a patient's password (patients ask at the front desk). */
export async function resetPatientPassword(patientId) {
  return safely(async () => {
    const session = await requireRole("receptionist", "doctor", "admin");
    const patient = await prisma.patient.findUnique({
      where: { id: id(patientId, "Patient") },
      select: { id: true, user: { select: { id: true, email: true, role: true } } },
    });
    if (!patient) throw new ActionError("Patient not found");
    if (!patient.user || patient.user.role !== "patient") throw new ActionError("This patient has no login yet");
    return resetUserPassword(session, patient.user, { type: "patient", id: patient.id });
  });
}

/** Admins reset a doctor's password. */
export async function resetDoctorPassword(doctorId) {
  return safely(async () => {
    const session = await requireRole("admin");
    const doctor = await prisma.doctor.findUnique({
      where: { id: id(doctorId, "Doctor") },
      select: { id: true, user: { select: { id: true, email: true, role: true } } },
    });
    if (!doctor || doctor.user.role !== "doctor") throw new ActionError("Doctor not found");
    return resetUserPassword(session, doctor.user, { type: "doctor", id: doctor.id });
  });
}
