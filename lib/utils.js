// One class-merging helper for the whole app. `cn` (by shadcn) is a drop-in
// replacement for clsx + tailwind-merge, and it's what generated ui components use.
export { cn } from "cn";

export function serialize(data) {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

/** A search param as a single string (`?q=a&q=b` arrives as an array). */
export function firstParam(value) {
  return Array.isArray(value) ? value[0] : value;
}
