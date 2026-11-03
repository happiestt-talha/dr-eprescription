"use server";

// Live uniqueness checks for the registration forms: as soon as a phone,
// CNIC, email or PMDC number is complete, the form asks whether someone
// already owns it, so staff can jump to that record instead of filling in a
// whole form that will be rejected. Read-only (no audit log), and they only
// return what staff can already see through patient search or the admin
// doctors list. The create/update actions still enforce uniqueness.

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { auth } from "@/auth";
import { uuid } from "@/lib/rules";
import { safely } from "@/lib/action-errors";
import { normalizeCnic, normalizeEmail, normalizePhonePK, isValidEmail, filterCode } from "@/lib/sanitize";
import { formatAge } from "@/lib/datetime";

const STAFF = ["doctor", "receptionist", "admin"];
const NONE = { exists: false };

const MAX_VALUE = 64;

function cleanId(value) {
  return uuid(value).value ?? undefined;
}

/**
 * Cheap gate before any query: a signed-in staff JWT (no DB hit). The full
 * role check (requireRole, which reads the user row) still runs alongside
 * the lookup and must pass before anything is returned.
 */
async function signedInAs(roles) {
  const session = await auth();
  if (!session || !roles.includes(session.user.role)) throw new Error("Not authorized");
}

function input(value) {
  return typeof value === "string" && value.length <= MAX_VALUE ? value : "";
}

/**
 * { field: "phone" | "cnic", value, excludeId? } →
 *   { exists: false } | { exists: true, match: { id, fullName, patientCode, gender, ageLabel } }
 *   | { exists: true, otherAccount: true } (phone used as a non-patient login)
 */
export async function checkPatientUnique({ field, value: rawValue, excludeId } = {}) {
  return safely(async () => {
    await signedInAs(STAFF);
    const value = input(rawValue);
    const exclude = cleanId(excludeId);

    let where;
    if (field === "phone") {
      const phone = normalizePhonePK(value);
      if (!phone) return (await requireRole(...STAFF), NONE);
      where = { phone };
    } else if (field === "cnic") {
      const cnic = normalizeCnic(value);
      if (!cnic) return (await requireRole(...STAFF), NONE);
      where = { cnic };
    } else {
      return NONE;
    }

    // Each DB round trip is slow on the hosted database, so the role check and
    // the lookups run together. Nothing is returned unless the role check passes
    // (Promise.all rejects first).
    const [, patient, user, self] = await Promise.all([
      requireRole(...STAFF),
      prisma.patient.findFirst({
        where: { ...where, ...(exclude ? { NOT: { id: exclude } } : {}) },
        select: { id: true, fullName: true, patientCode: true, gender: true, dateOfBirth: true, dobEstimated: true, age: true },
      }),
      // The phone is also the patient's login (users.email): a login with this
      // number but no matching patient belongs to someone else.
      field === "phone" ? prisma.user.findUnique({ where: { email: where.phone }, select: { id: true } }) : null,
      field === "phone" && exclude ? prisma.patient.findUnique({ where: { id: exclude }, select: { userId: true } }) : null,
    ]);

    if (patient) {
      const { dateOfBirth, dobEstimated, age, ...rest } = patient;
      return { exists: true, match: { ...rest, ageLabel: formatAge({ dateOfBirth, dobEstimated, age }, { short: true }) } };
    }
    if (user && user.id !== self?.userId) return { exists: true, otherAccount: true };
    return NONE;
  });
}

/**
 * { field: "email" | "registrationNo", value, excludeId? } (admin only) →
 *   { exists: false } | { exists: true, match: { id, fullName, isActive } }
 *   | { exists: true, otherAccount: true } (email used by a non-doctor)
 */
export async function checkDoctorUnique({ field, value: rawValue, excludeId } = {}) {
  return safely(async () => {
    await signedInAs(["admin"]);
    const value = input(rawValue);
    const exclude = cleanId(excludeId);
    const select = { id: true, fullName: true, user: { select: { isActive: true, role: true } } };

    let lookup;
    if (field === "email") {
      const email = normalizeEmail(value);
      if (!isValidEmail(email)) return (await requireRole("admin"), NONE);
      lookup = Promise.all([
        prisma.user.findUnique({ where: { email }, select: { id: true, role: true } }),
        prisma.doctor.findFirst({ where: { user: { email } }, select }),
      ]);
    } else if (field === "registrationNo") {
      const registrationNo = filterCode(String(value ?? "")).trim().toUpperCase();
      if (registrationNo.length < 3 || registrationNo.length > 40) return (await requireRole("admin"), NONE);
      lookup = Promise.all([null, prisma.doctor.findUnique({ where: { registrationNo }, select })]);
    } else {
      return NONE;
    }

    // Role check and lookup in parallel (see checkPatientUnique).
    const [, [user, doctor]] = await Promise.all([requireRole("admin"), lookup]);
    if (field === "email" && user && !doctor) return { exists: true, otherAccount: true };
    if (!doctor) return NONE;

    if (doctor.id === exclude) return NONE;
    return { exists: true, match: { id: doctor.id, fullName: doctor.fullName, isActive: doctor.user.isActive } };
  });
}
