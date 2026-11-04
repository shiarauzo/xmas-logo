import assert from "node:assert/strict";
import { test } from "node:test";
import { ACCESSORIES, ACCESSORY_MOTION_CSS, MOTIONS } from "./accessories.ts";
import { ACCESSORY_ORIGIN } from "./constants.ts";
import { accessoryBox, accessorySize, motionExportViewBox } from "./geometry.ts";
import { MOTION_TIMING, gifFrames, motionOffset, motionTransform } from "./motion.ts";

function cssBlock(name: string) {
  const start = ACCESSORY_MOTION_CSS.indexOf(`@keyframes ${name} {`);
  assert.ok(start >= 0, name);
  let depth = 0;
  for (let i = ACCESSORY_MOTION_CSS.indexOf("{", start); i < ACCESSORY_MOTION_CSS.length; i += 1) {
    if (ACCESSORY_MOTION_CSS[i] === "{") depth += 1;
    if (ACCESSORY_MOTION_CSS[i] === "}") depth -= 1;
    if (depth === 0) return ACCESSORY_MOTION_CSS.slice(start, i + 1);
  }
  throw new Error(name);
}

for (const { id } of MOTIONS) {
  test(`el GIF usa la duración y la curva del CSS (${id})`, () => {
    const rule = ACCESSORY_MOTION_CSS.slice(ACCESSORY_MOTION_CSS.indexOf(`.xmas-${id} {`));
    const duration = Number(/animation-duration:\s*([\d.]+)s/.exec(rule)?.[1]) * 1000;
    const easing = /animation-timing-function:\s*([^;]+);/.exec(rule)?.[1].trim();
    assert.equal(MOTION_TIMING[id].durationMs, duration);
    const expected = MOTION_TIMING[id].easing
      ? `cubic-bezier(${MOTION_TIMING[id].easing!.map((n) => String(n).replace(/^0\./, ".")).join(", ")})`
      : "linear";
    assert.equal(easing, expected);
  });

  test(`los cuadros clave del GIF son los del CSS (${id})`, () => {
    const css = cssBlock(`xmas-${id}`);
    for (const [at, ...values] of MOTION_TIMING[id].keys) {
      const pct = `${Math.round(at * 100)}%`;
      assert.ok(css.includes(pct), `${id} ${pct}`);
      const m = motionOffset(id, at === 1 ? 0.999999 : at);
      if (id === "jump" || id === "bounce") assert.ok(Math.abs(m.dy - values[0]) < 0.05, `${id} dy ${pct}`);
      if (id === "jump") assert.ok(Math.abs(m.rot - values[1]) < 0.05, `${id} rot ${pct}`);
      if (id === "sway") assert.ok(Math.abs(m.rot - values[0]) < 0.05, `${id} rot ${pct}`);
    }
  });

  test(`los cuadros del GIF suman la duración del CSS (${id})`, () => {
    const frames = gifFrames(id);
    const total = frames.reduce((sum, f) => sum + f.delay, 0);
    assert.ok(Math.abs(total - MOTION_TIMING[id].durationMs) <= 10, `${total}`);
    assert.ok(frames.every((f) => f.delay >= 20 && f.delay % 10 === 0));
    assert.ok(frames.length >= 15, `${frames.length} cuadros`);
    assert.equal(frames[0].t, 0);
  });
}

test("el salto del GIF es 22% del alto del adorno, como el CSS", () => {
  const size = accessorySize("hat", 0.5, 1000);
  const m = motionOffset("jump", 0.4);
  const tf = motionTransform("hat", m, size.width, size.height);
  assert.match(tf, new RegExp(`translate\\(0 ${(-0.22 * size.height).toFixed(3)}\\)`));
});

test("el giro del GIF usa el mismo transform-origin que el CSS", () => {
  for (const meta of ACCESSORIES) {
    const [ox, oy] = ACCESSORY_ORIGIN[meta.id];
    assert.equal(meta.origin, `${ox * 100}% ${oy * 100}%`);
    assert.ok(ACCESSORY_MOTION_CSS.includes(`.xmas-${meta.id} { transform-origin: ${meta.origin}; }`));
  }
  const size = accessorySize("hat", 0.5, 1000);
  const tf = motionTransform("hat", motionOffset("spin", 0.25), size.width, size.height);
  const oy = (0.86 - 0.5) * size.height;
  assert.ok(tf.startsWith(`translate(0.000 ${oy.toFixed(3)})`), tf);
  assert.ok(tf.endsWith(`translate(0.000 ${(-oy).toFixed(3)})`), tf);
  assert.match(tf, /rotate\(90\.000\)/);
});

test("el viewBox animado incluye el salto y el giro completos", () => {
  const transform = { x: 50, y: -10, scale: 0.48, rotation: -8 };
  const still = accessoryBox(400, 80, "hat", transform);
  const jump = motionExportViewBox(400, 80, "hat", transform, "jump");
  const spin = motionExportViewBox(400, 80, "hat", transform, "spin");
  assert.ok(jump.y < still.minY - 1, "el salto entra arriba");
  assert.ok(spin.y + spin.height > still.maxY + 1, "el giro entra entero, también la vuelta por abajo");
  assert.ok(spin.y <= still.minY + 0.01);
  assert.ok(jump.x <= 0 && jump.x + jump.width >= 400, "el logo entra entero");
});
