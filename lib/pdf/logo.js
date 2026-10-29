import { Svg, Path, Circle } from "@react-pdf/renderer";
import {
  BRAND,
  MARK_SIZE,
  WORDMARK_ELEMENTS,
  WORDMARK_HEIGHT,
  WORDMARK_VIEWBOX,
  WORDMARK_WIDTH,
  markElementsFor,
  resolveColor,
} from "@/components/brand/logo-geometry";

// react-pdf ignores `opacity` on <Svg>, so opacity is applied per element.
function PdfElement({ el, fill, stroke, opacity }) {
  const paint = {
    fill: fill || "none",
    stroke,
    strokeWidth: el.strokeWidth,
    fillOpacity: opacity,
    strokeOpacity: opacity,
  };
  return el.type === "circle" ? <Circle cx={el.cx} cy={el.cy} r={el.r} {...paint} /> : <Path d={el.d} {...paint} />;
}

/** The MedScript mark for react-pdf. `size` in points; `bg` is the surface colour (diaphragm cut-out). */
export function PdfLogoMark({ size, opacity = 1, bg = "#ffffff", style }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`} style={style}>
      {markElementsFor(size).map((el, i) => (
        <PdfElement
          key={i}
          el={el}
          fill={el.fill && resolveColor(el.fill, { bg })}
          stroke={el.stroke && resolveColor(el.stroke, { bg })}
          opacity={opacity}
        />
      ))}
    </Svg>
  );
}

/** The "medscript" wordmark for react-pdf. `height` in points. */
export function PdfWordmark({ height, style }) {
  const width = (height * WORDMARK_WIDTH) / WORDMARK_HEIGHT;
  const colors = { med: BRAND.ink, script: BRAND.sage };
  return (
    <Svg width={width} height={height} viewBox={WORDMARK_VIEWBOX} style={style}>
      {WORDMARK_ELEMENTS.map((el, i) => (
        <PdfElement
          key={i}
          el={el}
          fill={el.type === "circle" ? colors[el.part] : null}
          stroke={el.type === "path" ? colors[el.part] : undefined}
        />
      ))}
    </Svg>
  );
}
