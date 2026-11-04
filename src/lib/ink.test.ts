import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeInk, inkSampleSize, stageTone } from "./ink.ts";

type Px = [number, number, number, number];

function image(w: number, h: number, pixel: (x: number, y: number) => Px) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      data.set(pixel(x, y), (y * w + x) * 4);
    }
  }
  return data;
}

const clear: Px = [0, 0, 0, 0];
const black: Px = [0, 0, 0, 255];
const white: Px = [255, 255, 255, 255];
const inside = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) =>
  x >= x0 && x < x1 && y >= y0 && y < y1;

test("la tinta de un PNG transparente es solo lo opaco", () => {
  const data = image(40, 40, (x, y) => (inside(x, y, 10, 20, 30, 30) ? black : clear));
  const ink = analyzeInk(data, 40, 40);
  assert.deepEqual(ink.box, { minX: 10, minY: 20, maxX: 30, maxY: 30 });
});

test("en un PNG con fondo blanco el fondo no cuenta como tinta", () => {
  const data = image(40, 40, (x, y) => (inside(x, y, 5, 12, 25, 18) ? black : white));
  const ink = analyzeInk(data, 40, 40);
  assert.deepEqual(ink.box, { minX: 5, minY: 12, maxX: 25, maxY: 18 });
});

test("un logo sin fondo que llena el cuadro es todo tinta", () => {
  const data = image(16, 16, () => [31, 58, 95, 255]);
  const ink = analyzeInk(data, 16, 16);
  assert.deepEqual(ink.box, { minX: 0, minY: 0, maxX: 16, maxY: 16 });
});

test("un logo vacío no tiene caja", () => {
  const data = image(8, 8, () => clear);
  assert.equal(analyzeInk(data, 8, 8).box, null);
});

test("un logo negro pide escenario claro y uno blanco escenario oscuro", () => {
  const dark = analyzeInk(image(10, 10, (x) => (x < 5 ? black : clear)), 10, 10);
  const light = analyzeInk(image(10, 10, (x) => (x < 5 ? white : clear)), 10, 10);
  assert.equal(stageTone(dark.luminance), "light");
  assert.equal(stageTone(light.luminance), "dark");
});

test("un logo amarillo claro pide escenario oscuro", () => {
  const ink = analyzeInk(image(10, 10, () => [255, 230, 80, 255]), 10, 10);
  assert.equal(stageTone(ink.luminance), "dark");
});

test("un logo rojo o azul marino se ve en escenario claro", () => {
  const red = analyzeInk(image(10, 10, () => [244, 59, 74, 255]), 10, 10);
  const navy = analyzeInk(image(10, 10, () => [31, 58, 95, 255]), 10, 10);
  assert.equal(stageTone(red.luminance), "light");
  assert.equal(stageTone(navy.luminance), "light");
});

test("la muestra no pasa de 512 px y no agranda logos chicos", () => {
  assert.deepEqual(inkSampleSize(4000, 2000), { width: 512, height: 256 });
  assert.deepEqual(inkSampleSize(1_000_000, 250_000), { width: 512, height: 128 });
  assert.deepEqual(inkSampleSize(16, 16), { width: 16, height: 16 });
});
