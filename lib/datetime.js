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
