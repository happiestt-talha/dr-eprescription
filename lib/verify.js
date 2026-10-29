import crypto from "crypto";

// Verification links are `/verify/<code>?t=<sig>`, where sig is an HMAC of the
// prescription code. Codes are sequential, so the signature is what stops
// people from enumerating them to look up patient details.

function sign(code) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(code).digest("base64url").slice(0, 16);
}

export function verifyToken(code, token) {
  if (typeof token !== "string") return false;
  const expected = Buffer.from(sign(code));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export function verifyPath(code) {
  return `/verify/${encodeURIComponent(code)}?t=${sign(code)}`;
}

export function buildVerifyUrl(requestUrl, code) {
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || new URL(requestUrl).origin;
  return `${baseUrl.replace(/\/$/, "")}${verifyPath(code)}`;
}
