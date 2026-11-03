// All dates and times are shown and interpreted in the clinic's timezone, not
// the server's: hosts usually run in UTC, and "today", appointment times and
// report ranges must still line up with the clinic's wall clock.
// Safe to import from server and client code.

export const CLINIC_TZ = process.env.NEXT_PUBLIC_CLINIC_TIMEZONE || "Asia/Karachi";

function parts(date, timeZone = CLINIC_TZ) {
  const out = {};
  for (const p of new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)) {
    out[p.type] = p.value;
  }
  return out;
}

/** "YYYY-MM-DD" of the clinic's calendar day for `date`. */
export function clinicDateKey(date = new Date()) {
  const p = parts(new Date(date));
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Interpret a wall-clock time in the clinic's timezone.
 * Accepts "YYYY-MM-DDTHH:mm" (datetime-local) or "YYYY-MM-DD" (midnight).
 * Returns null for anything unparseable.
 */
export function parseClinicDateTime(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(String(value ?? "").trim());
  if (!m) return null;
  const [, y, mo, d, h = "00", mi = "00"] = m;
  // Reject impossible times like 10:75 or 25:00 (Date.UTC would roll them over).
  if (+h > 23 || +mi > 59) return null;
  const asUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  if (Number.isNaN(asUtc)) return null;
  // Offset between the clinic's wall clock and UTC at that moment (two passes cover DST edges).
  let ts = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(ts));
    const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    ts = asUtc - (wall - ts);
  }
  const result = new Date(ts);
  // Reject impossible dates like 2026-02-31 (they roll over).
  return clinicDateKey(result) === `${y}-${mo}-${d}` ? result : null;
}

/** Midnight (clinic time) at the start of the clinic day containing `date`, shifted by `days`. */
export function startOfClinicDay(date = new Date(), days = 0) {
  const [y, m, d] = clinicDateKey(date).split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return parseClinicDateTime(shifted.toISOString().slice(0, 10));
}

/** Value for an <input type="datetime-local"> showing `date` in clinic time. */
export function toClinicInputValue(date) {
  const p = parts(new Date(date));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** 26/10/2026 */
export function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

/** Calendar dates stored as UTC midnight (e.g. date of birth) must not shift with the timezone. */
export function formatCalendarDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

/** 26/10/2026, 2:30 pm */
export function formatDateTime(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

// ---------- Calendar keys ("YYYY-MM-DD") ----------
// The date pickers work on plain calendar keys so nothing shifts with the
// browser's timezone. Keys compare correctly as strings.

const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = MONTHS_LONG.map((m) => m.slice(0, 3));
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export { MONTHS_LONG, MONTHS_SHORT };

function pad(n) {
  return String(n).padStart(2, "0");
}

export function isDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** { y, m (1-12), d } from a key. */
export function splitDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

export function toDateKey(y, m, d) {
  // Normalise overflow (e.g. day 0, month 13) through UTC maths.
  const t = new Date(Date.UTC(y, m - 1, d));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function addDays(key, days) {
  const { y, m, d } = splitDateKey(key);
  return toDateKey(y, m, d + days);
}

/** Adds months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(key, months) {
  const { y, m, d } = splitDateKey(key);
  const last = daysInMonth(y, m + months);
  const first = toDateKey(y, m + months, 1);
  const { y: ny, m: nm } = splitDateKey(first);
  return toDateKey(ny, nm, Math.min(d, last));
}

export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(key) {
  const { y, m, d } = splitDateKey(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "02 Nov 2026" */
export function formatDateKey(key) {
  if (!isDateKey(key)) return "";
  const { y, m, d } = splitDateKey(key);
  return `${pad(d)} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** "Monday, 2 November 2026" (screen-reader labels) */
export function formatDateKeyLong(key) {
  const { y, m, d } = splitDateKey(key);
  return `${WEEKDAYS_LONG[weekdayOf(key)]}, ${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** Calendar key of a date stored as UTC midnight (date of birth). */
export function calendarKeyOf(date) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

// ---------- Clinic hours & appointment slots ----------

export const CLINIC_OPEN = process.env.NEXT_PUBLIC_CLINIC_OPEN || "09:00";
export const CLINIC_CLOSE = process.env.NEXT_PUBLIC_CLINIC_CLOSE || "21:00";
export const SLOT_MINUTES = 15;

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
}

/** "14:30" -> "2:30 pm" */
export function formatTimeOfDay(hhmm) {
  const mins = toMinutes(hhmm);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "am" : "pm"}`;
}

/**
 * Appointment slots ("HH:mm") within clinic hours for a clinic day. Slots that
 * have already passed (clinic time) come back with `past: true`.
 */
export function clinicTimeSlots(dateKey, now = new Date()) {
  const slots = [];
  const today = clinicDateKey(now);
  const p = parts(now);
  const nowMinutes = +p.hour * 60 + +p.minute;
  for (let t = toMinutes(CLINIC_OPEN); t < toMinutes(CLINIC_CLOSE); t += SLOT_MINUTES) {
    const value = `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
    const past = dateKey < today || (dateKey === today && t <= nowMinutes);
    slots.push({ value, label: formatTimeOfDay(value), past });
  }
  return slots;
}

// ---------- Age ----------

/** Whole years between a date of birth (UTC midnight) and today in the clinic. */
export function ageFromDob(dob, now = new Date()) {
  if (!dob) return null;
  const birth = splitDateKey(calendarKeyOf(dob));
  const today = splitDateKey(clinicDateKey(now));
  let age = today.y - birth.y;
  if (today.m < birth.m || (today.m === birth.m && today.d < birth.d)) age -= 1;
  return Math.max(0, age);
}

/**
 * Display age for a patient row ({ dateOfBirth, dobEstimated, age }).
 * Falls back to the legacy stored `age` for rows that have no date of birth.
 * `short` gives "34y", otherwise "34 years"; estimates get a "≈" prefix.
 * `at` gives the age on another day (e.g. a prescription's visit date).
 */
export function formatAge(patient, { short = false, at } = {}) {
  if (!patient) return "—";
  const years = patient.dateOfBirth ? ageFromDob(patient.dateOfBirth, at ? new Date(at) : undefined) : patient.age;
  if (years === null || years === undefined) return "—";
  const prefix = patient.dateOfBirth && patient.dobEstimated ? "≈" : "";
  if (short) return `${prefix}${years}y`;
  return `${prefix}${years} ${years === 1 ? "year" : "years"}`;
}

/** Estimated date of birth (1 January) for an approximate age, as a calendar key. */
export function estimatedDobKey(age, now = new Date()) {
  const { y } = splitDateKey(clinicDateKey(now));
  return `${y - age}-01-01`;
}
