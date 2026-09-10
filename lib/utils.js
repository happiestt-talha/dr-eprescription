import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function serialize(data) {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

