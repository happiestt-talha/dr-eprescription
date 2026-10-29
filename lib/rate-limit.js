// In-memory fixed-window limiter for failed logins. It is per server process:
// fine for a single `next start` instance, but on multiple instances or
// serverless it needs a shared store (e.g. Redis) to be effective.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map(); // key -> { count, resetAt }

function entry(key, now) {
  const e = failures.get(key);
  if (!e || e.resetAt <= now) return null;
  return e;
}

export function isLimited(keys, now = Date.now()) {
  return keys.some((key) => (entry(key, now)?.count ?? 0) >= MAX_FAILURES);
}

export function recordFailure(keys, now = Date.now()) {
  for (const key of keys) {
    const e = entry(key, now) ?? { count: 0, resetAt: now + WINDOW_MS };
    e.count += 1;
    failures.set(key, e);
  }
  // Keep the map from growing without bound.
  if (failures.size > 10_000) {
    for (const [key, e] of failures) if (e.resetAt <= now) failures.delete(key);
  }
}

export function clearFailures(keys) {
  for (const key of keys) failures.delete(key);
}
