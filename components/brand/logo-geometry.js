// MedScript brand: single source of truth for the logo. The web components,
// app icons and PDF renderer all draw from this file, so a change here
// changes the brand everywhere.
//
// The mark is an S drawn as a stethoscope: the earpiece and upper tube in deep
// sage (the doctor), the lower tube and chestpiece in mint (the patient). The
// colour changes on a clean vertical cut at the joint. Construction: 24-unit
// grid, one 3-unit stroke (= 2px at 16px), half-circles and straight lines;
// the top bowl (r 3.4) is optically smaller than the bottom (r 3.9).

export const BRAND_NAME = "MedScript";

export const BRAND = {
  ink: "#2f5d50", // deep sage: mark (doctor side), "med" in the wordmark, headings
  sage: "#4e8c76", // mid sage: "script" in the wordmark (readable on light backgrounds)
  mint: "#7dbb9f", // mint: mark (patient side), accents
  mist: "#e3efe8", // light tint: icon tiles, table stripes
  paper: "#f4f8f5", // page background
};

export const MARK_SIZE = 24;
const STROKE = 3;

/**
 * Mark elements, painted in order. `color` is a BRAND key, or "bg" for the
 * colour of whatever the mark sits on (the chestpiece's diaphragm is a cut-out).
 * `small` swaps in a simplified element below ~32px so the mark doesn't fill in.
 */
export const MARK_ELEMENTS = [
  { type: "path", d: "M18.45 3.4 H12.35 A3.4 3.4 0 0 0 12.35 10.2", stroke: "ink", strokeWidth: STROKE },
  { type: "circle", cx: 18.45, cy: 3.4, r: 2.05, fill: "ink" },
  { type: "path", d: "M12.35 11.4 A3.9 3.9 0 0 1 12.35 19.2 H10.2", stroke: "mint", strokeWidth: STROKE },
  { type: "circle", cx: 6.95, cy: 19.2, r: 3.45, fill: "mint" },
  {
    type: "circle", cx: 6.95, cy: 19.2, r: 1.85, stroke: "bg", strokeWidth: 1.1,
    small: { type: "circle", cx: 6.95, cy: 19.2, r: 1.2, fill: "bg" },
  },
];

// Wordmark "medscript", drawn as monoline paths in the same construction as the
// mark: x-height 10, ascender 14, bowl radius 5, one 2-unit stroke.
// Baseline is y = 0; the viewBox covers the ascender to the descender.
export const WORDMARK_VIEWBOX = "0 -15 99.4 20";
export const WORDMARK_WIDTH = 99.4;
export const WORDMARK_HEIGHT = 20;
const WORD_STROKE = 2;

export const WORDMARK_ELEMENTS = [
  { type: "path", part: "med", d: "M1 -10 V0 M1 -6.5 A3.5 3.5 0 0 1 8 -6.5 V0 M8 -6.5 A3.5 3.5 0 0 1 15 -6.5 V0" },
  { type: "path", part: "med", d: "M18.4 -5 H28.4 A5 5 0 1 0 26.94 -1.46" },
  { type: "path", part: "med", d: "M41 -5 A5 5 0 1 0 31 -5 A5 5 0 1 0 41 -5 M41 -14 V0" },
  { type: "path", part: "script", d: "M52.4 -10 H48.3 A2.5 2.5 0 0 0 48.3 -5 A2.5 2.5 0 0 1 48.3 0 H44.2" },
  { type: "path", part: "script", d: "M63.04 -8.54 A5 5 0 1 0 63.04 -1.46" },
  { type: "path", part: "script", d: "M66.9 -10 V0 M66.9 -5 A5 5 0 0 1 71.9 -10" },
  { type: "path", part: "script", d: "M75 -10 V0" },
  { type: "circle", part: "script", cx: 75, cy: -13.4, r: 1.24 },
  { type: "path", part: "script", d: "M80.2 -10 V4 M80.2 -5 A5 5 0 1 0 90.2 -5 A5 5 0 1 0 80.2 -5" },
  { type: "path", part: "script", d: "M95.4 -13 V0 M93.4 -10 H98.4" },
].map((el) => (el.type === "path" ? { ...el, strokeWidth: WORD_STROKE } : el));

/** Resolve an element's colour key against a palette (plus the background colour). */
export function resolveColor(key, { palette = BRAND, bg = "#ffffff" } = {}) {
  if (!key) return undefined;
  return key === "bg" ? bg : palette[key];
}

/** Mark elements for a given rendered size (simplified details below 32px). */
export function markElementsFor(px = 64) {
  return MARK_ELEMENTS.map((el) => (px < 32 && el.small ? el.small : el));
}

function elementToSvg(el, opts) {
  const fill = el.fill ? resolveColor(el.fill, opts) : "none";
  const stroke = el.stroke ? ` stroke="${resolveColor(el.stroke, opts)}" stroke-width="${el.strokeWidth}"` : "";
  if (el.type === "circle") return `<circle cx="${el.cx}" cy="${el.cy}" r="${el.r}" fill="${fill}"${stroke}/>`;
  return `<path d="${el.d}" fill="${fill}"${stroke}/>`;
}

/** Standalone SVG markup of the mark, e.g. for app/icon.svg. `tile` adds a rounded square behind it. */
export function markSvg({ tile = false, px = 64 } = {}) {
  const bg = tile ? BRAND.mist : "#ffffff";
  const body = markElementsFor(px).map((el) => elementToSvg(el, { bg })).join("");
  if (!tile) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${body}</svg>`;
  // 28-unit tile with the 24-unit mark inset by 2 on each side.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28" rx="6.5" fill="${bg}"/><g transform="translate(2 2)">${body}</g></svg>`;
}
