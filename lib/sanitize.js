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
  let s = filterPhone(value);
  // "3001234567" -> "03001234567": local numbers always start with 0.
  if (/^3/.test(s)) s = `0${s}`;
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
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9\-/]/g, "");
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const GENDERS = ["male", "female", "other"];
export const DOSAGE_FORMS = ["tablet", "syrup", "injection", "capsule", "cream", "drops", "inhaler", "other"];
export const APPOINTMENT_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

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

// ---------- Measurements ----------
// One spec per numeric field. The browser input (MeasureInput) blocks
// keystrokes that can't lead to a valid value, warns on unusual-but-possible
// values, and the server (`measure()` in lib/validate.js) enforces the same
// range and precision, so no outliers reach the database.
export const MEASURES = {
  heightCm: { label: "Height", unit: "cm", min: 30, max: 250, decimals: 1, warn: (v) => (v < 100 || v > 210 ? "Unusual height. Please double-check." : "") },
  weightKg: { label: "Weight", unit: "kg", min: 0.5, max: 300, decimals: 1, warn: (v) => (v > 200 ? "Unusual weight. Please double-check." : "") },
  temperatureF: { label: "Temperature", unit: "°F", min: 90, max: 110, decimals: 1, warn: (v) => (v < 95 ? "Low temperature. Please double-check." : v > 104 ? "Very high fever. Please double-check." : "") },
  pulseRate: { label: "Pulse", unit: "bpm", min: 30, max: 220, decimals: 0, warn: (v) => (v < 45 || v > 160 ? "Unusual pulse. Please double-check." : "") },
  spo2: { label: "SpO₂", unit: "%", min: 50, max: 100, decimals: 0, warn: (v) => (v < 90 ? "Low oxygen saturation. Please double-check." : "") },
  approxAge: { label: "Approximate age", unit: "years", min: 0, max: 120, decimals: 0 },
};

/**
 * Keystroke filter for a measurement. Keeps digits and (if allowed) one
 * decimal point, caps decimals, and refuses input that can only exceed the
 * maximum (with max 250, "468" can't be typed). Returns `prev` to reject.
 */
export function filterMeasure(value, spec, prev = "") {
  let s = String(value ?? "").replace(/,/g, ".").replace(/[^\d.]/g, "");
  if (spec.decimals === 0) s = s.split(".")[0];
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "").slice(0, spec.decimals);
  if (s.startsWith(".")) s = `0${s}`;
  // No leading zeros on whole numbers ("007" -> "7"), but keep "0" and "0.5".
  s = s.replace(/^0+(?=\d)/, "");
  if (s && s !== "0." && Number(s) > spec.max) return prev;
  return s;
}

/** null when empty; otherwise { value, error, warning } for a measurement. */
export function checkMeasure(value, spec) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!/^\d+(\.\d+)?$/.test(s) || !Number.isFinite(n)) return { value: n, error: `${spec.label} must be a number`, warning: "" };
  const places = (s.split(".")[1] || "").length;
  if (places > spec.decimals) {
    return { value: n, error: spec.decimals ? `${spec.label}: at most ${spec.decimals} decimal place` : `${spec.label} must be a whole number`, warning: "" };
  }
  if (n < spec.min || n > spec.max) return { value: n, error: `${spec.label} must be between ${spec.min} and ${spec.max} ${spec.unit}`, warning: "" };
  return { value: n, error: "", warning: spec.warn ? spec.warn(n) : "" };
}

/** Body-mass index, or null. */
export function bmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!h || !w || h < 0.3) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

/** "5'8", "5 ft 8", "5.8" (feet) -> cm, or null. */
export function feetToCm(value) {
  const s = String(value ?? "").trim();
  let m = /^(\d)\s*(?:'|ft|feet)\s*(\d{1,2})?\s*(?:"|in|inch(?:es)?)?$/i.exec(s);
  if (m) {
    const inches = Number(m[1]) * 12 + Number(m[2] || 0);
    return Math.round(inches * 2.54 * 10) / 10;
  }
  m = /^(\d)(?:\.(\d{1,2}))?$/.exec(s);
  if (m && Number(m[1]) >= 3 && Number(m[1]) <= 7) {
    // 5.8 is usually read as 5 ft 8 in, not 5.8 ft.
    const inches = Number(m[1]) * 12 + Math.min(11, Number(m[2] || 0));
    return Math.round(inches * 2.54 * 10) / 10;
  }
  return null;
}

export function celsiusToFahrenheit(c) {
  return Math.round(((Number(c) * 9) / 5 + 32) * 10) / 10;
}

// ---------- Blood pressure as you type ----------
/**
 * Formats a reading as you type: "120" -> "120/", "12080" -> "120/80",
 * "90" -> "90/" (a systolic starting 3-9 can only be 2 digits), and
 * deleting the "/" works ("120/" -> "120"). Each part is capped at 3 digits.
 */
export function formatBloodPressure(value, prev = "") {
  const s = String(value ?? "").replace(/[^\d/]/g, "");
  const deleting = s.length < String(prev ?? "").length;
  let sys;
  let dia;
  if (s.includes("/")) {
    const i = s.indexOf("/");
    sys = s.slice(0, i);
    dia = s.slice(i + 1).replace(/\//g, "");
  } else {
    const sysLen = /^[12]/.test(s) ? 3 : 2;
    sys = s.slice(0, sysLen);
    dia = s.slice(sysLen);
  }
  sys = sys.slice(0, 3);
  dia = dia.slice(0, 3);
  const sysComplete = sys.length === 3 || (sys.length === 2 && /^[3-9]/.test(sys));
  if (dia || s.includes("/")) return `${sys}/${dia}`;
  return sysComplete && !deleting ? `${sys}/` : sys;
}

/** Amber note for an unusual but possible reading. */
export function bloodPressureWarning(value) {
  const m = /^(\d{2,3})\/(\d{2,3})$/.exec(String(value ?? ""));
  if (!m) return "";
  const sys = Number(m[1]);
  const dia = Number(m[2]);
  if (sys >= 180 || dia >= 120) return "Very high reading. Please double-check.";
  if (sys < 90) return "Low reading. Please double-check.";
  return "";
}

// ---------- Names ----------
/** "muhammad ali" / "MUHAMMAD ALI" -> "Muhammad Ali"; mixed case is left alone. */
export function tidyNameCase(value) {
  const s = String(value ?? "");
  if (!/\p{L}/u.test(s)) return s;
  if (s !== s.toLowerCase() && s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\s'\-.])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
}
