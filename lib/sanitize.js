// Input sanitisation shared by the browser (keystroke filtering, formatting)
// and the server (the source of truth: lib/validate.js re-applies all of it).
// Dependency-free on purpose so it runs anywhere, including plain node tests.

// Control characters (except tab/newline handled below), zero-width and
// bidi-override characters that can hide or reorder text.
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤﻿]/g;

/** Trimmed, normalised plain text. Newlines kept only when `multiline`. */
export function cleanText(value, { multiline = false } = {}) {
  let s = String(value ?? "").normalize("NFC").replace(INVISIBLE, "");
  if (multiline) {
    s = s
      .replace(/\r\n?/g, "\n")
      .replace(/\t/g, " ")
      .split("\n")
      .map((line) => line.replace(/ {2,}/g, " ").trimEnd())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    s = s.replace(/[\t\r\n]+/g, " ").replace(/ {2,}/g, " ");
  }
  return s.trim();
}

// ---------- Names ----------
// Letters in any script (Latin, Urdu, …), combining marks, spaces and . ' -
const NAME_DISALLOWED = /[^\p{L}\p{M} .'\-]/gu;

/** For keystroke filtering: removes characters a name can't contain, keeps spacing as typed. */
export function filterName(value) {
  return String(value ?? "").normalize("NFC").replace(INVISIBLE, "").replace(NAME_DISALLOWED, "");
}

export function cleanName(value) {
  return cleanText(filterName(value)).replace(/\s*([.'-])\s*/g, (m, p) => (p === "." ? ". " : p)).replace(/ {2,}/g, " ").trim();
}

export function isValidName(value) {
  return /\p{L}/u.test(value) && value.length <= 80;
}

// ---------- Email ----------
/** For keystroke filtering: lowercase, no spaces, only email characters, at most one "@". */
export function filterEmail(value) {
  let s = String(value ?? "").toLowerCase().replace(INVISIBLE, "").replace(/[^a-z0-9._%+\-@]/g, "");
  const at = s.indexOf("@");
  if (at !== -1) s = s.slice(0, at + 1) + s.slice(at + 1).replace(/@/g, "");
  return s;
}

export function normalizeEmail(value) {
  return filterEmail(cleanText(value));
}

/**
 * name@domain.tld, strictly:
 * - local part of email-safe characters, no leading/trailing/double dots, and
 *   at least one letter (so it can't be digits only);
 * - domain labels of letters/digits/hyphens, ending in a letters-only
 *   extension of 2–24 characters (".com", ".pk", ".com.pk"); "x@y.com123" fails.
 */
export function isValidEmail(value) {
  const s = String(value ?? "");
  if (s.length > 120) return false;
  const m = /^([a-z0-9._%+-]+)@([a-z0-9-]+(?:\.[a-z0-9-]+)*\.([a-z]{2,24}))$/.exec(s);
  if (!m) return false;
  const [, local, domain] = m;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (!/[a-z]/.test(local)) return false;
  return domain.split(".").every((label) => label.length > 0 && !label.startsWith("-") && !label.endsWith("-"));
}

// ---------- Pakistani mobile numbers ----------
/** For keystroke filtering: digits, plus a "+" only at the start. */
export function filterPhone(value) {
  const s = String(value ?? "").replace(INVISIBLE, "").trim();
  const plus = s.startsWith("+") ? "+" : "";
  return plus + s.replace(/\D/g, "").slice(0, 14);
}

/**
 * Canonical "+923XXXXXXXXX" for any common way of writing a Pakistani mobile:
 * 03001234567, 3001234567, 923001234567, +92 300-1234567, 00923001234567.
 * Returns "" when it isn't one.
 */
export function normalizePhonePK(value) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return /^3\d{9}$/.test(digits) ? `+92${digits}` : "";
}

export function isValidPhonePK(value) {
  return /^\+923\d{9}$/.test(String(value ?? ""));
}

/** "+923001234567" or "03001234567" → "0300-1234567" for display. */
export function formatPhoneDisplay(value) {
  const canonical = normalizePhonePK(value);
  if (!canonical) return String(value ?? "");
  const national = `0${canonical.slice(3)}`;
  return `${national.slice(0, 4)}-${national.slice(4)}`;
}

/** As-you-type formatting for the phone field: "03001234567" → "0300-1234567". */
export function formatPhoneTyping(value) {
  const s = filterPhone(value);
  if (s.startsWith("+")) return s;
  if (s.startsWith("0") && s.length > 4) return `${s.slice(0, 4)}-${s.slice(4, 11)}`;
  return s.slice(0, 11);
}

// ---------- CNIC ----------
export function filterCnic(value) {
  const d = String(value ?? "").replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function normalizeCnic(value) {
  const d = String(value ?? "").replace(/\D/g, "");
  return d.length === 13 ? `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}` : "";
}

// ---------- Codes, groups, vitals ----------
/** Registration numbers and similar identifiers: A–Z 0–9 - / (uppercased). */
export function filterCode(value) {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9\-/ ]/g, "").replace(/ {2,}/g, " ");
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/** "120/80": systolic 60–260, diastolic 30–160, systolic above diastolic. */
export function isValidBloodPressure(value) {
  const m = /^(\d{2,3})\/(\d{2,3})$/.exec(String(value ?? "").replace(/\s/g, ""));
  if (!m) return false;
  const sys = Number(m[1]);
  const dia = Number(m[2]);
  return sys >= 60 && sys <= 260 && dia >= 30 && dia <= 160 && sys > dia;
}

export function filterBloodPressure(value) {
  return String(value ?? "").replace(/[^\d/]/g, "").replace(/\/+/g, "/").slice(0, 7);
}

/** Medicine strength like "500mg", "120mg/5ml", "0.5%". */
export function filterStrength(value) {
  return String(value ?? "").replace(INVISIBLE, "").replace(/[^0-9a-zA-Z./% +\-]/g, "");
}

/** Qualifications/specialization: letters, digits, spaces and , . ( ) & / - */
export function filterTitle(value) {
  return String(value ?? "").normalize("NFC").replace(INVISIBLE, "").replace(/[^\p{L}\p{M}0-9 ,.()&/\-]/gu, "");
}
