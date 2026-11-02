import assert from "node:assert/strict";
import { before, test } from "node:test";
import { JSDOM } from "jsdom";
import { BROKEN_SVG_MESSAGE } from "./sanitize-svg.ts";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://xmas-logo.test/",
});

before(() => {
  const { window } = dom;
  globalThis.window = window as unknown as typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.XMLSerializer = window.XMLSerializer;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.Document = window.Document;
});

async function sanitize(raw: string) {
  const { sanitizeSvg } = await import("./sanitize-svg.ts");
  return sanitizeSvg(raw);
}

test("quita script y onload de un SVG malicioso", async () => {
  const dirty = `<?xml version="1.0"?>
    <svg xmlns="http://www.w3.org/2000/svg" onload="window.__XSS=1" width="80" height="80">
      <script>window.__XSS=1</script>
      <rect width="80" height="80" fill="red"/>
    </svg>`;

  const clean = await sanitize(dirty);
  assert.doesNotMatch(clean, /<script/i);
  assert.doesNotMatch(clean, /onload=/i);
  assert.match(clean, /<rect/i);
});

test("quita foreignObject, href externos y use fuera del documento", async () => {
  const dirty = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <defs><circle id="ok" r="4" fill="green"/></defs>
      <foreignObject width="40" height="40"><div xmlns="http://www.w3.org/1999/xhtml">hola</div></foreignObject>
      <image href="https://evil.example/x.png" width="40" height="40"/>
      <use href="https://evil.example/sprite.svg#hat"/>
      <use href="#ok"/>
      <rect width="10" height="10" fill="navy"/>
    </svg>`;

  const clean = await sanitize(dirty);
  assert.doesNotMatch(clean, /foreignObject/i);
  assert.doesNotMatch(clean, /https:\/\/evil\.example/i);
  assert.match(clean, /href="#ok"|href="#/);
  assert.match(clean, /<rect/i);
});

test("quita javascript: y etiquetas style", async () => {
  const dirty = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <style>@import url("https://evil.example/x.css"); rect { fill: red }</style>
      <a href="javascript:alert(1)"><rect width="20" height="20" fill="navy"/></a>
    </svg>`;
  const clean = await sanitize(dirty);
  assert.doesNotMatch(clean, /<style/i);
  assert.doesNotMatch(clean, /@import/i);
  assert.doesNotMatch(clean, /javascript:/i);
  assert.match(clean, /<rect/i);
});

test("deja imágenes data: dentro del SVG", async () => {
  const pixel =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const dirty = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <image href="${pixel}" width="10" height="10"/>
    </svg>`;
  const clean = await sanitize(dirty);
  assert.match(clean, /data:image\/png/);
});

test("un SVG roto lanza un aviso claro", async () => {
  await assert.rejects(() => sanitize("<svg><<<<"), {
    message: BROKEN_SVG_MESSAGE,
  });
});

test("prefixSvgIds no toca data-id", async () => {
  const { prefixSvgIds } = await import("./sanitize-svg.ts");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><g id="hat" data-id="keep"><use href="#hat"/></g></svg>`;
  const prefixed = prefixSvgIds(svg, "p-");
  assert.match(prefixed, /id="p-hat"/);
  assert.match(prefixed, /data-id="keep"/);
  assert.doesNotMatch(prefixed, /data-id="p-keep"/);
});

test("ensureSvgSize no trata 100% como pixeles", async () => {
  const { ensureSvgSize } = await import("./sanitize-svg.ts");
  const sized = ensureSvgSize(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="2cm" viewBox="0 0 40 20"></svg>`,
  );
  assert.equal(sized.width, 40);
  assert.equal(sized.height, 20);
});
