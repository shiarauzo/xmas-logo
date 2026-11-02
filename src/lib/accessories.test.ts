import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { ACCESSORY_MOTION_CSS, MOTIONS, accessoryMarkup } from "./accessories.ts";

test("no queda el logo de ejemplo", () => {
  assert.equal(
    existsSync(new URL("../../public/sample-logo.svg", import.meta.url)),
    false,
  );
});

test("los adornos son redondeados", () => {
  const hat = accessoryMarkup("hat", "t-");
  const beard = accessoryMarkup("beard", "t-");
  const cane = accessoryMarkup("cane", "t-");
  const elf = accessoryMarkup("elf", "t-");

  assert.match(hat, /rx="17"/);
  assert.match(hat, /<circle /);
  assert.doesNotMatch(hat, /stroke-dasharray/);
  assert.doesNotMatch(hat, /#2f7a3e/);

  assert.match(beard, /<circle /);
  assert.doesNotMatch(beard, /stroke-dasharray/);

  assert.match(cane, /stroke-linecap="round"/);
  assert.match(cane, /rx="8"/);
  assert.doesNotMatch(cane, /#2f7a3e/);

  assert.match(elf, /rx="15"/);
  assert.match(elf, /<circle /);
  assert.doesNotMatch(elf, /stroke-dasharray/);
});

test("motions are jump spin sway bounce", () => {
  assert.deepEqual(
    MOTIONS.map((item) => item.id),
    ["jump", "spin", "sway", "bounce"],
  );
  assert.match(ACCESSORY_MOTION_CSS, /@keyframes xmas-spin/);
  assert.match(ACCESSORY_MOTION_CSS, /@keyframes xmas-sway/);
  assert.doesNotMatch(ACCESSORY_MOTION_CSS, /rotate\(210deg\)/);
});
