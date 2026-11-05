import assert from "node:assert/strict";
import { test } from "node:test";
import { placementFor } from "./accessories.ts";
import {
  accessorySize,
  accessoryWidthShare,
  exportRasterScale,
  exportViewBox,
  gifRasterScale,
} from "./geometry.ts";

type Ink = { minX: number; minY: number; maxX: number; maxY: number };
const logo = (w: number, h: number, box: Ink) => ({
  naturalWidth: w,
  naturalHeight: h,
  ink: { box, tone: "light" as const },
});
const perInk = (id: "hat" | "elf" | "cane" | "beard", l: ReturnType<typeof logo>) => {
  const t = placementFor("onTop", id, l);
  return accessorySize(id, t.scale, l.naturalWidth).width / (l.ink.box.maxX - l.ink.box.minX);
};

test("#15 badge redondo: el gorro mide al menos 40% del ancho de la tinta", () => {
  const badge = logo(300, 300, { minX: 10, minY: 10, maxX: 290, maxY: 290 });
  assert.ok(perInk("hat", badge) >= 0.4, String(perInk("hat", badge)));
  assert.ok(perInk("elf", badge) >= 0.4);
  assert.ok(perInk("beard", badge) >= 0.4);
});

test("#15 logo alto: el gorro crece con el alto pero no pasa el ancho de la tinta", () => {
  const tall = logo(400, 1000, { minX: 100, minY: 0, maxX: 300, maxY: 1000 });
  for (const id of ["hat", "elf", "cane", "beard"] as const) {
    const r = perInk(id, tall);
    assert.ok(r >= 0.5 && r <= 1.0001, `${id} ${r}`);
  }
});

test("#15 el tamaño depende de la forma de la tinta, no del tamaño del archivo", () => {
  const small = logo(300, 300, { minX: 10, minY: 10, maxX: 290, maxY: 290 });
  const big = logo(3000, 3000, { minX: 100, minY: 100, maxX: 2900, maxY: 2900 });
  assert.ok(Math.abs(perInk("hat", small) - perInk("hat", big)) < 1e-9);
});

test("#15 un wordmark 5:1 queda con el tamaño de siempre", () => {
  const word = logo(1000, 200, { minX: 0, minY: 0, maxX: 1000, maxY: 200 });
  assert.ok(Math.abs(perInk("hat", word) - 0.48 * 0.46) < 1e-9);
});

// Preview: the accessory is accessoryWidthShare(scale) of the logo box in
// CSS, whatever the box measures. Exports rasterize the natural-size SVG.
test("#15 vista previa, PNG y GIF dan la misma proporción accesorio/logo", () => {
  const badge = logo(300, 300, { minX: 10, minY: 10, maxX: 290, maxY: 290 });
  const t = placementFor("onTop", "hat", badge);
  const share = accessoryWidthShare(t.scale);
  // Logo box widths measured on the stage at 1280, 390 and 360.
  const preview = [400, 305.5, 280.3].map((boxW) => (share * boxW) / boxW);
  const natural = accessorySize("hat", t.scale, 300).width;
  const view = exportViewBox(300, 300, "hat", t);
  const png = (natural * exportRasterScale(view.width, view.height)) / (300 * exportRasterScale(view.width, view.height));
  const gif = (natural * gifRasterScale(view.width, view.height)) / (300 * gifRasterScale(view.width, view.height));
  for (const p of preview) assert.ok(Math.abs(p - png) < 1e-9 && Math.abs(p - gif) < 1e-9);
});
