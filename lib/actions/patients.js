"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { nextPatientCode, withUniqueRetry } from "@/lib/codes";
import { ActionError, safely } from "@/lib/action-errors";
import { bloodGroup, calendarDate, cnic, email, id, num, oneOf, personName, phonePK, str } from "@/lib/validate";
import bcrypt from "bcryptjs";
import { generateTempPassword } from "@/lib/passwords";
import { revalidatePath } from "next/cache";

const STAFF = ["doctor", "receptionist", "admin"];
const TX = { maxWait: 10000, timeout: 20000 };


// The phone is also the patient's login, stored as +923XXXXXXXXX.
function readPhone(formData) {
  return phonePK(formData, "phone", { label: "Phone", required: true });
}

const DOB_MIN = new Date("1900-01-01T00:00:00Z");

/** Profile fields shared by create and update, validated and coerced. */
function readProfile(formData) {
  const dateOfBirth = calendarDate(formData, "dateOfBirth", { label: "Date of birth", notFuture: true });
  if (dateOfBirth && dateOfBirth < DOB_MIN) throw new ActionError("Date of birth must be after 1900");
  const age = num(formData, "age", { label: "Age", min: 0, max: 130, integer: true });
  if (dateOfBirth && age !== null) {
    const years = (Date.now() - dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (Math.abs(years - age) > 1) throw new ActionError("Age doesn't match the date of birth");
  }
  return {
    fullName: personName(formData, "fullName", { label: "Full name", required: true }),
    fatherHusbandName: personName(formData, "fatherHusbandName", { label: "Father/husband name" }),
    gender: oneOf(formData, "gender", ["male", "female", "other"], { label: "Gender" }),
    dateOfBirth,
    age,
    email: email(formData, "email"),
    cnic: cnic(formData, "cnic"),
    address: str(formData, "address", { label: "Address", max: 300, multiline: true }),
    bloodGroup: bloodGroup(formData, "bloodGroup"),
    emergencyContact: phonePK(formData, "emergencyContact", { label: "Emergency contact" }),
    allergies: str(formData, "allergies", { label: "Allergies", max: 1000, multiline: true }),
    existingDiseases: str(formData, "existingDiseases", { label: "Existing diseases", max: 1000, multiline: true }),
    heightCm: num(formData, "heightCm", { label: "Height (cm)", min: 20, max: 260 }),
    weightKg: num(formData, "weightKg", { label: "Weight (kg)", min: 0.5, max: 400 }),
  };
}

export async function createPatient(formData) {
  return safely(async () => {
    const session = await requireRole(...STAFF);
    const profile = readProfile(formData);
    const phone = readPhone(formData);

    const existingPhone = await prisma.patient.findUnique({ where: { phone } });
    if (existingPhone) {
      return { error: "A patient with this phone number already exists", existingPatientId: existingPhone.id };
    }
    if (profile.cnic) {
      const existingCnic = await prisma.patient.findUnique({ where: { cnic: profile.cnic } });
      if (existingCnic) {
        return { error: "A patient with this CNIC already exists", existingPatientId: existingCnic.id };
      }
    }

    // Phone doubles as the login identifier, stored in User.email, since
    // patients aren't guaranteed to have a real email address.
    const loginIdentifier = phone;
    if (await prisma.user.findUnique({ where: { email: loginIdentifier } })) {
      throw new ActionError("A login already exists for this phone number. This patient may already be registered.");
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

    const profile = readProfile(formData);
    // The phone is optional on edit (older forms don't send it); when it
    // changes, the patient's login identifier changes with it.
    const phone = formData.get("phone") ? readPhone(formData) : existing.phone;
    const phoneChanged = phone !== existing.phone;

    if (profile.cnic) {
      const duplicate = await prisma.patient.findFirst({ where: { cnic: profile.cnic, NOT: { id: existing.id } } });
      if (duplicate) throw new ActionError("Another patient already uses this CNIC");
    }
    if (phoneChanged) {
      if (await prisma.patient.findFirst({ where: { phone, NOT: { id: existing.id } } })) {
        throw new ActionError("Another patient already uses this phone number");
      }
      if (await prisma.user.findFirst({ where: { email: phone, NOT: { id: existing.userId ?? undefined } } })) {
        throw new ActionError("Another account already signs in with this phone number");
      }
    }

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
