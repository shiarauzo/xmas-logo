import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ACCESSORY_VIEWBOX } from "./constants.ts";
import { accessorySize } from "./geometry.ts";
import { motionOffset } from "./motion.ts";
import { OG_LOGO, OG_VIEW, ogHatTransform, ogLogoSvg } from "./og-scene.ts";

const koraSvg = readFileSync(new URL("../../public/examples/kora.svg", import.meta.url), "utf8");

test("la A de Kora está donde dice OG_LOGO", () => {
  const { left, right, top } = OG_LOGO.letter;
  assert.match(koraSvg, new RegExp(`M${left} 86\\.0 [\\d.]+ ${top}H[\\d.]+L${right} 86\\.0`));
});

test("el gorro del OG se sienta sobre la A, no encima del logo", () => {
  const t = ogHatTransform();
  const { letter, width, height } = OG_LOGO;
  const { height: hatH } = accessorySize("hat", t.scale, width);
  const cx = (t.x / 100) * width;
  const cy = (t.y / 100) * height;
  assert.ok(Math.abs(cx - letter.centerX) < 0.5);
  // Fur brim: y 102 to 136 of the 150-unit art.
  const [, vbH] = ACCESSORY_VIEWBOX.hat;
  const brimTop = cy - hatH / 2 + (102 / vbH) * hatH;
  const brimBottom = cy - hatH / 2 + (136 / vbH) * hatH;
  assert.ok(brimTop < letter.top, "brim starts above the letter");
  assert.ok(brimBottom > letter.top, "brim overlaps the top of the letter");
  assert.ok(t.rotation < 0);
});

test("ogLogoSvg dibuja el logo solo o con el gorro", () => {
  const plain = ogLogoSvg(koraSvg, { hat: false });
  const hat = ogLogoSvg(koraSvg, { hat: true });
  assert.ok(!plain.includes("og-body"));
  assert.ok(hat.includes("og-body"));
  assert.ok(!hat.includes("<title>"));
  assert.ok(hat.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${OG_VIEW.x} ${OG_VIEW.y}`));
  const hop = ogLogoSvg(koraSvg, { hat: true, frame: motionOffset("jump", 0.4) });
  assert.match(hop, /rotate\(-18\) translate\(/);
});

test("el gorro en lo alto del salto sigue dentro del cuadro", () => {
  const t = ogHatTransform();
  const { width: w, height: h } = accessorySize("hat", t.scale, OG_LOGO.width);
  const cy = (t.y / 100) * OG_LOGO.height;
  // Worst case: the whole art turned around its origin at the top of the hop.
  const reach = Math.hypot(w / 2, 0.86 * h) + 0.22 * h;
  const originY = cy + 0.36 * h;
  assert.ok(originY - reach > OG_VIEW.y, `${originY - reach} > ${OG_VIEW.y}`);
});
