import assert from "node:assert/strict";
import { test } from "node:test";
import { EXAMPLES, accessoryFrame, wordmarkLayout } from "./examples.ts";

test("the gallery has twenty wordmarks", () => {
  assert.equal(EXAMPLES.length, 20);
  const names = EXAMPLES.map((item) => item.name);
  for (const need of [
    "Cloudflare",
    "Vercel",
    "Apple",
    "Nintendo",
    "Logitech",
    "amazon",
  ]) {
    assert.ok(names.includes(need), need);
  }
});

test("the hat sits on the first letter, not above the card", () => {
  const layout = wordmarkLayout("Vercel");
  const hat = accessoryFrame("hat", layout);
  const brim = hat.y + hat.height * hat.originY;
  assert.ok(Math.abs(brim - layout.first.y) < layout.first.height * 0.2);
  assert.ok(hat.x + hat.width / 2 < layout.first.x + layout.first.width);
  assert.ok(hat.y > 0);
});

test("the beard hangs from the first letter", () => {
  const layout = wordmarkLayout("Slack");
  const beard = accessoryFrame("beard", layout);
  const top = beard.y + beard.height * beard.originY;
  assert.ok(top > layout.first.y + layout.first.height * 0.35);
  assert.ok(top < layout.first.y + layout.first.height * 0.85);
  assert.ok(beard.x + beard.width / 2 > layout.first.x);
});

test("the cane hooks the last letter", () => {
  const layout = wordmarkLayout("NETFLIX");
  const cane = accessoryFrame("cane", layout);
  const hookX = cane.x + cane.width * 0.2;
  assert.ok(Math.abs(hookX - (layout.last.x + layout.last.width / 2)) < layout.last.width);
  assert.ok(cane.flip);
  assert.ok(cane.y + cane.height * cane.originY < layout.last.y + layout.last.height);
});
