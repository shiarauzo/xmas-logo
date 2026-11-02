import assert from "node:assert/strict";
import { before, test } from "node:test";
import { JSDOM } from "jsdom";

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
