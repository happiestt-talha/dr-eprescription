// Client-side matching for instant search over data a page has already loaded.
// Case- and accent-insensitive; every word of the query must appear in at
// least one field, so "amox 500" finds "Amoxil" + "500mg".

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function matches(query, ...fields) {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields.flat().map(normalizeText).join(" \u0000 ");
  return words.every((word) => haystack.includes(word));
}
