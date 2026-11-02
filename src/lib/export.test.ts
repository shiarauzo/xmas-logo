import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ACCESSORY_MOTION_CSS } from "./accessories.ts";
import { ACCESSORY_JUMP_PCT } from "./constants.ts";
import { accessorySize, exportRasterScale, exportViewBox } from "./geometry.ts";

test("el viewBox de export incluye el adorno encima", () => {
  const transform = { x: 50, y: -18, scale: 0.48, rotation: -8 };
  const view = exportViewBox(400, 80, "hat", transform);
  const { height } = accessorySize("hat", transform.scale, 400);
  const jump = height * ACCESSORY_JUMP_PCT;
  const cy = (transform.y / 100) * 80;
  const peakTop = cy - height / 2 - jump;
  assert.ok(view.y <= peakTop + 0.01);
  assert.ok(view.y < 0);
  assert.ok(view.y + view.height >= 80);
});

test("un logo de 16 px se escala al exportar", () => {
  assert.ok(exportRasterScale(20, 20) >= 8);
  assert.equal(exportRasterScale(800, 800), 1);
});

test("el salto de un logo chico cabe en el viewBox", () => {
  const transform = { x: 50, y: 8, scale: 0.48, rotation: 0 };
  const logoW = 40;
  const logoH = 16;
  const view = exportViewBox(logoW, logoH, "hat", transform);
  const { height } = accessorySize("hat", transform.scale, logoW);
  const jump = height * ACCESSORY_JUMP_PCT;
  const cy = (transform.y / 100) * logoH;
  const peakTop = cy - height / 2 - jump;
  assert.ok(view.y <= peakTop + 0.01, `peak ${peakTop} sale de ${view.y}`);
  assert.match(ACCESSORY_MOTION_CSS, new RegExp(`-${ACCESSORY_JUMP_PCT * 100}%`));
  assert.doesNotMatch(ACCESSORY_MOTION_CSS, /-28px/);
});

test("el ejemplo se lee NIDO", () => {
  const svg = readFileSync(new URL("../../public/sample-logo.svg", import.meta.url), "utf8");
  assert.match(svg, /M214 156 V64 L286 156 V64/);
  assert.doesNotMatch(svg, /M214 64 V156 L286 64 V156/);
});
