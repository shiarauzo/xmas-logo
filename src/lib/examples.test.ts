import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { EXAMPLES, exampleTransform, placementOnLogo } from "./examples.ts";

test("the gallery has twenty official logos on disk", () => {
  assert.equal(EXAMPLES.length, 20);
  for (const item of EXAMPLES) {
    assert.ok(item.src.startsWith("/examples/"), item.id);
    assert.ok(
      existsSync(new URL(`../../public${item.src}`, import.meta.url)),
      item.src,
    );
  }
});

test("the hat sits on the logo, not above the card", () => {
  const vercel = EXAMPLES.find((item) => item.id === "vercel");
  assert.ok(vercel);
  const hat = exampleTransform(vercel);
  assert.ok(hat.x < 20);
  assert.ok(hat.y < 40);
  const apple = placementOnLogo("hat", 256, 315);
  assert.ok(Math.abs(apple.x - 50) < 1);
});

test("the cane hooks the last letter of a wide wordmark", () => {
  const netflix = EXAMPLES.find((item) => item.id === "netflix");
  assert.ok(netflix);
  const cane = exampleTransform(netflix);
  assert.ok(cane.x > 80);
});
