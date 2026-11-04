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
      assert.ok(box.width / inkW > 0.15 && box.width / inkW < 0.4, `ancho ${box.width / inkW}`);
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
