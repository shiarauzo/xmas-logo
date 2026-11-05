import { createElement as h } from "react";
import { OG_SIZE, OG_VIEW, ogLogoSvg, svgDataUrl } from "./og-scene.ts";
import type { MotionFrame } from "./motion.ts";

export const OG_TITLE = "Xmastize your logo";

const CARD = { width: 500, height: 330 };
const LOGO_WIDTH = 440;
const ARROW = svgDataUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><path d="M8 24h30M28 13l11 11-11 11" fill="none" stroke="#71717a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
);

function card(logoSvg: string, hat: boolean, frame?: MotionFrame) {
  const height = (LOGO_WIDTH * OG_VIEW.height) / OG_VIEW.width;
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: CARD.width,
        height: CARD.height,
        background: "#ffffff",
        borderRadius: 28,
      },
    },
    h("img", { src: svgDataUrl(ogLogoSvg(logoSvg, { hat, frame })), width: LOGO_WIDTH, height, alt: "" }),
  );
}

/**
 * The share card: the plain logo, an arrow, and the same logo with the
 * hat on its A. A motion frame moves the hat for og:video frames.
 */
export function ogCard(logoSvg: string, frame?: MotionFrame) {
  return h(
    "div",
    {
      style: {
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        color: "#fafafa",
      },
    },
    h("div", { style: { fontSize: 72, letterSpacing: -2, marginBottom: 48 } }, OG_TITLE),
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 28 } },
      card(logoSvg, false),
      h("img", { src: ARROW, width: 48, height: 48, alt: "" }),
      card(logoSvg, true, frame),
    ),
  );
}
