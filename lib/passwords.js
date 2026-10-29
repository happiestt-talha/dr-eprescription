import crypto from "crypto";

/**
 * Temporary password handed over in person: 10 characters from an alphabet
 * without look-alikes (0/o, 1/l/i), so it's easy to read aloud; about 49 bits.
 * Whoever receives it must replace it on first sign-in (users.mustChangePassword).
 */
export function generateTempPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
