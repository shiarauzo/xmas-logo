import assert from "node:assert/strict";
import { test } from "node:test";
import { findLetterBounds, sitOnLetter } from "./letter.ts";
import { placementFor } from "./accessories.ts";

test("findLetterBounds aísla la letra tocada", () => {
  const width = 20;
  const height = 8;
  const ink = new Set(["2,2", "2,3", "3,2", "3,3", "12,1", "12,2", "13,1", "13,2"]);
  const band = findLetterBounds(
    width,
    height,
    (x, y) => ink.has(`${x},${y}`),
    12.4,
  );
  assert.ok(band);
  assert.equal(band?.left, 12);
  assert.equal(band?.right, 13);
  assert.equal(band?.top, 1);
});

test("sitOnLetter pone el gorro sobre la letra tocada", () => {
  const placed = sitOnLetter("hat", { naturalWidth: 400, naturalHeight: 80 }, {
    xPct: 72,
    topPct: 20,
  });
  assert.ok(placed.x > 60);
  assert.ok(placed.y < 40);
});

test("Encima sienta el gorro sobre el borde de arriba", () => {
  const placed = placementFor("onTop", "hat", {
    naturalWidth: 400,
    naturalHeight: 80,
  });
  assert.ok(placed.y < 20);
  assert.equal(placed.x, 50);
});
