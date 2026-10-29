import { ActionError } from "@/lib/action-errors";
import { parseClinicDateTime } from "@/lib/datetime";
import {
  BLOOD_GROUPS,
  cleanName,
  cleanText,
  filterCode,
  filterStrength,
  filterTitle,
  isValidBloodPressure,
  isValidEmail,
  isValidName,
  normalizeCnic,
  normalizeEmail,
  normalizePhonePK,
} from "@/lib/sanitize";

// Input helpers for server actions. Server actions are public endpoints, so
// every value is untrusted: these coerce FormData into clean values or throw
// an ActionError with a message the form can show (via `safely`).

function raw(source, name) {
  const value = typeof source?.get === "function" ? source.get(name) : source?.[name];
  return value === undefined || value === null ? "" : value;
}

/**
 * Cleaned string (control/zero-width characters stripped, whitespace collapsed;
 * newlines kept only when `multiline`). `required` rejects empty; `max` caps
 * length. Returns null when empty.
 */
export function str(source, name, { label = name, required = false, max = 200, multiline = false } = {}) {
  const value = raw(source, name);
  if (typeof value !== "string") throw new ActionError(`${label} is invalid`);
  const s = cleanText(value, { multiline });
  if (!s) {
    if (required) throw new ActionError(`${label} is required`);
    return null;
  }
  if (s.length > max) throw new ActionError(`${label} must be at most ${max} characters`);
  return s;
}

/** Number within [min, max]; `integer` forbids fractions. Returns null when empty. */
export function num(source, name, { label = name, min = 0, max = Number.MAX_SAFE_INTEGER, integer = false, required = false } = {}) {
  const s = str(source, name, { label, required, max: 32 });
  if (s === null) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || (integer && !Number.isInteger(n)) || n < min || n > max) {
    throw new ActionError(`${label} must be ${integer ? "a whole number" : "a number"} between ${min} and ${max}`);
  }
  return n;
}

/** One of the allowed values. */
export function oneOf(source, name, allowed, { label = name, required = true } = {}) {
  const s = str(source, name, { label, required, max: 64 });
  if (s === null) return null;
  if (!allowed.includes(s)) throw new ActionError(`${label} is invalid`);
  return s;
}

/** Calendar date "YYYY-MM-DD", stored as UTC midnight. `notFuture` for birth dates. */
export function calendarDate(source, name, { label = name, required = false, notFuture = false } = {}) {
  const s = str(source, name, { label, required, max: 10 });
  if (s === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new ActionError(`${label} is not a valid date`);
  const date = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== s) {
    throw new ActionError(`${label} is not a valid date`);
  }
  if (notFuture && date > new Date()) throw new ActionError(`${label} can't be in the future`);
  return date;
}

/** datetime-local value interpreted in the clinic's timezone. */
export function clinicDateTime(source, name, { label = name, required = true } = {}) {
  const s = str(source, name, { label, required, max: 20 });
  if (s === null) return null;
  const date = parseClinicDateTime(s);
  if (!date) throw new ActionError(`${label} is not a valid date and time`);
  return date;
}

/**
 * JSON-encoded array of row objects (e.g. prescription medicine rows).
 * Each row keeps only `fields`, each coerced to a trimmed string (max `maxLen`).
 */
export function jsonRows(source, name, { label = name, maxRows = 30, fields = [], maxLen = 200 } = {}) {
  const s = raw(source, name) || "[]";
  if (typeof s !== "string" || s.length > 100_000) throw new ActionError(`${label} are invalid`);
  let parsed;
  try {
    parsed = JSON.parse(s);
  } catch {
    throw new ActionError(`${label} are invalid`);
  }
  if (!Array.isArray(parsed)) throw new ActionError(`${label} are invalid`);
  if (parsed.length > maxRows) throw new ActionError(`At most ${maxRows} ${label.toLowerCase()} are allowed`);
  return parsed.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new ActionError(`${label} are invalid`);
    const clean = {};
    for (const field of fields) {
      const v = row[field];
      if (v === undefined || v === null || v === "") {
        clean[field] = "";
        continue;
      }
      if (typeof v !== "string" && typeof v !== "number") throw new ActionError(`${label} are invalid`);
      const t = cleanText(String(v));
      if (t.length > maxLen) throw new ActionError(`${label}: a value is too long`);
      clean[field] = t;
    }
    return clean;
  });
}

/** Opaque record id from the client (UUID). */
export function id(value, label = "Record") {
  if (typeof value !== "string" || !/^[0-9a-f-]{36}$/i.test(value)) throw new ActionError(`${label} not found`);
  return value;
}

// ---------- Typed fields (canonical value or ActionError) ----------

/** A person's name: letters in any script, spaces and . ' - */
export function personName(source, field, { label = field, required = false } = {}) {
  const s = str(source, field, { label, required, max: 80 });
  if (s === null) return null;
  const clean = cleanName(s);
  if (!isValidName(clean)) throw new ActionError(`${label} can only contain letters, spaces and . ' -`);
  return clean;
}

/** Strict email (see lib/sanitize.js isValidEmail), lowercased. */
export function email(source, field, { label = "Email", required = false } = {}) {
  const s = str(source, field, { label, required, max: 120 });
  if (s === null) return null;
  const clean = normalizeEmail(s);
  if (!isValidEmail(clean)) throw new ActionError(`${label} must be a valid address like name@clinic.pk`);
  return clean;
}

/** Pakistani mobile number, stored as +923XXXXXXXXX. */
export function phonePK(source, field, { label = "Phone", required = false } = {}) {
  const s = str(source, field, { label, required, max: 20 });
  if (s === null) return null;
  const canonical = normalizePhonePK(s);
  if (!canonical) throw new ActionError(`${label} must be a Pakistani mobile number like 0300-1234567`);
  return canonical;
}

/** CNIC, stored as 12345-1234567-1. */
export function cnic(source, field, { label = "CNIC", required = false } = {}) {
  const s = str(source, field, { label, required, max: 20 });
  if (s === null) return null;
  const canonical = normalizeCnic(s);
  if (!canonical) throw new ActionError(`${label} must be 13 digits, like 35202-1234567-1`);
  return canonical;
}

/** Identifier such as a PMDC registration number: A–Z 0–9 - / (uppercased). */
export function code(source, field, { label = field, required = false, max = 40 } = {}) {
  const s = str(source, field, { label, required, max });
  if (s === null) return null;
  const clean = filterCode(s).trim();
  if (!clean || clean !== s.toUpperCase().trim()) {
    throw new ActionError(`${label} can only contain letters, numbers, - and /`);
  }
  return clean;
}

/** Qualification/specialization style text: letters, digits, spaces and , . ( ) & / - */
export function title(source, field, { label = field, required = false, max = 120 } = {}) {
  const s = str(source, field, { label, required, max });
  if (s === null) return null;
  if (filterTitle(s) !== s) throw new ActionError(`${label} contains characters that aren't allowed`);
  return s;
}

/** Medicine strength like 500mg, 120mg/5ml, 0.5%. */
export function strength(source, field, { label = "Strength" } = {}) {
  const s = str(source, field, { label, max: 40 });
  if (s === null) return null;
  if (filterStrength(s) !== s) throw new ActionError(`${label} can only contain letters, numbers and . / % + -`);
  return s;
}

export function bloodGroup(source, field, { label = "Blood group" } = {}) {
  return oneOf(source, field, BLOOD_GROUPS, { label, required: false });
}

/** Blood pressure "120/80". */
export function bloodPressure(source, field, { label = "Blood pressure" } = {}) {
  const s = str(source, field, { label, max: 15 });
  if (s === null) return null;
  const clean = s.replace(/\s/g, "");
  if (!isValidBloodPressure(clean)) throw new ActionError(`${label} must look like 120/80`);
  return clean;
}
