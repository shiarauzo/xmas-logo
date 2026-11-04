export type InkBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type InkInfo = {
  /** Visible pixels, in sample pixels. maxX and maxY are exclusive. */
  box: InkBox | null;
  /** Mean relative luminance of the visible pixels, 0 black to 1 white. */
  luminance: number;
};

export type StageTone = "light" | "dark";

const INK_SAMPLE_MAX = 512;
const ALPHA_MIN = 24;
const NEAR_WHITE = 235;
// Relative luminance of the light stage checker in globals.css.
const LIGHT_STAGE_L = 0.85;
// Below this contrast the logo fades on the light checker.
const MIN_CONTRAST_ON_LIGHT = 2;

export function inkSampleSize(width: number, height: number) {
  const longest = Math.max(width, height, 1);
  const scale = Math.min(1, INK_SAMPLE_MAX / longest);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function channel(value: number) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function isNearWhite(data: Uint8ClampedArray, i: number) {
  return (
    data[i + 3] > 240 &&
    data[i] > NEAR_WHITE &&
    data[i + 1] > NEAR_WHITE &&
    data[i + 2] > NEAR_WHITE
  );
}

/**
 * Finds the visible part of a logo: pixels that are not transparent and,
 * when the file has an opaque white background, not that background.
 */
export function analyzeInk(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): InkInfo {
  const corner = (x: number, y: number) => (y * width + x) * 4;
  const whiteBackground = [
    corner(0, 0),
    corner(width - 1, 0),
    corner(0, height - 1),
    corner(width - 1, height - 1),
  ].every((i) => isNearWhite(data, i));

  const scan = (skipWhite: boolean): InkInfo => {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let weight = 0;
    let lum = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        const alpha = data[i + 3];
        if (alpha <= ALPHA_MIN) continue;
        if (skipWhite && isNearWhite(data, i)) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        const a = alpha / 255;
        weight += a;
        lum +=
          a *
          (0.2126 * channel(data[i]) +
            0.7152 * channel(data[i + 1]) +
            0.0722 * channel(data[i + 2]));
      }
    }
    if (maxX < 0) return { box: null, luminance: 0 };
    return {
      box: { minX, minY, maxX: maxX + 1, maxY: maxY + 1 },
      luminance: lum / weight,
    };
  };

  if (whiteBackground) {
    const ink = scan(true);
    if (ink.box) return ink;
  }
  return scan(false);
}

function contrast(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Light stage by default; dark only for logos too light to read on it. */
export function stageTone(luminance: number): StageTone {
  return contrast(luminance, LIGHT_STAGE_L) >= MIN_CONTRAST_ON_LIGHT
    ? "light"
    : "dark";
}
