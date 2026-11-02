import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { EXAMPLES } from "./examples.ts";

test("the gallery has twenty example logos", () => {
  assert.equal(EXAMPLES.length, 20);
  const names = EXAMPLES.map((item) => item.name);
  for (const need of [
    "Cloudflare",
    "Vercel",
    "Apple",
    "Nintendo",
    "Logitech",
    "Amazon",
  ]) {
    assert.ok(names.includes(need), need);
  }
  for (const item of EXAMPLES) {
    assert.equal(
      existsSync(new URL(`../../public${item.src}`, import.meta.url)),
      true,
      item.src,
    );
  }
});
