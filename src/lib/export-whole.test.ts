import assert from "node:assert/strict";
import { test } from "node:test";
import { placementFor } from "./accessories.ts";
import { accessoryBox, exportViewBox, motionExportViewBox } from "./geometry.ts";

const wide = { naturalWidth: 1000, naturalHeight: 200, ink: { box: { minX: 0, minY: 0, maxX: 1000, maxY: 200 }, tone: "light" as const } };

// Stage insets ignore a resize, but PNG/GIF/avatar exports must still hold
// the whole (enlarged, rotated) accessory.
for (const id of ["hat", "elf", "cane", "beard"] as const) {
  test(`la exportación contiene el accesorio agrandado y rotado (${id})`, () => {
    const start = placementFor("onTop", id, wide);
    const t = { ...start, scale: start.scale * 3, rotation: 30 };
    const a = accessoryBox(1000, 200, id, t);
    for (const v of [exportViewBox(1000, 200, id, t), motionExportViewBox(1000, 200, id, t, "spin")]) {
      assert.ok(v.x <= a.minX + 1e-6 && v.y <= a.minY + 1e-6);
      assert.ok(v.x + v.width >= a.maxX - 1e-6 && v.y + v.height >= a.maxY - 1e-6);
    }
  });
}
