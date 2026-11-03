import { ActionError, FieldErrors } from "@/lib/action-errors";
import { cleanText } from "@/lib/sanitize";
import * as rules from "@/lib/rules";

// Input handling for server actions. Server actions are public endpoints, so
// every value is untrusted. The rules themselves live in lib/rules.js (shared
// with the browser); this file applies them to FormData.
//
// Preferred: a reader that collects *every* field's error, so the form can
// show each one inline under its field:
//
//   const r = createReader(formData);
//   const fullName = r.personName("fullName", { label: "Full name", required: true });
//   const heightCm = r.measure("heightCm");
//   if (a && b) r.fail("to", "End date must be after the start date");
//   r.done(); // throws FieldErrors → { error, fieldErrors } via safely()
//
// The single-value helpers below (str, measure, phonePK, …) throw on the first
// error; they remain for one-off values such as ids.

function raw(source, name) {
  const value = typeof source?.get === "function" ? source.get(name) : source?.[name];
  return value === undefined || value === null ? "" : value;
}

const READER_RULES = [
  "text",
  "personName",
  "email",
  "phonePK",
  "cnic",
  "code",
  "title",
  "strength",
  "oneOf",
  "gender",
  "bloodGroup",
  "dosageForm",
  "appointmentStatus",
  "measure",
  "bloodPressure",
  "clinicDateTime",
  "password",
  "uuid",
];

/**
 * Reads fields from `source` (FormData or a plain object) with the rules in
 * lib/rules.js, recording an error per field instead of throwing.
 */
export function createReader(source) {
  const errors = {};

  function apply(name, rule, opts = {}) {
    const { value, error } = rule(raw(source, name), opts);
    if (error) {
      if (!errors[name]) errors[name] = error;
      return null;
    }
    return value;
  }

  const reader = {
    errors,
    /** Raw value, for flags such as `intent`. */
    raw: (name) => raw(source, name),
    /** Record a cross-field error (first one per field wins). */
    fail(name, message) {
      if (!errors[name]) errors[name] = message;
    },
    has: (name) => Boolean(errors[name]),
    get ok() {
      return Object.keys(errors).length === 0;
    },
    /** Throws FieldErrors when anything failed; `extra` is merged into the result. */
    done(extra) {
      if (Object.keys(errors).length) throw new FieldErrors({ ...errors }, extra);
    },
    /** Calendar date as a UTC-midnight Date (see rules.calendarDate). */
    calendarDate(name, opts) {
      const key = apply(name, rules.calendarDate, opts);
      return key ? new Date(`${key}T00:00:00Z`) : null;
    },
  };
  for (const ruleName of READER_RULES) {
    reader[ruleName] = (name, opts) => apply(name, rules[ruleName], opts);
  }
  return reader;
}

/** Throws ActionError with the rule's message; returns the value otherwise. */
function single(rule, defaults = {}) {
  return (source, name, opts = {}) => {
    const { value, error } = rule(raw(source, name), { label: name, ...defaults, ...opts });
    if (error) throw new ActionError(error);
    return value;
  };
}

export const str = (source, name, { label = name, required = false, max = 200, multiline = false } = {}) =>
  single(rules.text)(source, name, { label, required, max, multiline });
export const measure = (source, name, opts = {}) => single(rules.measure)(source, name, { measure: name, ...opts });
export const oneOf = (source, name, allowed, opts = {}) => single(rules.oneOf)(source, name, { allowed, required: true, ...opts });
export const personName = single(rules.personName);
export const email = single(rules.email, { label: "Email" });
export const phonePK = single(rules.phonePK, { label: "Phone" });
export const cnic = single(rules.cnic, { label: "CNIC" });
export const code = single(rules.code);
export const title = single(rules.title);
export const strength = single(rules.strength, { label: "Strength" });
export const bloodGroup = single(rules.bloodGroup, { label: "Blood group" });
export const bloodPressure = single(rules.bloodPressure, { label: "Blood pressure" });
export const clinicDateTime = (source, name, opts = {}) => single(rules.clinicDateTime)(source, name, { required: true, ...opts });
export function calendarDate(source, name, opts = {}) {
  const key = single(rules.calendarDate)(source, name, opts);
  return key ? new Date(`${key}T00:00:00Z`) : null;
}

/** Opaque record id from the client (UUID). */
export function id(value, label = "Record") {
  const { error } = rules.uuid(value, { label });
  if (error) throw new ActionError(error);
  return value;
}

/**
 * JSON-encoded array of row objects (prescription medicine/lab-test rows).
 * Each row keeps only `fields`, as trimmed strings. Length errors are
 * reported per cell through `reader` as "<prefix>.<index>.<field>".
 */
export function jsonRows(source, name, { label = name, maxRows = 30, fields = [], maxLen = {}, reader, prefix = name } = {}) {
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
  return parsed.map((row, index) => {
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
      const limit = typeof maxLen === "number" ? maxLen : (maxLen[field] ?? 200);
      if (t.length > limit) {
        const message = `At most ${limit} characters`;
        if (reader) reader.fail(`${prefix}.${index}.${field}`, message);
        else throw new ActionError(`${label}: a value is too long`);
      }
      clean[field] = t.slice(0, limit);
    }
    return clean;
  });
}
