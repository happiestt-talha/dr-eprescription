import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const ALL_ROLES = ["admin", "doctor", "receptionist", "patient"];

/**
 * Guard for server actions. Throws unless the caller is signed in with one of
 * the given roles, their account is still active, and they don't owe a
 * password change. These are checked against the DB, because a JWT can be
 * stale (deactivation, a forced change set after sign-in).
 * `allowPendingPasswordChange` is only for the change-password action itself.
 */
export async function requireRole(...args) {
  const options = typeof args.at(-1) === "object" ? args.pop() : {};
  const roles = args;
  const session = await auth();
  if (!session || !roles.includes(session.user.role)) {
    throw new Error("Not authorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, mustChangePassword: true },
  });
  if (!user?.isActive) throw new Error("Not authorized");
  if (user.mustChangePassword && !options.allowPendingPasswordChange) throw new Error("Password change required");

  return session;
}

/** The signed-in user's Doctor row, or null. Deduped per request. */
export const getCurrentDoctor = cache(async () => {
  const session = await auth();
  if (!session || session.user.role !== "doctor") return null;
  return prisma.doctor.findUnique({ where: { userId: session.user.id } });
});

/**
 * Who may download a prescription's PDF/QR: admins, its doctor, its patient.
 * Drafts are not prescriptions yet, so only their own doctor can see them.
 */
export function canAccessPrescription(session, rx) {
  if (!session) return false;
  const { role, id } = session.user;
  const isOwnDoctor = role === "doctor" && rx.doctor.userId === id;
  if (rx.status !== "finalized") return isOwnDoctor;
  return role === "admin" || isOwnDoctor || (role === "patient" && rx.patient.userId === id);
}
