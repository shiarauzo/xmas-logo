import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { EXAMPLES, exampleTransform, placementOnLogo } from "./examples.ts";

test("the gallery has twelve fictional logos on disk", () => {
  assert.equal(EXAMPLES.length, 12);
  for (const item of EXAMPLES) {
    assert.ok(item.src.startsWith("/examples/"), item.id);
    assert.ok(
      existsSync(new URL(`../../public${item.src}`, import.meta.url)),
      item.src,
    );
  }
});

test("the hat sits on the logo, not above the card", () => {
  const nido = EXAMPLES.find((item) => item.id === "nido");
  assert.ok(nido);
  const hat = exampleTransform(nido);
  assert.ok(hat.x < 20);
  assert.ok(hat.y < 40);
  const square = placementOnLogo("hat", 256, 256);
  assert.ok(Math.abs(square.x - 50) < 1);
});

test("the cane hooks the last letter of a wide wordmark", () => {
  const kora = EXAMPLES.find((item) => item.id === "kora");
  assert.ok(kora);
  const cane = exampleTransform(kora);
  assert.ok(cane.x > 80);
});
