import {
  ACCESSORY_BASE_SIZE,
  ACCESSORY_ORIGIN,
  ACCESSORY_VIEWBOX,
} from "./constants.ts";
import { MOTION_TIMING, motionOffset, type MotionFrame } from "./motion.ts";
import type { AccessoryId, AccessoryTransform, MotionId } from "./types";

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

export function exportRasterScale(viewWidth: number, viewHeight: number) {
  const longest = Math.max(viewWidth, viewHeight, 1);
  return Math.min(8, Math.max(1, 800 / longest));
}

export const GIF_MAX_SIDE = 800;

export function gifRasterScale(viewWidth: number, viewHeight: number) {
  const longest = Math.max(viewWidth, viewHeight, 1);
  return Math.min(8, GIF_MAX_SIDE / longest);
}
