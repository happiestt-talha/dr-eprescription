import { Prisma } from "@prisma/client";

// Server actions must return { error } instead of throwing: a thrown error
// becomes an unhandled rejection in the calling form (stuck "Saving…") or
// trips the nearest error boundary. Throw ActionError for expected failures
// inside an action, and let `toActionError` turn anything into a message.

export class ActionError extends Error {}

/**
 * Validation failed on one or more fields. `fields` maps field name to
 * message (prescription rows use "medicines.2.dosage"); `extra` is merged
 * into the result (e.g. { existingPatientId }). The form shows each message
 * under its field. Thrown by `reader.done()` in lib/validate.js.
 */
export class FieldErrors extends ActionError {
  constructor(fields, extra = {}) {
    const count = Object.keys(fields).length;
    super(count === 1 ? Object.values(fields)[0] : `${count} fields need attention`);
    this.fields = fields;
    this.extra = extra;
  }
}

const UNIQUE_FIELD_LABELS = {
  phone: "phone number",
  email: "login (email/phone)",
  cnic: "CNIC",
  registrationNo: "registration number",
  patientCode: "patient code",
  prescriptionCode: "prescription code",
};

// Unique columns that are also form field names.
const FORM_FIELDS = new Set(["phone", "cnic", "registrationNo"]);

function uniqueField(target) {
  const text = String(target ?? "");
  return Object.keys(UNIQUE_FIELD_LABELS).find((f) => text.includes(f)) ?? null;
}

export function toActionError(err) {
  if (err instanceof FieldErrors) return { error: err.message, fieldErrors: err.fields, ...err.extra };
  if (err instanceof ActionError) return { error: err.message };
  if (err?.message === "Password change required") {
    return { error: "Please choose a new password first (Account → Change password)." };
  }
  if (err?.message === "Not authorized") {
    return { error: "Your session has expired or you don't have access. Please sign in again." };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        // A race the pre-checks missed: point at the field when we know it.
        const field = uniqueField(err.meta?.target);
        const error = `Another record already uses this ${field ? UNIQUE_FIELD_LABELS[field] : "value"}.`;
        return field && FORM_FIELDS.has(field) ? { error, fieldErrors: { [field]: error } } : { error };
      }
      case "P2003":
      case "P2025":
        return { error: "A record this depends on no longer exists. Refresh the page and try again." };
      case "P1001":
      case "P1002":
      case "P1017":
      case "P2024":
      case "P2028":
        return { error: "The database is busy or unreachable right now. Please try again in a moment." };
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return { error: "The database is busy or unreachable right now. Please try again in a moment." };
  }
  console.error("Unexpected server action error:", err);
  return { error: "Something went wrong. Please try again." };
}

/** Wrap a server action body so it always resolves to a plain result object. */
export async function safely(fn) {
  try {
    return await fn();
  } catch (err) {
    return toActionError(err);
  }
}
