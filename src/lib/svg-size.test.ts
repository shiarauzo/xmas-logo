import assert from "node:assert/strict";
import { before, test } from "node:test";
import { JSDOM } from "jsdom";

before(() => {
  const { window } = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://xmas-logo.test/",
  });
  globalThis.window = window as unknown as typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.XMLSerializer = window.XMLSerializer;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.Document = window.Document;
});

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const cases = [
  `<svg ${NS} viewBox="0 0 320 120"><rect width="10" height="10"/></svg>`,
  `<svg ${NS} width="300" height="100"><rect width="10" height="10"/></svg>`,
  `<svg ${NS} width="1000" height="600" viewBox="-500 -300 1000 600"><rect x="-200" y="-50" width="400" height="100"/></svg>`,
  `<svg ${NS} viewBox="0 0 1000000 250000"><script>alert(1)</script><rect width="10" height="10" onclick="x()"/></svg>`,
];

test("sanitizeSvgSized da lo mismo que sanitizeSvg y después ensureSvgSize, con un solo parseo de salida", async () => {
  const { ensureSvgSize, sanitizeSvg, sanitizeSvgSized } = await import("./sanitize-svg.ts");
  for (const raw of cases) {
    assert.deepEqual(sanitizeSvgSized(raw), ensureSvgSize(sanitizeSvg(raw)), raw);
  }
});

test("sanitizeSvgSized sigue limpiando scripts y eventos", async () => {
  const { sanitizeSvgSized } = await import("./sanitize-svg.ts");
  const { svg } = sanitizeSvgSized(cases[3]);
  assert.doesNotMatch(svg, /script|onclick/);
});

test("un SVG con solo width y viewBox mantiene la proporción del viewBox", async () => {
  const { sanitizeSvgSized } = await import("./sanitize-svg.ts");
  const sized = sanitizeSvgSized(`<svg ${NS} width="200" viewBox="0 0 400 100"><rect width="400" height="100"/></svg>`);
  assert.equal(sized.width, 200);
  assert.equal(sized.height, 50);
  const tall = sanitizeSvgSized(`<svg ${NS} height="300" viewBox="0 0 100 600"><rect width="100" height="600"/></svg>`);
  assert.equal(tall.width, 50);
  assert.equal(tall.height, 300);
});
