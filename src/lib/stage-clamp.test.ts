import assert from "node:assert/strict";
import { test } from "node:test";
import { accessoryBox, clampToStage } from "./geometry.ts";

// Logo box 400x200 inside a stage that reaches 40px past it on every side.
const W = 400;
const H = 200;
const stage = { minX: -40, minY: -40, maxX: W + 40, maxY: H + 40 };
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

for (const id of ["hat", "elf", "cane", "beard"] as const) {
  test(`el adorno no sale del escenario al arrastrar lejos (${id})`, () => {
    for (const [x, y] of [[-500, 50], [900, 50], [50, -900], [50, 900], [-900, -900], [900, 900]]) {
      const t = clampToStage({ x, y, scale: 0.6, rotation: 15 }, id, W, H, stage);
      const b = accessoryBox(W, H, id, t);
      assert.ok(b.minX >= stage.minX - 1e-6 && b.maxX <= stage.maxX + 1e-6, `${x},${y} x`);
      assert.ok(b.minY >= stage.minY - 1e-6 && b.maxY <= stage.maxY + 1e-6, `${x},${y} y`);
    }
  });

  test(`dentro del escenario el adorno no se toca (${id})`, () => {
    const t = { x: 50, y: 50, scale: 1, rotation: 0 };
    assert.deepEqual(clampToStage(t, id, W, H, stage), t);
  });
}

test("un adorno más grande que el escenario queda centrado", () => {
  const tiny = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
  const t = clampToStage({ x: 300, y: -300, scale: 3, rotation: 0 }, "hat", W, H, tiny);
  const b = accessoryBox(W, H, "hat", t);
  assert.ok(near((b.minX + b.maxX) / 2, 5) && near((b.minY + b.maxY) / 2, 5));
});
