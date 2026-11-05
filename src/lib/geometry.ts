import {
  ACCESSORY_BASE_SIZE,
  ACCESSORY_ORIGIN,
  ACCESSORY_VIEWBOX,
} from "./constants.ts";
import { placementFor, type PlacementLogo } from "./accessories.ts";
import { MOTION_TIMING, motionOffset, type MotionFrame } from "./motion.ts";
import type { AccessoryId, AccessoryTransform, MotionId } from "./types";

export type Box = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/** Accessory width as a share of the logo width. The stage uses it as a
 * CSS percentage of the logo box and exports multiply it by the natural
 * width, so the ratio is the same at any viewport or output size. */
export function accessoryWidthShare(scale: number) {
  return ACCESSORY_BASE_SIZE * scale;
}

export function accessorySize(
  id: AccessoryId,
  scale: number,
  logoWidth: number,
) {
  const [vbW, vbH] = ACCESSORY_VIEWBOX[id];
  const width = logoWidth * accessoryWidthShare(scale);
  return { width, height: width * (vbH / vbW) };
}

export function accessoryBox(
  logoWidth: number,
  logoHeight: number,
  id: AccessoryId,
  transform: AccessoryTransform,
  frame?: MotionFrame,
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
  const [fx, fy] = ACCESSORY_ORIGIN[id];
  const ox = (fx - 0.5) * width;
  const oy = (fy - 0.5) * height;
  const mRad = ((frame?.rot ?? 0) * Math.PI) / 180;
  const mCos = Math.cos(mRad);
  const mSin = Math.sin(mRad);
  const sx = frame?.sx ?? 1;
  const sy = frame?.sy ?? 1;
  const dy = ((frame?.dy ?? 0) / 100) * height;
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
  for (const [px, py] of corners) {
    // Motion first, around the CSS transform-origin, then the placement.
    const ux = (px - ox) * sx;
    const uy = (py - oy) * sy;
    const x = ox + ux * mCos - uy * mSin;
    const y = oy + dy + ux * mSin + uy * mCos;
    const rx = cx + x * cos - y * sin;
    const ry = cy + x * sin + y * cos;
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx);
    maxY = Math.max(maxY, ry);
  }
  return { minX, minY, maxX, maxY };
}

/** Shift the accessory so its box (rotation and padding included) stays
 * inside `stage`, given in the same units as the logo size with the logo at
 * 0,0. A position already inside is returned unchanged; an accessory larger
 * than the stage is centered on it. */
export function clampToStage(
  transform: AccessoryTransform,
  id: AccessoryId,
  logoWidth: number,
  logoHeight: number,
  stage: Box,
): AccessoryTransform {
  if (logoWidth <= 0 || logoHeight <= 0) return transform;
  const b = accessoryBox(logoWidth, logoHeight, id, transform);
  const shift = (lo: number, hi: number, min: number, max: number) => {
    if (hi - lo > max - min) return (min + max) / 2 - (lo + hi) / 2;
    if (lo < min) return min - lo;
    if (hi > max) return max - hi;
    return 0;
  };
  const dx = shift(b.minX, b.maxX, stage.minX, stage.maxX);
  const dy = shift(b.minY, b.maxY, stage.minY, stage.maxY);
  if (dx === 0 && dy === 0) return transform;
  return {
    ...transform,
    x: transform.x + (dx / logoWidth) * 100,
    y: transform.y + (dy / logoHeight) * 100,
  };
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

/** Export box that keeps every frame of the motion inside. */
export function motionExportViewBox(
  logoWidth: number,
  logoHeight: number,
  id: AccessoryId,
  transform: AccessoryTransform,
  motionId: MotionId,
) {
  let box: Box = { minX: 0, minY: 0, maxX: logoWidth, maxY: logoHeight };
  const steps = 72;
  const times = MOTION_TIMING[motionId].keys.map(([t]) => t);
  for (let i = 0; i < steps; i += 1) times.push(i / steps);
  for (const t of times) {
    const frame = motionOffset(motionId, t === 1 ? 0.999999 : t);
    box = unionBox(box, accessoryBox(logoWidth, logoHeight, id, transform, frame));
  }
  return {
    x: box.minX,
    y: box.minY,
    width: Math.max(1, box.maxX - box.minX),
    height: Math.max(1, box.maxY - box.minY),
  };
}

export function stageInsets(
  logo: PlacementLogo,
  id: AccessoryId,
  transform: AccessoryTransform,
) {
  // Room is reserved for the accessory at its resting spot (the Encima
  // placement for this logo) at its default size and rotation. Using the
  // live x/y made the padding follow a drag; using the live scale/rotation
  // made the logo shrink after a resize. The accessory is clamped to the
  // stage, so it never needs extra room. Exports use exportBounds instead.
  const logoWidth = logo.naturalWidth;
  const logoHeight = logo.naturalHeight;
  const restAt = placementFor("onTop", id, logo);
  void transform;
  const rest: AccessoryTransform = restAt;
  const box = accessoryBox(logoWidth, logoHeight, id, rest);
  const extra = 0.08;
  const cap = 0.24;
  return {
    top: Math.min(cap, Math.max(extra, extra - box.minY / Math.max(logoHeight, 1))),
    right: Math.min(cap, Math.max(extra, box.maxX / Math.max(logoWidth, 1) - 1 + extra)),
    bottom: Math.min(cap, Math.max(extra, box.maxY / Math.max(logoHeight, 1) - 1 + extra)),
    left: Math.min(cap, Math.max(extra, extra - box.minX / Math.max(logoWidth, 1))),
  };
}

export { SCALE_MAX, SCALE_MIN } from "./constants.ts";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Browsers refuse canvases much past 16k px a side; 8192 is safe everywhere.
export const PNG_MAX_SIDE = 8192;

export function exportRasterScale(viewWidth: number, viewHeight: number) {
  const longest = Math.max(viewWidth, viewHeight, 1);
  return Math.min(8, Math.max(1, 800 / longest), PNG_MAX_SIDE / longest);
}

export const GIF_MAX_SIDE = 800;

export function gifRasterScale(viewWidth: number, viewHeight: number) {
  const longest = Math.max(viewWidth, viewHeight, 1);
  return Math.min(8, GIF_MAX_SIDE / longest);
}
