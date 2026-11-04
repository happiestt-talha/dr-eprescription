// Pure helpers behind components/ui/data-list.jsx: in-browser search,
// filters and pagination over rows a page already loaded. No React, so they
// can be tested in plain node.

import { normalizeText } from "@/lib/search";

export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

// Pakistani mobiles are stored as +923…, shown as 0300-…, typed any way:
// compare on the national digits ("3001234567").
function phoneDigits(s) {
  return String(s ?? "").replace(/\D/g, "").replace(/^(0092|92|0)(?=3)/, "");
}

/**
 * Every word of the query must appear in the row's `searchText` (case- and
 * accent-insensitive). A query of 4+ digits also matches phone numbers
 * however they are written.
 */
export function rowMatches(row, query) {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = row._search ?? (row._search = normalizeText(row.searchText ?? ""));
  if (words.every((w) => text.includes(w))) return true;
  const digits = phoneDigits(query);
  if (digits.length >= 4 && /^[\d\s+()-]+$/.test(query.trim())) {
    const rowDigits = row._digits ?? (row._digits = String(row.searchText ?? "").split(/\s+/).map(phoneDigits).join(" "));
    return rowDigits.includes(digits);
  }
  return false;
}

/**
 * Applies the active filters ({ key: value }, "" = all) and the query.
 * `filterDefs` is [{ key, value: (row) => string }] (defaults to row[key]).
 */
export function filterRows(rows, { query = "", filters = {}, filterDefs = [] } = {}) {
  const active = filterDefs.filter((f) => filters[f.key]);
  if (!query.trim() && !active.length) return rows;
  return rows.filter(
    (row) => active.every((f) => String(f.value ? f.value(row) : row[f.key]) === String(filters[f.key])) && rowMatches(row, query)
  );
}

/** Clamps `page` and slices one page. */
export function paginate(rows, page, pageSize) {
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), lastPage);
  const start = (current - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), page: current, lastPage, total, from: total ? start + 1 : 0, to: Math.min(start + pageSize, total) };
}

/** Page numbers to show, with "…" gaps: [1, "…", 4, 5, 6, "…", 20]. */
export function pageWindow(page, lastPage, spread = 1) {
  if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1);
  const out = [1];
  const start = Math.max(2, page - spread);
  const end = Math.min(lastPage - 1, page + spread);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < lastPage - 1) out.push("…");
  out.push(lastPage);
  return out;
}

export function parsePageSize(value) {
  const n = Number(value);
  return PAGE_SIZES.includes(n) ? n : DEFAULT_PAGE_SIZE;
}

/** Initial DataList state from a page's searchParams: q, page, size and the given filter keys. */
export function listStateFrom(params = {}, filterKeys = []) {
  const one = (v) => (Array.isArray(v) ? v[0] : v)
  const state = { q: one(params.q) ?? "", page: one(params.page), size: one(params.size) }
  for (const key of filterKeys) state[key] = one(params[key]) ?? ""
  return state
}
