// Validation rules: the single source of truth for "is this value valid?".
//
// Every rule is a pure function `(raw, options) => { value, error }` that
// never throws, so the same rule runs in the browser (instant inline errors,
// via components/ui/form.jsx) and on the server (lib/validate.js readers,
// which collect every field's error). `value` is the canonical value to store
// (null when empty); `error` is "" when valid.
//
// Keystroke filters and formatters live in lib/sanitize.js; this file only
// decides validity. Never re-implement a rule in a component or an action.

import {
  APPOINTMENT_STATUSES,
  BLOOD_GROUPS,
  DOSAGE_FORMS,
  GENDERS,
  MEASURES,
  checkMeasure,
  cleanName,
  cleanText,
  filterStrength,
  filterTitle,
  isValidBloodPressure,
  isValidEmail,
  normalizeCnic,
  normalizeEmail,
  normalizePhonePK,
  tidyNameCase,
} from "@/lib/sanitize";
import { clinicDateKey, parseClinicDateTime } from "@/lib/datetime";

export const LIMITS = {
  name: 80,
  email: 120,
  title: 120,
  code: 40,
  strength: 40,
  shortText: 120,
  address: 300,
  note: 1000,
  clinical: 2000,
  rowText: 60,
  rowNote: 200,
  password: { min: 10, max: 200 },
};

const ok = (value) => ({ value, error: "" });
const bad = (error) => ({ value: null, error });

/** Trimmed text. `required`, `max`, `min`; newlines kept only when `multiline`. */
export function text(raw, { label = "This field", required = false, max = 200, min = 0, multiline = false } = {}) {
  if (raw !== null && raw !== undefined && typeof raw !== "string" && typeof raw !== "number") return bad(`${label} is invalid`);
  const s = cleanText(raw === null || raw === undefined ? "" : String(raw), { multiline });
  if (!s) return required ? bad(`${label} is required`) : ok(null);
  if (s.length > max) return bad(`${label} must be at most ${max} characters`);
  if (s.length < min) return bad(`${label} must be at least ${min} characters`);
  return ok(s);
}

/** Runs `text` first, then `check(trimmed)` on non-empty values. */
function withText(raw, opts, check) {
  const t = text(raw, opts);
  if (t.error || t.value === null) return t;
  return check(t.value);
}

export function personName(raw, { label = "Name", required = false } = {}) {
  return withText(raw, { label, required, max: LIMITS.name }, (s) => {
    if (/\p{N}/u.test(s)) return bad(`${label} can't contain numbers`);
    if (/[^\p{L}\p{M} .'-]/u.test(s) || !/\p{L}/u.test(s)) return bad(`${label} can only contain letters, spaces and . ' -`);
    // Same tidy-up as the browser: all-lower/all-upper names become Title Case.
    return ok(tidyNameCase(cleanName(s)));
  });
}

export function email(raw, { label = "Email", required = false } = {}) {
  return withText(raw, { label, required, max: LIMITS.email }, (s) => {
    const clean = normalizeEmail(s);
    return isValidEmail(clean) ? ok(clean) : bad(`Enter a valid email, like name@clinic.pk`);
  });
}

/** Pakistani mobile, stored as +923XXXXXXXXX. */
export function phonePK(raw, { label = "Phone", required = false } = {}) {
  return withText(raw, { label, required, max: 20 }, (s) => {
    const canonical = normalizePhonePK(s);
    if (canonical) return ok(canonical);
    const digits = s.replace(/\D/g, "");
    if (/^0[^03]/.test(digits)) return bad("Pakistani mobile numbers start with 03");
    if (digits.length < 11 && /^0?3/.test(digits)) return bad(`${label} is too short: enter 11 digits, like 0300-1234567`);
    return bad(`Enter a mobile number like 0300-1234567`);
  });
}

/** CNIC, stored as 12345-1234567-1. */
export function cnic(raw, { label = "CNIC", required = false } = {}) {
  return withText(raw, { label, required, max: 20 }, (s) => {
    const digits = s.replace(/\D/g, "");
    if (/^[089]/.test(digits)) return bad("A CNIC starts with a digit from 1 to 7");
    const canonical = normalizeCnic(s);
    if (!canonical) return bad(`${label} has 13 digits, like 35202-1234567-1`);
    return ok(canonical);
  });
}

/** Identifier such as a PMDC registration number: A–Z, 0–9, - and / (uppercased). */
export function code(raw, { label = "Code", required = false, max = LIMITS.code } = {}) {
  return withText(raw, { label, required, max }, (s) => {
    const upper = s.toUpperCase();
    return /^[A-Z0-9][A-Z0-9\-/]*$/.test(upper) ? ok(upper) : bad(`${label} can only contain letters, numbers, - and /`);
  });
}

/** Qualification/specialisation/clinic-name text: letters, digits, spaces and , . ( ) & / - */
export function title(raw, { label = "This field", required = false, max = LIMITS.title } = {}) {
  return withText(raw, { label, required, max }, (s) => (filterTitle(s) === s ? ok(s) : bad(`${label} contains characters that aren't allowed`)));
}

/** Medicine strength like 500mg, 120mg/5ml, 0.5%. */
export function strength(raw, { label = "Strength", required = false } = {}) {
  return withText(raw, { label, required, max: LIMITS.strength }, (s) =>
    filterStrength(s) === s ? ok(s) : bad(`${label} can only contain letters, numbers and . / % + -`)
  );
}

export function oneOf(raw, { allowed, label = "This field", required = false } = {}) {
  return withText(raw, { label, required, max: 64 }, (s) => (allowed.includes(s) ? ok(s) : bad(`Choose a valid ${label.toLowerCase()}`)));
}

export const gender = (raw, opts = {}) => oneOf(raw, { label: "Gender", allowed: GENDERS, ...opts });
export const bloodGroup = (raw, opts = {}) => oneOf(raw, { label: "Blood group", allowed: BLOOD_GROUPS, ...opts });
export const dosageForm = (raw, opts = {}) => oneOf(raw, { label: "Dosage form", allowed: DOSAGE_FORMS, ...opts });
export const appointmentStatus = (raw, opts = {}) => oneOf(raw, { label: "Status", allowed: APPOINTMENT_STATUSES, required: true, ...opts });

/** A measurement from MEASURES (lib/sanitize.js): plain digits, limited decimals, in range. */
export function measure(raw, { measure: key, required = false } = {}) {
  const spec = MEASURES[key];
  return withText(raw, { label: spec.label, required, max: 16 }, (s) => {
    const r = checkMeasure(s, spec);
    return r.error ? bad(r.error) : ok(r.value);
  });
}

export function bloodPressure(raw, { label = "Blood pressure", required = false } = {}) {
  return withText(raw, { label, required, max: 15 }, (s) => {
    const clean = s.replace(/\s/g, "");
    if (!/^\d{2,3}\/\d{2,3}$/.test(clean)) return bad("Enter systolic/diastolic, like 120/80");
    return isValidBloodPressure(clean) ? ok(clean) : bad("Systolic must be 60–260 and diastolic 30–160, with systolic the higher number");
  });
}

/**
 * Calendar date "YYYY-MM-DD" (value: the key string; the server reader turns
 * it into a UTC-midnight Date). `min`/`max` are keys; `notFuture` caps at today.
 */
export function calendarDate(raw, { label = "Date", required = false, min, max, notFuture = false } = {}) {
  return withText(raw, { label, required, max: 10 }, (s) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return bad(`${label} is not a valid date`);
    const date = new Date(`${s}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== s) return bad(`${label} is not a valid date`);
    if (notFuture && s > clinicDateKey()) return bad(`${label} can't be in the future`);
    if (min && s < min) return bad(`${label} can't be before ${min.slice(0, 4) === "1900" ? "1900" : min}`);
    if (max && s > max) return bad(`${label} can't be after ${max === clinicDateKey() ? "today" : max}`);
    return ok(s);
  });
}

/**
 * "YYYY-MM-DDTHH:mm" in clinic time → Date. `notInPast` allows `graceMinutes`
 * of slack; `maxDaysAhead` stops typos like the year 2062.
 */
export function clinicDateTime(raw, { label = "Date & time", required = false, notInPast = false, graceMinutes = 10, maxDaysAhead = 365 } = {}) {
  return withText(raw, { label, required, max: 20 }, (s) => {
    const date = parseClinicDateTime(s);
    if (!date) return bad(`${label} is not a valid date and time`);
    const now = Date.now();
    if (notInPast && date.getTime() < now - graceMinutes * 60_000) return bad(`${label} is in the past`);
    if (maxDaysAhead && date.getTime() > now + maxDaysAhead * 86_400_000) return bad(`${label} is more than a year ahead`);
    return ok(date);
  });
}

/** Password: not trimmed or cleaned (spaces count), 10–200 characters. */
export function password(raw, { label = "Password", required = true, min = LIMITS.password.min } = {}) {
  if (raw !== null && raw !== undefined && typeof raw !== "string") return bad(`${label} is invalid`);
  const s = raw ?? "";
  if (!s) return required ? bad(`${label} is required`) : ok(null);
  if (s.length < min) return bad(`${label} must be at least ${min} characters`);
  if (s.length > LIMITS.password.max) return bad(`${label} must be at most ${LIMITS.password.max} characters`);
  return ok(s);
}

/** Record id (UUID). */
export function uuid(raw, { label = "Record", required = true } = {}) {
  if (raw === null || raw === undefined || raw === "") return required ? bad(`${label} is required`) : ok(null);
  return typeof raw === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw) ? ok(raw) : bad(`${label} not found`);
}

export const isUuid = (raw) => !uuid(raw).error;

/** Prescription code typed on the verify/not-found page: RX- plus 3–20 letters/digits/dashes. */
export function prescriptionCode(raw, { label = "Prescription code", required = true } = {}) {
  return withText(raw, { label, required, max: 24 }, (s) => {
    const upper = s.toUpperCase().replace(/\s/g, "");
    return /^RX-[\dA-Z-]{3,20}$/.test(upper) ? ok(upper) : bad("Codes look like RX-00012 or RX-2026-00012");
  });
}
