import assert from "node:assert/strict";
import test from "node:test";
import { menuIndexForKey } from "./menu-nav.ts";

test("arrows wrap around the menu", () => {
  assert.equal(menuIndexForKey("ArrowDown", 2, 3), 0);
  assert.equal(menuIndexForKey("ArrowUp", 0, 3), 2);
  assert.equal(menuIndexForKey("ArrowDown", 0, 3), 1);
});

test("Home and End jump to the ends", () => {
  assert.equal(menuIndexForKey("Home", 2, 3), 0);
  assert.equal(menuIndexForKey("End", 0, 3), 2);
});

test("other keys are not handled", () => {
  assert.equal(menuIndexForKey("a", 0, 3), null);
  assert.equal(menuIndexForKey("ArrowDown", 0, 0), null);
});
