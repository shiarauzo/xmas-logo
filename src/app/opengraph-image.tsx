import { ImageResponse } from "next/og";
import { accessoryMarkup, placementFor } from "@/lib/accessories";
import { ACCESSORY_VIEWBOX } from "@/lib/constants";
import { accessorySize } from "@/lib/geometry";

export const alt = "ACMECORP logo with a Santa hat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The white logo card and where the ACMECORP glyphs land inside it,
// read from the rendered image. The hat is seated with the same
// placement the studio uses, so it sits on the letters, not the card.
const CARD = { width: 860, height: 250 };
const INK = { minX: 104, minY: 80, maxX: 750, maxY: 170 };

function hatLayer() {
  const [vbW, vbH] = ACCESSORY_VIEWBOX.hat;
  const t = placementFor("onTop", "hat", {
    naturalWidth: CARD.width,
    naturalHeight: CARD.height,
    ink: { box: INK },
  });
  const { width, height } = accessorySize("hat", t.scale, CARD.width);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="${width}" height="${height}">${accessoryMarkup("hat", "og-")}</svg>`;
  return {
    src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    width,
    height,
    left: (t.x / 100) * CARD.width - width / 2,
    top: (t.y / 100) * CARD.height - height / 2,
    rotation: t.rotation,
  };
}

export default function OpengraphImage() {
  const hat = hatLayer();
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
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: CARD.width,
            height: CARD.height,
            marginTop: 70,
            background: "#ffffff",
            borderRadius: 32,
          }}
        >
          <div style={{ fontSize: 120, fontWeight: 700, color: "#1d4ed8", letterSpacing: -2 }}>ACMECORP</div>
          <img
            src={hat.src}
            width={hat.width}
            height={hat.height}
            alt=""
            style={{
              position: "absolute",
              left: hat.left,
              top: hat.top,
              transform: `rotate(${hat.rotation}deg)`,
            }}
          />
        </div>
        <div style={{ marginTop: 56, fontSize: 72, fontWeight: 700 }}>Xmastize your logo</div>
      </div>
    ),
    size,
  );
}
