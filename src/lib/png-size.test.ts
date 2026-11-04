import assert from "node:assert/strict";
import { test } from "node:test";
import { exportRasterScale } from "./geometry.ts";

test("el PNG de un SVG con coordenadas enormes cabe en un canvas", () => {
  const scale = exportRasterScale(1_000_000, 250_000);
  assert.ok(Math.round(1_000_000 * scale) <= 8192);
  assert.ok(Math.round(250_000 * scale) >= 1);
});

test("el PNG de un logo de 4000 px sale a tamaño real", () => {
  assert.equal(exportRasterScale(4000, 2785), 1);
});
