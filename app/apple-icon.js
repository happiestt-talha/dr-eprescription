import { ImageResponse } from "next/og";
import { BRAND, MARK_SIZE, markElementsFor, resolveColor } from "@/components/brand/logo-geometry";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon: the MedScript mark on a mist tile (iOS rounds the corners itself).
export default function AppleIcon() {
  const bg = BRAND.mist;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: bg }}>
        <svg width={128} height={128} viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`}>
          {markElementsFor(128).map((el, i) => {
            const fill = el.fill ? resolveColor(el.fill, { bg }) : "none";
            const stroke = el.stroke ? resolveColor(el.stroke, { bg }) : undefined;
            return el.type === "circle" ? (
              <circle key={i} cx={el.cx} cy={el.cy} r={el.r} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} />
            ) : (
              <path key={i} d={el.d} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} />
            );
          })}
        </svg>
      </div>
    ),
    { ...size }
  );
}
