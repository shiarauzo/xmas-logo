import assert from "node:assert/strict";
import { test } from "node:test";
import { accessoryBox, exportRasterScale, exportViewBox } from "./geometry.ts";
import { motionOffset } from "./motion.ts";

test("el viewBox de export incluye el adorno encima", () => {
  const transform = { x: 50, y: -18, scale: 0.48, rotation: -8 };
  const view = exportViewBox(400, 80, "hat", transform);
  const box = accessoryBox(400, 80, "hat", transform);
  assert.ok(view.y <= box.minY + 0.01);
  assert.ok(view.y < 0);
  assert.ok(view.x + view.width >= box.maxX - 0.01);
  assert.ok(view.y + view.height >= 80);
});

test("un logo de 16 px se escala al exportar", () => {
  assert.ok(exportRasterScale(20, 20) >= 8);
  assert.equal(exportRasterScale(800, 800), 1);
});

test("gif frames loop back to rest", () => {
  const start = motionOffset("jump", 0);
  const mid = motionOffset("jump", 0.4);
  const spin = motionOffset("spin", 0.5);
  assert.ok(Object.is(start.dy, 0) || Object.is(start.dy, -0));
  assert.ok(mid.dy < -10);
  assert.equal(spin.rot, 180);
});
