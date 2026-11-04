import assert from "node:assert/strict";
import test from "node:test";
import { shareFile } from "./share.ts";

const file = new File(["png"], "xmastize-logo.png", { type: "image/png" });

function env(coarse: boolean, opts: { canShare?: boolean; fail?: Error } = {}) {
  const calls: ShareData[] = [];
  return {
    calls,
    env: {
      matchMedia: (query: string) => ({ matches: query === "(pointer: coarse)" && coarse }),
      canShare: () => opts.canShare ?? true,
      share: async (data: ShareData) => {
        calls.push(data);
        if (opts.fail) throw opts.fail;
      },
    },
  };
}

test("desktop (fine pointer) never opens the share sheet", async () => {
  const d = env(false);
  assert.equal(await shareFile(file, d.env), false);
  assert.equal(d.calls.length, 0);
});

test("touch device that can share files opens the share sheet", async () => {
  const d = env(true);
  assert.equal(await shareFile(file, d.env), true);
  assert.equal(d.calls.length, 1);
  assert.deepEqual(d.calls[0].files, [file]);
});

test("touch device that cannot share files downloads", async () => {
  const d = env(true, { canShare: false });
  assert.equal(await shareFile(file, d.env), false);
  assert.equal(d.calls.length, 0);
});

test("no share API (server or old browser) downloads", async () => {
  assert.equal(await shareFile(file, {}), false);
});

test("cancelling the share sheet (AbortError) falls back to download", async () => {
  const d = env(true, { fail: new DOMException("cancelled", "AbortError") });
  assert.equal(await shareFile(file, d.env), false);
  assert.equal(d.calls.length, 1);
});

test("a failed share falls back to download", async () => {
  const d = env(true, { fail: new DOMException("no activation", "NotAllowedError") });
  assert.equal(await shareFile(file, d.env), false);
});
