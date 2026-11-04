// Suggestions for the free-text clinical fields (prescription medicine rows,
// lab-test instructions) and the quick-add chips. Plain data plus a few pure
// helpers, safe on server and client. Suggestions never restrict input: staff
// can always type something else.

/** { value, aliases } — aliases are abbreviations people type ("bd", "tds"). */
export const FREQUENCIES = [
  { value: "Once daily", aliases: ["od", "qd", "1x", "once"] },
  { value: "Twice daily", aliases: ["bd", "bid", "2x", "twice"] },
  { value: "Three times daily", aliases: ["tds", "tid", "3x", "thrice"] },
  { value: "Four times daily", aliases: ["qid", "qds", "4x"] },
  { value: "Every 4 hours", aliases: ["q4h", "4 hourly"] },
  { value: "Every 6 hours", aliases: ["q6h", "6 hourly"] },
  { value: "Every 8 hours", aliases: ["q8h", "8 hourly"] },
  { value: "Every 12 hours", aliases: ["q12h", "12 hourly"] },
  { value: "In the morning", aliases: ["om", "morning", "mane"] },
  { value: "At bedtime", aliases: ["hs", "night", "nocte", "bedtime"] },
  { value: "When needed", aliases: ["sos", "prn", "as needed", "if required"] },
  { value: "Once weekly", aliases: ["weekly", "1 week"] },
  { value: "Immediately (stat)", aliases: ["stat", "now"] },
];

export const MEDICINE_INSTRUCTIONS = [
  { value: "After meals", aliases: ["pc", "after food"] },
  { value: "Before meals", aliases: ["ac", "before food"] },
  { value: "With meals", aliases: ["with food"] },
  { value: "On an empty stomach", aliases: ["empty"] },
  { value: "At bedtime", aliases: ["hs", "night"] },
  { value: "With plenty of water", aliases: ["water"] },
  { value: "Do not crush or chew", aliases: ["swallow whole"] },
  { value: "Shake well before use", aliases: ["shake"] },
  { value: "Apply to the affected area", aliases: ["topical", "apply"] },
  { value: "Complete the full course", aliases: ["course", "antibiotic"] },
];

export const LAB_INSTRUCTIONS = [
  { value: "Fasting 8–12 hours", aliases: ["fasting", "nbm", "empty stomach"] },
  { value: "Morning sample", aliases: ["early morning", "first urine"] },
  { value: "Random sample", aliases: ["random", "any time"] },
  { value: "Urgent", aliases: ["stat", "asap"] },
  { value: "Repeat after 1 week", aliases: ["repeat", "follow up"] },
  { value: "Bring previous reports", aliases: ["previous", "old reports"] },
];

/** Dose units and common doses for each medicine dosage form. */
const DOSAGE_UNITS = {
  tablet: { one: "tablet", many: "tablets", common: ["½ tablet", "1 tablet", "2 tablets"] },
  capsule: { one: "capsule", many: "capsules", common: ["1 capsule", "2 capsules"] },
  syrup: { one: "ml", many: "ml", common: ["2.5 ml", "5 ml", "10 ml", "15 ml"] },
  drops: { one: "drop", many: "drops", common: ["1 drop", "2 drops", "3 drops"] },
  inhaler: { one: "puff", many: "puffs", common: ["1 puff", "2 puffs"] },
  injection: { one: "ampoule", many: "ampoules", common: ["1 ampoule", "1 vial"] },
  cream: { one: "application", many: "applications", common: ["Apply a thin layer"] },
};
const ANY_FORM = ["1 tablet", "2 tablets", "1 capsule", "5 ml", "10 ml", "1 puff"];

/** Chips for quick entry; clicking one appends it to the field. */
export const ALLERGY_CHIPS = ["None known", "Penicillin", "Sulfa drugs", "NSAIDs", "Aspirin", "Latex"];
export const CONDITION_CHIPS = ["None", "Hypertension", "Type 2 diabetes", "Asthma", "Ischaemic heart disease", "Hypothyroidism"];
export const ADVICE_CHIPS = ["Plenty of fluids", "Rest", "Light diet", "Follow up in 3 days", "Follow up in 1 week", "Return if symptoms worsen"];

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();

/**
 * Entries whose value has a word starting with the query (or whose alias
 * does), best matches first. Empty query: everything, in list order.
 */
export function suggestFrom(list, query, limit = 8) {
  const q = norm(query);
  if (!q) return list.slice(0, limit).map((e) => e.value);
  const scored = [];
  for (const entry of list) {
    const value = norm(entry.value);
    const words = value.split(/[\s–-]+/);
    let score = -1;
    if (value === q) score = 0;
    else if (entry.aliases?.some((a) => norm(a) === q)) score = 1;
    else if (value.startsWith(q)) score = 2;
    else if (entry.aliases?.some((a) => norm(a).startsWith(q))) score = 3;
    else if (words.some((w) => w.startsWith(q))) score = 4;
    else if (q.length >= 3 && value.includes(q)) score = 5;
    if (score >= 0) scored.push([score, entry.value]);
  }
  return scored.sort((a, b) => a[0] - b[0]).slice(0, limit).map(([, v]) => v);
}

/** Dosage suggestions for a medicine's form: "2" -> "2 tablets". */
export function suggestDosage(query, dosageForm) {
  const unit = DOSAGE_UNITS[dosageForm];
  const q = String(query ?? "").trim();
  const n = /^(\d+(?:\.\d+)?|½)$/.exec(q)?.[1];
  if (n && unit) return [`${n} ${n === "1" || n === "½" ? unit.one : unit.many}`];
  if (n) return [`${n} tablet${n === "1" ? "" : "s"}`, `${n} capsule${n === "1" ? "" : "s"}`, `${n} ml`];
  const pool = (unit?.common ?? ANY_FORM).map((value) => ({ value }));
  return suggestFrom(pool, q);
}

/** Duration suggestions: "5" -> 5 days/weeks/months, "5d" -> "5 days", "2w" -> "2 weeks". */
export function suggestDuration(query) {
  const q = norm(query);
  const m = /^(\d{1,3})\s*([dwm]|da|day|days|we|wee|week|weeks|mo|mon|month|months)?$/.exec(q);
  if (m) {
    const n = Number(m[1]);
    const unit = m[2]?.[0];
    const make = (u) => `${n} ${u}${n === 1 ? "" : "s"}`;
    if (unit === "d") return [make("day")];
    if (unit === "w") return [make("week")];
    if (unit === "m") return [make("month")];
    return [make("day"), make("week"), make("month")];
  }
  return suggestFrom(
    [
      { value: "3 days" },
      { value: "5 days" },
      { value: "7 days" },
      { value: "10 days" },
      { value: "2 weeks" },
      { value: "1 month" },
      { value: "Until finished", aliases: ["finish", "complete"] },
      { value: "Ongoing", aliases: ["continue", "long term", "lifelong"] },
    ],
    q
  );
}

/** Appends a chip to a comma-separated field without duplicates. */
export function appendChip(current, chip) {
  const parts = String(current ?? "")
    .split(/,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.some((p) => p.toLowerCase() === chip.toLowerCase())) return parts.join(", ");
  // "None" replaces everything else, and anything else replaces "None".
  const isNone = /^none/i.test(chip);
  const kept = isNone ? [] : parts.filter((p) => !/^none/i.test(p));
  return [...kept, chip].join(", ");
}
