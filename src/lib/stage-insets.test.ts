import assert from "node:assert/strict";
import { test } from "node:test";
import { placementFor } from "./accessories.ts";
import { stageInsets } from "./geometry.ts";

const tall = { naturalWidth: 200, naturalHeight: 800, ink: { box: { minX: 0, minY: 0, maxX: 200, maxY: 800 }, tone: "light" as const } };
const wide = { naturalWidth: 1000, naturalHeight: 200, ink: { box: { minX: 0, minY: 0, maxX: 1000, maxY: 200 }, tone: "light" as const } };

// The stage pads itself with these insets. If they follow the drag, the
// logo moves under the pointer and reflows on release.
for (const [name, l] of [["logo alto 200x800", tall], ["wordmark 1000x200", wide]] as const) {
  for (const id of ["hat", "elf", "cane", "beard"] as const) {
    test(`el margen del escenario no cambia al arrastrar (${id}, ${name})`, () => {
      const start = placementFor("onTop", id, l);
      const before = stageInsets(l, id, start);
      for (const [dx, dy] of [[0, 12.5], [0, 40], [-30, 5], [25, -20], [0, 90]]) {
        const moved = { ...start, x: start.x + dx, y: start.y + dy };
        assert.deepEqual(stageInsets(l, id, moved), before, `${dx},${dy}`);
      }
    });
  }
}

test("con el gorro en su lugar el wordmark deja el mismo espacio arriba que antes", () => {
  const t = placementFor("onTop", "hat", wide);
  const ins = stageInsets(wide, "hat", t);
  assert.equal(ins.top, 0.24);
  assert.equal(ins.bottom, 0.08);
});

test("la barba reserva espacio abajo, no arriba", () => {
  const t = placementFor("onTop", "beard", wide);
  const ins = stageInsets(wide, "beard", t);
  assert.equal(ins.top, 0.08);
  assert.ok(ins.bottom > 0.08);
});

test("un logo con margen no pierde tamaño: el gorro descansa dentro del archivo", () => {
  const padded = { naturalWidth: 400, naturalHeight: 400, ink: { box: { minX: 60, minY: 220, maxX: 340, maxY: 300 }, tone: "light" as const } };
  const ins = stageInsets(padded, "hat", placementFor("onTop", "hat", padded));
  assert.equal(ins.top, 0.08);
});

// Resizing or rotating the accessory must not shrink the logo: the
// accessory is clamped to the stage, so padding only covers its rest spot.
for (const [name, l] of [["logo alto 200x800", tall], ["wordmark 1000x200", wide]] as const) {
  for (const id of ["hat", "elf", "cane", "beard"] as const) {
    test(`el margen no cambia al redimensionar o rotar (${id}, ${name})`, () => {
      const start = placementFor("onTop", id, l);
      const before = stageInsets(l, id, start);
      for (const [k, r] of [[2.5, 0], [0.4, 0], [1, 45], [3, -90]]) {
        const t = { ...start, scale: start.scale * k, rotation: (start.rotation ?? 0) + r };
        assert.deepEqual(stageInsets(l, id, t), before, `${k},${r}`);
      }
    });
  }
}
