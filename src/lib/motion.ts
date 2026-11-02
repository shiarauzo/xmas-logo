import type { MotionId } from "./types";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function keysAt(keys: number[][], t: number) {
  const u = ((t % 1) + 1) % 1;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const [t0, ...a] = keys[i];
    const [t1, ...b] = keys[i + 1];
    if (u >= t0 && u <= t1) {
      const p = (u - t0) / Math.max(t1 - t0, 0.0001);
      return a.map((value, index) => lerp(value, b[index], p));
    }
  }
  return keys[keys.length - 1].slice(1);
}

export function motionOffset(id: MotionId, t: number) {
  const u = ((t % 1) + 1) % 1;
  if (id === "spin") return { dx: 0, dy: 0, rot: 360 * u, sx: 1, sy: 1 };
  if (id === "jump") {
    const peak = u < 0.4 ? u / 0.4 : 1 - (u - 0.4) / 0.6;
    return { dx: 0, dy: -22 * Math.sin((peak * Math.PI) / 2), rot: 0, sx: 1, sy: 1 };
  }
  if (id === "sway") {
    const [rot] = keysAt(
      [
        [0, 0],
        [0.2, -10],
        [0.5, 10],
        [0.8, -6],
        [1, 0],
      ],
      u,
    );
    return { dx: 0, dy: 0, rot, sx: 1, sy: 1 };
  }
  const [dy, sx, sy] = keysAt(
    [
      [0, 0, 1, 1],
      [0.35, -14, 0.97, 1.05],
      [0.55, 0, 1.06, 0.9],
      [1, 0, 1, 1],
    ],
    u,
  );
  return { dx: 0, dy, rot: 0, sx, sy };
}
