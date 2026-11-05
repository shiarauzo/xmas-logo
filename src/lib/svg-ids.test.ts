import assert from "node:assert/strict";
import { before, test } from "node:test";
import { JSDOM } from "jsdom";

before(() => {
  const { window } = new JSDOM("<!doctype html><html><body></body></html>");
  globalThis.DOMParser = window.DOMParser;
  globalThis.XMLSerializer = window.XMLSerializer;
});

const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160">
  <defs>
    <linearGradient id="g"><stop offset="0" stop-color="#1d4ed8"/></linearGradient>
    <clipPath id="c"><rect width="360" height="120"/></clipPath>
    <mask id="m"><rect width="400" height="160" fill="#fff"/></mask>
    <filter id="f"><feGaussianBlur stdDeviation="2"/></filter>
    <marker id="k"><path d="M0 0L4 2L0 4z"/></marker>
  </defs>
  <rect width="400" height="160" fill="url(#g)" stroke="url('#g')" clip-path="url(#c)" mask="url(#m)" filter="url(#f)"/>
  <path d="M0 0L10 10" marker-end="url(#k)"/>
</svg>`;

test("prefixSvgIds reescribe url(#id) en atributos de presentación (degradados, clip, máscara, filtro, marcador)", async () => {
  const { prefixSvgIds } = await import("./svg-ids.ts");
  const out = prefixSvgIds(logo, "logo-");
  for (const ref of ["g", "c", "m", "f", "k"]) {
    assert.match(out, new RegExp(`id="logo-${ref}"`));
  }
  assert.match(out, /fill="url\(#logo-g\)"/);
  assert.match(out, /stroke="url\('#logo-g'\)"/);
  assert.match(out, /clip-path="url\(#logo-c\)"/);
  assert.match(out, /mask="url\(#logo-m\)"/);
  assert.match(out, /filter="url\(#logo-f\)"/);
  assert.match(out, /marker-end="url\(#logo-k\)"/);
  assert.doesNotMatch(out, /url\(['"]?#[gcmfk]['"]?\)/);
});

test("prefixSvgIds no toca url() a ids que no existen", async () => {
  const { prefixSvgIds } = await import("./svg-ids.ts");
  const out = prefixSvgIds(
    '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(#nope)"/></svg>',
    "logo-",
  );
  assert.match(out, /fill="url\(#nope\)"/);
});
