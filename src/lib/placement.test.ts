import assert from "node:assert/strict";
import { test } from "node:test";
import { placementFor } from "./accessories.ts";
import { accessorySize } from "./geometry.ts";
import type { AccessoryId, AccessoryTransform } from "./types";

type Ink = { minX: number; minY: number; maxX: number; maxY: number };

function logo(w: number, h: number, box: Ink | null) {
  return { naturalWidth: w, naturalHeight: h, ink: { box, tone: "light" as const } };
}

// Accessory box in natural units, rotation ignored (it is a few degrees).
function placed(id: AccessoryId, t: AccessoryTransform, w: number, h: number) {
  const size = accessorySize(id, t.scale, w);
  const cx = (t.x / 100) * w;
  const cy = (t.y / 100) * h;
  return { cx, top: cy - size.height / 2, bottom: cy + size.height / 2, width: size.width };
}

const cases: [string, number, number, Ink][] = [
  ["logo con padding arriba", 400, 400, { minX: 60, minY: 220, maxX: 340, maxY: 300 }],
  ["wordmark corrido a la izquierda", 1000, 200, { minX: 100, minY: 40, maxX: 500, maxY: 160 }],
  ["PNG con fondo blanco", 600, 400, { minX: 150, minY: 120, maxX: 450, maxY: 260 }],
  ["viewBox con origen negativo", 1000, 600, { minX: 300, minY: 250, maxX: 700, maxY: 350 }],
];

for (const [name, w, h, ink] of cases) {
  const inkW = ink.maxX - ink.minX;
  const inkH = ink.maxY - ink.minY;

  for (const id of ["hat", "elf"] as const) {
    test(`Encima: ${id} centrado y apoyado en la tinta (${name})`, () => {
      const t = placementFor("onTop", id, logo(w, h, ink));
      const box = placed(id, t, w, h);
      assert.ok(Math.abs(box.cx - (ink.minX + ink.maxX) / 2) < inkW * 0.02, `cx ${box.cx}`);
      assert.ok(box.bottom > ink.minY, "toca la tinta");
      assert.ok(box.bottom < ink.minY + inkH * 0.35, `bottom ${box.bottom}`);
      // Up to 0.45: a narrow ink in a wide file hits the visible floor.
      assert.ok(box.width / inkW > 0.15 && box.width / inkW < 0.45, `ancho ${box.width / inkW}`);
    });
  }

  test(`Encima: la barba cuelga del borde de abajo de la tinta (${name})`, () => {
    const t = placementFor("onTop", "beard", logo(w, h, ink));
    const box = placed("beard", t, w, h);
    assert.ok(Math.abs(box.cx - (ink.minX + ink.maxX) / 2) < inkW * 0.02);
    assert.ok(box.top < ink.maxY && box.top > ink.maxY - inkH * 0.35, `top ${box.top}`);
  });

  test(`Encima: el bastón se apoya en el lado derecho de la tinta (${name})`, () => {
    const t = placementFor("onTop", "cane", logo(w, h, ink));
    const box = placed("cane", t, w, h);
    assert.ok(box.cx > ink.minX + inkW * 0.8 && box.cx <= ink.maxX, `cx ${box.cx}`);
    assert.ok(box.bottom > ink.minY && box.bottom < ink.minY + inkH * 0.35);
  });
}

test("sin tinta leída se usa la caja del archivo como antes", () => {
  const before = placementFor("onTop", "hat", { naturalWidth: 400, naturalHeight: 80 });
  const empty = placementFor("onTop", "hat", logo(400, 80, null));
  assert.deepEqual(empty, before);
  assert.equal(before.x, 50);
});

test("la escala de Encima nunca queda bajo el mínimo del escenario (si no, el primer arrastre salta)", async () => {
  const { SCALE_MIN, SCALE_MAX } = await import("./geometry.ts");
  const tiny = logo(1000, 1000, { minX: 450, minY: 450, maxX: 550, maxY: 500 });
  for (const id of ["hat", "beard", "cane", "elf"] as const) {
    const t = placementFor("onTop", id, tiny);
    assert.ok(t.scale >= SCALE_MIN, `${id} ${t.scale}`);
    assert.ok(t.scale <= SCALE_MAX);
  }
});

test("con mucho margen el accesorio no queda diminuto: su lado mayor mide al menos 16% del logo", () => {
  const cases = [
    logo(1000, 1000, { minX: 450, minY: 450, maxX: 550, maxY: 500 }),
    logo(1200, 400, { minX: 500, minY: 180, maxX: 700, maxY: 220 }),
    logo(300, 900, { minX: 140, minY: 440, maxX: 160, maxY: 460 }),
  ];
  for (const l of cases) {
    const side = Math.max(l.naturalWidth, l.naturalHeight);
    for (const id of ["hat", "beard", "cane", "elf"] as const) {
      const t = placementFor("onTop", id, l);
      const size = accessorySize(id, t.scale, l.naturalWidth);
      const longest = Math.max(size.width, size.height);
      assert.ok(longest >= 0.16 * side - 1e-6, `${id} ${l.naturalWidth}x${l.naturalHeight}: ${longest.toFixed(1)} < ${(0.16 * side).toFixed(1)}`);
    }
  }
});

test("el mínimo visible no cambia un logo ajustado", () => {
  const tight = logo(400, 80, { minX: 0, minY: 0, maxX: 400, maxY: 80 });
  assert.equal(placementFor("onTop", "hat", tight).scale, 0.48);
  assert.equal(placementFor("onTop", "cane", tight).scale, 0.4);
  assert.equal(placementFor("onTop", "beard", tight).scale, 0.52);
});

test("achicar a mano no baja del mínimo del escenario (0.2)", async () => {
  const { SCALE_MIN } = await import("./geometry.ts");
  assert.ok(SCALE_MIN >= 0.2, String(SCALE_MIN));
});

// Tall or square marks: a share of the ink height sank the hat into the
// logo (12% of a 1000 tall bar is most of the hat).
const deep: [string, number, number, Ink][] = [
  ["barra alta", 200, 1000, { minX: 20, minY: 0, maxX: 180, maxY: 1000 }],
  ["PNG cuadrado 16x16", 16, 16, { minX: 0, minY: 0, maxX: 16, maxY: 16 }],
  ["marca alta con margen", 400, 400, { minX: 170, minY: 40, maxX: 230, maxY: 360 }],
];
for (const [name, w, h, ink] of deep) {
  for (const id of ["hat", "elf", "cane"] as const) {
    test(`Encima: ${id} no se hunde en la tinta (${name})`, () => {
      const t = placementFor("onTop", id, logo(w, h, ink));
      const box = placed(id, t, w, h);
      const hatH = box.bottom - box.top;
      assert.ok(box.bottom > ink.minY, "toca la tinta");
      assert.ok(box.bottom - ink.minY <= 0.25 * hatH + 1e-6, `hundido ${((box.bottom - ink.minY) / hatH).toFixed(2)} de su alto`);
    });
  }
  test(`Encima: la barba no tapa la tinta (${name})`, () => {
    const t = placementFor("onTop", "beard", logo(w, h, ink));
    const box = placed("beard", t, w, h);
    const beardH = box.bottom - box.top;
    assert.ok(box.top < ink.maxY, "toca la tinta");
    assert.ok(ink.maxY - box.top <= 0.15 * beardH + 1e-6, `tapa ${((ink.maxY - box.top) / beardH).toFixed(2)} de su alto`);
  });
}

test("un wordmark ajustado queda igual que antes", () => {
  const l = logo(1000, 200, { minX: 0, minY: 0, maxX: 1000, maxY: 200 });
  assert.deepEqual(placementFor("onTop", "hat", l), { x: 50, y: -39.75, scale: 0.48, rotation: -8 });
  assert.deepEqual(placementFor("onTop", "cane", l), { x: 93, y: -57, scale: 0.4, rotation: 10 });
  assert.ok(Math.abs(placementFor("onTop", "elf", l).y - -50.56) < 1e-6);
  assert.ok(Math.abs(placementFor("onTop", "beard", l).y - 139.5111111) < 1e-6);
});
