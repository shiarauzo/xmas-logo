import assert from "node:assert/strict";
import { test } from "node:test";
import { stageInsets } from "./geometry.ts";

const tall = { naturalWidth: 200, naturalHeight: 800, ink: { box: { minX: 0, minY: 0, maxX: 200, maxY: 800 }, tone: "light" as const } };
const wide = { naturalWidth: 1000, naturalHeight: 200, ink: { box: { minX: 0, minY: 0, maxX: 1000, maxY: 200 }, tone: "light" as const } };

// The stage pads itself with these insets. If they follow the drag, the
// logo moves under the pointer and reflows on release.
for (const [name, l] of [["logo alto 200x800", tall], ["wordmark 1000x200", wide]] as const) {
  for (const id of ["hat", "elf", "cane", "beard"] as const) {
    test(`el margen del escenario no cambia al arrastrar (${id}, ${name})`, () => {
      assert.deepEqual(stageInsets(l, id), stageInsets(l, id));
    });
  }
}

test("con el gorro en su lugar el wordmark deja el mismo espacio arriba que antes", () => {
  const ins = stageInsets(wide, "hat");
  assert.equal(ins.top, 0.24);
  assert.equal(ins.bottom, 0.08);
});

test("la barba reserva espacio abajo, no arriba", () => {
  const ins = stageInsets(wide, "beard");
  assert.equal(ins.top, 0.08);
  assert.ok(ins.bottom > 0.08);
});

test("un logo con margen no pierde tamaño: el gorro descansa dentro del archivo", () => {
  const padded = { naturalWidth: 400, naturalHeight: 400, ink: { box: { minX: 60, minY: 220, maxX: 340, maxY: 300 }, tone: "light" as const } };
  const ins = stageInsets(padded, "hat");
  assert.equal(ins.top, 0.08);
});

// Resizing or rotating the accessory must not shrink the logo: insets only
// cover the rest spot; PreviewStage clamps the gesture to the stage (#60).
for (const [name, l] of [["logo alto 200x800", tall], ["wordmark 1000x200", wide]] as const) {
  for (const id of ["hat", "elf", "cane", "beard"] as const) {
    test(`el margen no cambia al redimensionar o rotar (${id}, ${name})`, () => {
      assert.deepEqual(stageInsets(l, id), stageInsets(l, id));
    });
  }
}
