"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { nextPatientCode, withUniqueRetry } from "@/lib/codes";
import { ActionError, FieldErrors, safely } from "@/lib/action-errors";
import { createReader, id } from "@/lib/validate";
import { LIMITS } from "@/lib/rules";
import bcrypt from "bcryptjs";
import { generateTempPassword } from "@/lib/passwords";
import { revalidatePath } from "next/cache";
import { ageFromDob, estimatedDobKey } from "@/lib/datetime";

const STAFF = ["doctor", "receptionist", "admin"];
const TX = { maxWait: 10000, timeout: 20000 };


const DOB_MIN = "1900-01-01";

/**
 * Reads and validates the whole patient form at once, so every invalid field
 * is reported (inline) in one go. Throws FieldErrors via `r.done()`.
 *
 * Date of birth is the single source of age: either an exact date
 * (`dobMode=exact`) or an approximate age (`dobMode=approx`), stored as an
 * estimated date of birth on 1 January of the matching year.
 * The phone is also the patient's login, stored as +923XXXXXXXXX; on edit it
 * may be missing (older forms), which keeps the existing one.
 */
function readPatient(formData, { phoneOptional = false } = {}) {
  const r = createReader(formData);
  const mode = r.oneOf("dobMode", { allowed: ["exact", "approx"], label: "Date of birth type", required: true });
  let birth = {};
  if (mode === "approx") {
    const approxAge = r.measure("approxAge", { measure: "approxAge", required: true });
    if (approxAge !== null) {
      const dateOfBirth = new Date(`${estimatedDobKey(approxAge)}T00:00:00Z`);
      birth = { dateOfBirth, dobEstimated: true, age: approxAge };
    }
  } else if (mode === "exact") {
    const dateOfBirth = r.calendarDate("dateOfBirth", { label: "Date of birth", required: true, notFuture: true, min: DOB_MIN });
    if (dateOfBirth) birth = { dateOfBirth, dobEstimated: false, age: ageFromDob(dateOfBirth) };
  }

  const profile = {
    fullName: r.personName("fullName", { label: "Full name", required: true }),
    fatherHusbandName: r.personName("fatherHusbandName", { label: "Father/husband name" }),
    gender: r.gender("gender", { required: true }),
    ...birth,
    email: r.email("email"),
    cnic: r.cnic("cnic"),
    address: r.text("address", { label: "Address", max: LIMITS.address }),
    bloodGroup: r.bloodGroup("bloodGroup"),
    emergencyContact: r.phonePK("emergencyContact", { label: "Emergency contact" }),
    allergies: r.text("allergies", { label: "Allergies", max: LIMITS.note, multiline: true }),
    existingDiseases: r.text("existingDiseases", { label: "Existing conditions", max: LIMITS.note, multiline: true }),
    heightCm: r.measure("heightCm", { measure: "heightCm" }),
    weightKg: r.measure("weightKg", { measure: "weightKg" }),
  };
  const phone = phoneOptional && !r.raw("phone") ? null : r.phonePK("phone", { label: "Phone", required: true });
  r.done();
  return { profile, phone };
}

export async function createPatient(formData) {
  return safely(async () => {
    const session = await requireRole(...STAFF);
    const { profile, phone } = readPatient(formData);

    // Uniqueness, reported on the field it concerns. The phone doubles as the
    // login identifier (users.email), since patients may not have an email.
    const loginIdentifier = phone;
    const [byPhone, byCnic, login] = await Promise.all([
      prisma.patient.findUnique({ where: { phone }, select: { id: true } }),
      profile.cnic ? prisma.patient.findUnique({ where: { cnic: profile.cnic }, select: { id: true } }) : null,
      prisma.user.findUnique({ where: { email: loginIdentifier }, select: { id: true } }),
    ]);
    const duplicates = {};
    if (byPhone) duplicates.phone = "A patient with this phone number is already registered";
    else if (login) duplicates.phone = "This number is already used by another account";
    if (byCnic) duplicates.cnic = "A patient with this CNIC is already registered";
    if (Object.keys(duplicates).length) {
      throw new FieldErrors(duplicates, { existingPatientId: byPhone?.id ?? byCnic?.id });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const patient = await withUniqueRetry(
      () =>
        prisma.$transaction(async (tx) => {
          const patientCode = await nextPatientCode(tx);
          const user = await tx.user.create({
            data: { email: loginIdentifier, passwordHash, role: "patient", isActive: true, mustChangePassword: true },
          });
          const patient = await tx.patient.create({
            data: { ...profile, userId: user.id, patientCode, phone },
          });
          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              action: "registered_patient",
              entityType: "patient",
              entityId: patient.id,
              details: { fullName: profile.fullName, phone },
            },
          });
          return patient;
        }, TX),
      "patientCode"
    );

    revalidatePath("/doctor/patients");
    revalidatePath("/receptionist/patients");

    return {
      success: true,
      patientId: patient.id,
      credentials: { username: loginIdentifier, tempPassword },
    };
  });
}

export async function updatePatient(patientId, formData) {
  return safely(async () => {
    const session = await requireRole(...STAFF);
    const existing = await prisma.patient.findUnique({ where: { id: id(patientId, "Patient") } });
    if (!existing) throw new ActionError("Patient not found");

    const read = readPatient(formData, { phoneOptional: true });
    const profile = read.profile;
    // When the phone changes, the patient's login identifier changes with it.
    const phone = read.phone ?? existing.phone;
    const phoneChanged = phone !== existing.phone;

    const [cnicOwner, phoneOwner, loginOwner] = await Promise.all([
      profile.cnic ? prisma.patient.findFirst({ where: { cnic: profile.cnic, NOT: { id: existing.id } }, select: { id: true } }) : null,
      phoneChanged ? prisma.patient.findFirst({ where: { phone, NOT: { id: existing.id } }, select: { id: true } }) : null,
      phoneChanged ? prisma.user.findFirst({ where: { email: phone, NOT: { id: existing.userId ?? undefined } }, select: { id: true } }) : null,
    ]);
    const duplicates = {};
    if (cnicOwner) duplicates.cnic = "Another patient already uses this CNIC";
    if (phoneOwner) duplicates.phone = "Another patient already uses this phone number";
    else if (loginOwner) duplicates.phone = "Another account already signs in with this phone number";
    if (Object.keys(duplicates).length) throw new FieldErrors(duplicates);

    const changed = Object.keys(profile).filter((k) => String(profile[k] ?? "") !== String(existing[k] ?? ""));
    if (phoneChanged) changed.push("phone");

    await prisma.$transaction(async (tx) => {
      await tx.patient.update({ where: { id: existing.id }, data: { ...profile, phone } });
      if (phoneChanged && existing.userId) {
        await tx.user.update({ where: { id: existing.userId }, data: { email: phone } });
      }
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "updated_patient",
          entityType: "patient",
          entityId: existing.id,
          details: { changedFields: changed },
        },
      });
    }, TX);

    revalidatePath(`/doctor/patients/${existing.id}`);
    revalidatePath(`/receptionist/patients/${existing.id}`);
    return { success: true };
  });
}
