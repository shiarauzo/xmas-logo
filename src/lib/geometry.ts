import { ACCESSORY_BASE_SIZE, ACCESSORY_VIEWBOX } from "./constants.ts";
import type { AccessoryId, AccessoryTransform } from "./types";

export type Box = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function accessorySize(
  id: AccessoryId,
  scale: number,
  logoWidth: number,
) {
  const [vbW, vbH] = ACCESSORY_VIEWBOX[id];
  const width = logoWidth * ACCESSORY_BASE_SIZE * scale;
  return { width, height: width * (vbH / vbW) };
}

export function accessoryBox(
  logoWidth: number,
  logoHeight: number,
  id: AccessoryId,
  transform: AccessoryTransform,
): Box {
  const { width, height } = accessorySize(id, transform.scale, logoWidth);
  const pad = Math.max(width, height) * 0.14;
  const hw = width / 2 + pad;
  const hh = height / 2 + pad;
  const cx = (transform.x / 100) * logoWidth;
  const cy = (transform.y / 100) * logoHeight;
  const rad = (transform.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ] as const;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of corners) {
    const rx = cx + x * cos - y * sin;
    const ry = cy + x * sin + y * cos;
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx);
    maxY = Math.max(maxY, ry);
  }
  return { minX, minY, maxX, maxY };
}

export function unionBox(a: Box, b: Box): Box {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

export function exportViewBox(
  logoWidth: number,
  logoHeight: number,
  id: AccessoryId,
  transform: AccessoryTransform,
): { x: number; y: number; width: number; height: number } {
  const logo: Box = { minX: 0, minY: 0, maxX: logoWidth, maxY: logoHeight };
  const box = unionBox(logo, accessoryBox(logoWidth, logoHeight, id, transform));
  return {
    x: box.minX,
    y: box.minY,
    width: Math.max(1, box.maxX - box.minX),
    height: Math.max(1, box.maxY - box.minY),
  };
}

export function stageInsets(
  logoWidth: number,
  logoHeight: number,
  id: AccessoryId,
  transform: AccessoryTransform,
) {
  const box = accessoryBox(logoWidth, logoHeight, id, transform);
  const extra = 0.08;
  const cap = 0.24;
  return {
    top: Math.min(cap, Math.max(extra, extra - box.minY / Math.max(logoHeight, 1))),
    right: Math.min(cap, Math.max(extra, box.maxX / Math.max(logoWidth, 1) - 1 + extra)),
    bottom: Math.min(cap, Math.max(extra, box.maxY / Math.max(logoHeight, 1) - 1 + extra)),
    left: Math.min(cap, Math.max(extra, extra - box.minX / Math.max(logoWidth, 1))),
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Browsers refuse canvases much past 16k px a side; 8192 is safe everywhere.
export const PNG_MAX_SIDE = 8192;

export function exportRasterScale(viewWidth: number, viewHeight: number) {
  const longest = Math.max(viewWidth, viewHeight, 1);
  return Math.min(8, Math.max(1, 800 / longest), PNG_MAX_SIDE / longest);
}
