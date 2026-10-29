// Canonical forms for login identifiers, applied on every write and at login,
// so "Dr@Clinic.com " and "dr@clinic.com" (or "0300-123 4567" and
// "+923001234567") are the same account. Built on lib/sanitize.js.

import { normalizeEmail, normalizePhonePK } from "@/lib/sanitize";

export { normalizeEmail, normalizePhonePK };

/** Login identifier: lowercased email if it contains "@", otherwise a +92 mobile ("" if invalid). */
export function normalizeLoginId(value) {
  const raw = String(value ?? "").trim();
  return raw.includes("@") ? normalizeEmail(raw) : normalizePhonePK(raw);
}

/**
 * Stored forms a login identifier may still have. Patient logins created before
 * phones were standardised are stored as "03…" instead of "+92…", until
 * scripts/normalize-phones.js converts them.
 */
export function loginIdCandidates(value) {
  const id = normalizeLoginId(value);
  if (!id) return [];
  return id.startsWith("+92") ? [id, `0${id.slice(3)}`] : [id];
}
