import { ACCESSORY_BASE_SIZE, ACCESSORY_VIEWBOX } from "./constants.ts";
import { clamp } from "./geometry.ts";
import type { AccessoryId, AccessoryTransform } from "./types";

export type LetterBand = {
  left: number;
  right: number;
  top: number;
  centerX: number;
};

export function findLetterBounds(
  width: number,
  height: number,
  hasInk: (x: number, y: number) => boolean,
  tapX: number,
): LetterBand | null {
  if (width < 1 || height < 1) return null;

  const columnHasInk = (x: number) => {
    for (let y = 0; y < height; y += 1) {
      if (hasInk(x, y)) return true;
    }
    return false;
  };

  let x = clamp(Math.round(tapX), 0, width - 1);
  if (!columnHasInk(x)) {
    let found = -1;
    for (let distance = 1; distance < width; distance += 1) {
      if (x - distance >= 0 && columnHasInk(x - distance)) {
        found = x - distance;
        break;
      }
      if (x + distance < width && columnHasInk(x + distance)) {
        found = x + distance;
        break;
      }
    }
    if (found < 0) return null;
    x = found;
  }

  const gap = Math.max(1, Math.round(width * 0.004));
  let left = x;
  let right = x;
  while (left > 0) {
    let empty = 0;
    for (let i = 1; i <= gap && left - i >= 0; i += 1) {
      if (!columnHasInk(left - i)) empty += 1;
    }
    if (empty >= gap) break;
    left -= 1;
  }
  while (right < width - 1) {
    let empty = 0;
    for (let i = 1; i <= gap && right + i < width; i += 1) {
      if (!columnHasInk(right + i)) empty += 1;
    }
    if (empty >= gap) break;
    right += 1;
  }

  if (right - left > width * 0.2) {
    const window = Math.max(4, Math.round(width * 0.045));
    left = clamp(Math.round(x - window), 0, width - 1);
    right = clamp(Math.round(x + window), 0, width - 1);
  }

  let top = height;
  for (let y = 0; y < height; y += 1) {
    for (let col = left; col <= right; col += 1) {
      if (hasInk(col, y)) {
        top = y;
        y = height;
        break;
      }
    }
  }
  if (top >= height) return null;

  return { left, right, top, centerX: (left + right) / 2 };
}

export function firstLetterTapX(width: number, hasColumnInk: (x: number) => boolean) {
  for (let x = 0; x < width; x += 1) {
    if (hasColumnInk(x)) return x;
  }
  return width * 0.18;
}

export function sitOnLetter(
  id: AccessoryId,
  logo: { naturalWidth: number; naturalHeight: number },
  band: { xPct: number; topPct: number },
): AccessoryTransform {
  const aspect = logo.naturalWidth / Math.max(logo.naturalHeight, 1);
  const scale = id === "cane" ? 0.3 : 0.34;
  const [vbW, vbH] = ACCESSORY_VIEWBOX[id];
  const heightPct = scale * ACCESSORY_BASE_SIZE * 100 * (vbH / vbW) * aspect;

  if (id === "beard") {
    return { x: band.xPct, y: Math.min(92, band.topPct + 36), scale, rotation: 4 };
  }
  if (id === "cane") {
    return { x: band.xPct, y: band.topPct + 18, scale, rotation: -14 };
  }
  return {
    x: band.xPct,
    y: band.topPct - heightPct / 2 + 6,
    scale,
    rotation: id === "elf" ? 16 : -18,
  };
}

export function bandToPercents(
  band: LetterBand,
  width: number,
  height: number,
) {
  return {
    xPct: (band.centerX / Math.max(width, 1)) * 100,
    topPct: (band.top / Math.max(height, 1)) * 100,
  };
}

export function scanLetterFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tapX: number,
) {
  const hasInk = (x: number, y: number) => data[(y * width + x) * 4 + 3] > 24;
  return findLetterBounds(width, height, hasInk, tapX);
}
