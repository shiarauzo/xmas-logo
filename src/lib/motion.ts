import { ACCESSORY_ORIGIN } from "./constants.ts";
import type { AccessoryId, MotionId } from "./types";

type Bezier = [number, number, number, number];

/**
 * The same keyframes, durations, and curves as ACCESSORY_MOTION_CSS, so the
 * GIF moves like the preview. Each key is [offset, ...values]:
 * jump [dy%, deg] (jump, spin in the air, land), spin [deg], sway [deg], bounce [dy%, sx, sy].
 * dy% is a share of the accessory height, like translate(0, -22%) with
 * transform-box: fill-box.
 */
export const MOTION_TIMING: Record<
  MotionId,
  { durationMs: number; easing: Bezier | null; keys: number[][] }
> = {
  jump: {
    durationMs: 1400,
    easing: [0.23, 1, 0.32, 1],
    keys: [
      [0, 0, 0],
      [0.2, -22, 0],
      [0.6, -22, 360],
      [0.85, 0, 360],
      [1, 0, 360],
    ],
  },
  spin: {
    durationMs: 1100,
    easing: null,
    keys: [
      [0, 0],
      [1, 360],
    ],
  },
  sway: {
    durationMs: 700,
    easing: [0.77, 0, 0.175, 1],
    keys: [
      [0, 0],
      [0.2, -10],
      [0.5, 10],
      [0.8, -6],
      [1, 0],
    ],
  },
  bounce: {
    durationMs: 800,
    easing: [0.23, 1, 0.32, 1],
    keys: [
      [0, 0, 1, 1],
      [0.35, -14, 0.97, 1.05],
      [0.55, 0, 1.06, 0.9],
      [1, 0, 1, 1],
    ],
  },
};

function cubicBezier([x1, y1, x2, y2]: Bezier, x: number) {
  const coord = (t: number, a: number, b: number) =>
    3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let i = 0; i < 40; i += 1) {
    const value = coord(t, x1, x2);
    if (Math.abs(value - x) < 1e-6) break;
    if (value < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return coord(t, y1, y2);
}

function sample(id: MotionId, t: number) {
  const { keys, easing } = MOTION_TIMING[id];
  const u = ((t % 1) + 1) % 1;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const [t0, ...a] = keys[i];
    const [t1, ...b] = keys[i + 1];
    if (u >= t0 && u <= t1) {
      const local = (u - t0) / Math.max(t1 - t0, 0.0001);
      // Like CSS, the timing function applies to each keyframe segment.
      const p = easing ? cubicBezier(easing, local) : local;
      return a.map((value, index) => value + (b[index] - value) * p);
    }
  }
  return keys[keys.length - 1].slice(1);
}

export function motionOffset(id: MotionId, t: number) {
  if (id === "spin") return { dx: 0, dy: 0, rot: sample(id, t)[0], sx: 1, sy: 1 };
  if (id === "jump") {
    const [dy, rot] = sample(id, t);
    return { dx: 0, dy, rot, sx: 1, sy: 1 };
  }
  if (id === "sway") return { dx: 0, dy: 0, rot: sample(id, t)[0], sx: 1, sy: 1 };
  const [dy, sx, sy] = sample(id, t);
  return { dx: 0, dy, rot: 0, sx, sy };
}

export type MotionFrame = ReturnType<typeof motionOffset>;

/**
 * SVG transform for one frame, in the accessory's own centered space,
 * turning around the same transform-origin as the CSS.
 */
export function motionTransform(
  id: AccessoryId,
  frame: MotionFrame,
  width: number,
  height: number,
) {
  const [fx, fy] = ACCESSORY_ORIGIN[id];
  const ox = ((fx - 0.5) * width).toFixed(3);
  const oy = ((fy - 0.5) * height).toFixed(3);
  const nx = (-(fx - 0.5) * width).toFixed(3);
  const ny = (-(fy - 0.5) * height).toFixed(3);
  const dy = ((frame.dy / 100) * height).toFixed(3);
  return `translate(${ox} ${oy}) translate(0 ${dy}) rotate(${frame.rot.toFixed(3)}) scale(${frame.sx.toFixed(4)} ${frame.sy.toFixed(4)}) translate(${nx} ${ny})`;
}

const GIF_FRAME_MS = 40;

/**
 * Frame times for one loop. GIF delays are in 10 ms steps, so they are
 * spread to add up to the CSS duration.
 */
export function gifFrames(id: MotionId) {
  const duration = MOTION_TIMING[id].durationMs;
  const count = Math.max(2, Math.round(duration / GIF_FRAME_MS));
  const frames: { t: number; delay: number }[] = [];
  let done = 0;
  for (let i = 0; i < count; i += 1) {
    const end = Math.round(((i + 1) * duration) / count / 10) * 10;
    frames.push({ t: i / count, delay: end - done });
    done = end;
  }
  return frames;
}
