import { accessoryMarkup } from "./accessories.ts";
import { ACCESSORY_VIEWBOX } from "./constants.ts";
import { accessorySize } from "./geometry.ts";
import { bandToPercents, sitOnLetter, type LetterBand } from "./letter.ts";
import { motionTransform, type MotionFrame } from "./motion.ts";
import type { AccessoryTransform } from "./types";

/** Share card size for og:image and og:video. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * Kora, a made-up wordmark from the example gallery. The hat goes on its
 * A, read from the glyph path in public/examples/kora.svg: the legs end at
 * x 258.62 and 338.09 and the top is at y 10.33.
 */
export const OG_LOGO = {
  src: "public/examples/kora.svg",
  width: 512,
  height: 104,
  letter: { left: 258.62, right: 338.09, top: 10.33, centerX: (258.62 + 338.09) / 2 } satisfies LetterBand,
} as const;

/**
 * Logo units drawn around the logo: room above for the hat at the top of
 * its hop, and the same room below so the logo stays centered.
 */
const HEADROOM = 124;
export const OG_VIEW = {
  x: -8,
  y: -HEADROOM,
  width: OG_LOGO.width + 16,
  height: OG_LOGO.height + HEADROOM * 2,
} as const;

/** Bigger than a tapped hat (0.34), so it reads at link-preview size. */
const OG_HAT_SCALE = 0.52;
/** Fur brim center, as a share of the hat art height (y 119 of 150). */
const BRIM_CENTER = 119 / ACCESSORY_VIEWBOX.hat[1];
/** How far the brim center sits below the top of the letter, in logo units. */
const BRIM_SINK = 4;

/**
 * The studio's tap-a-letter placement (centered on the letter, tilted),
 * at a bigger scale, with the fur brim sunk onto the top of the A.
 */
export function ogHatTransform(): AccessoryTransform {
  const tapped = sitOnLetter(
    "hat",
    { naturalWidth: OG_LOGO.width, naturalHeight: OG_LOGO.height },
    bandToPercents(OG_LOGO.letter, OG_LOGO.width, OG_LOGO.height),
  );
  const { height } = accessorySize("hat", OG_HAT_SCALE, OG_LOGO.width);
  const centerY = OG_LOGO.letter.top + BRIM_SINK - (BRIM_CENTER - 0.5) * height;
  return { ...tapped, scale: OG_HAT_SCALE, y: (centerY / OG_LOGO.height) * 100 };
}

/**
 * The logo, with or without the hat, as one SVG. The hat layer is built
 * like the studio export: centered at the transform, turned by its
 * rotation, and moved by a motion frame around the hat's own origin.
 */
export function ogLogoSvg(logoSvg: string, options: { hat: boolean; frame?: MotionFrame }) {
  const view = OG_VIEW;
  const logo = logoSvg.replace(/<\?xml[^>]*>/i, "").replace(/<title>[^<]*<\/title>/i, "").trim();
  let hat = "";
  if (options.hat) {
    const t = ogHatTransform();
    const [vbW, vbH] = ACCESSORY_VIEWBOX.hat;
    const { width, height } = accessorySize("hat", t.scale, OG_LOGO.width);
    const tx = (t.x / 100) * OG_LOGO.width;
    const ty = (t.y / 100) * OG_LOGO.height;
    const motion = options.frame ? ` ${motionTransform("hat", options.frame, width, height)}` : "";
    hat = `<g transform="translate(${tx} ${ty}) rotate(${t.rotation})${motion}"><svg x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" viewBox="0 0 ${vbW} ${vbH}" overflow="visible">${accessoryMarkup("hat", "og-")}</svg></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.x} ${view.y} ${view.width} ${view.height}" width="${view.width}" height="${view.height}">${logo}${hat}</svg>`;
}

export function svgDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
