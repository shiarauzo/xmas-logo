import { ImageResponse } from "next/og";

export const alt = "ACMECORP logo with a Santa hat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ position: "relative", display: "flex", padding: "70px 60px 40px", background: "#ffffff", borderRadius: 32 }}>
          <div style={{ fontSize: 120, fontWeight: 700, color: "#1d4ed8", letterSpacing: -2 }}>ACMECORP</div>
          {/* Santa hat */}
          <svg width="220" height="190" viewBox="0 0 220 190" style={{ position: "absolute", top: -95, left: 10 }}>
            <path d="M30 150 C60 60 120 20 190 40 C150 60 140 100 170 150 Z" fill="#dc2626" />
            <rect x="15" y="140" width="175" height="40" rx="20" fill="#f4f4f5" transform="rotate(-8 100 160)" />
            <circle cx="192" cy="42" r="22" fill="#f4f4f5" />
          </svg>
        </div>
        <div style={{ marginTop: 56, fontSize: 72, fontWeight: 700 }}>Xmastize your logo</div>
      </div>
    ),
    size,
  );
}
