import { cn } from "@/lib/utils";
import {
  BRAND,
  BRAND_NAME,
  MARK_SIZE,
  WORDMARK_ELEMENTS,
  WORDMARK_VIEWBOX,
  markElementsFor,
  resolveColor,
} from "./logo-geometry";

// On dark surfaces the deep-sage half of the mark becomes paper.
const INVERTED_PALETTE = { ...BRAND, ink: BRAND.paper };

function Element({ el, bg, palette }) {
  const fill = el.fill ? resolveColor(el.fill, { bg, palette }) : "none";
  const stroke = el.stroke ? resolveColor(el.stroke, { bg, palette }) : undefined;
  if (el.type === "circle") {
    return <circle cx={el.cx} cy={el.cy} r={el.r} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} />;
  }
  return <path d={el.d} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} />;
}

/**
 * The MedScript mark. Size it with a height class (e.g. "h-8"). Pass `px` when
 * rendering below 32px so the chestpiece detail simplifies, and `bg` when it
 * sits on a non-white surface (the diaphragm is a cut-out in that colour).
 * `inverted` is for dark surfaces; `palette` overrides colours entirely.
 */
export function LogoMark({ className, px = 64, bg = "#ffffff", inverted = false, palette, title = BRAND_NAME }) {
  const colors = palette || (inverted ? INVERTED_PALETTE : BRAND);
  return (
    <svg
      viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`}
      className={cn("h-8 w-auto shrink-0", className)}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      {markElementsFor(px).map((el, i) => (
        <Element key={i} el={el} bg={bg} palette={colors} />
      ))}
    </svg>
  );
}

/** The "medscript" wordmark as paths. `inverted` is for dark backgrounds. */
export function Wordmark({ className, inverted = false }) {
  const colors = inverted ? { med: BRAND.paper, script: BRAND.mint } : { med: BRAND.ink, script: BRAND.sage };
  return (
    <svg viewBox={WORDMARK_VIEWBOX} className={cn("h-5 w-auto shrink-0", className)} role="img" aria-label={BRAND_NAME}>
      {WORDMARK_ELEMENTS.map((el, i) =>
        el.type === "circle" ? (
          <circle key={i} cx={el.cx} cy={el.cy} r={el.r} fill={colors[el.part]} />
        ) : (
          <path key={i} d={el.d} fill="none" stroke={colors[el.part]} strokeWidth={el.strokeWidth} />
        )
      )}
    </svg>
  );
}

/** Mark + wordmark lockup, with an optional small subtitle (e.g. the portal name). */
export function Logo({ className, markClassName = "h-8", wordClassName = "h-[22px]", subtitle, px, bg }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} px={px} bg={bg} />
      <span className="flex flex-col items-start gap-1.5">
        <Wordmark className={wordClassName} />
        {subtitle ? (
          <span className="text-[10px] font-semibold uppercase leading-none tracking-wider text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
