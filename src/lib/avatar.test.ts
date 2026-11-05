import assert from "node:assert/strict";
import test from "node:test";
import { AVATAR_MARGIN, AVATAR_SIZE, avatarRect } from "./avatar.ts";

test("avatar is 400 px with a margin on the long side", () => {
  const r = avatarRect(1000, 500);
  assert.equal(AVATAR_SIZE, 400);
  assert.equal(r.x, 400 * AVATAR_MARGIN);
  assert.equal(r.width, 400 * (1 - 2 * AVATAR_MARGIN));
  assert.equal(r.height, r.width / 2);
});

test("avatar art is centered", () => {
  const r = avatarRect(300, 900);
  assert.ok(Math.abs(r.x + r.width / 2 - 200) < 1e-9);
  assert.ok(Math.abs(r.y + r.height / 2 - 200) < 1e-9);
  assert.equal(r.y, 400 * AVATAR_MARGIN);
});

test("tiny logos scale up to fill the avatar box", () => {
  const r = avatarRect(16, 16);
  assert.equal(r.width, 400 * (1 - 2 * AVATAR_MARGIN));
});
