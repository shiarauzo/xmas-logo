import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";

const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");
const staticImports = (source: string) =>
  [...source.matchAll(/^import[^;]*?from\s+"([^"]+)"/gms)].map((m) => m[1]);

test("DOMPurify no entra en el JS inicial: export.ts y logo.ts no lo importan de entrada", () => {
  for (const file of ["./export.ts", "./logo.ts", "./svg-ids.ts"]) {
    const imports = staticImports(read(file));
    assert.ok(
      !imports.some((m) => /sanitize-svg|dompurify/i.test(m)),
      `${file} importa ${imports.join(", ")}`,
    );
  }
});

test("prefixSvgIds vive aparte y sigue prefijando ids y referencias", async () => {
  const { window } = new JSDOM("<!doctype html><html><body></body></html>");
  globalThis.DOMParser = window.DOMParser;
  globalThis.XMLSerializer = window.XMLSerializer;
  const { prefixSvgIds } = await import("./svg-ids.ts");
  const out = prefixSvgIds(
    '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"/></defs><use href="#g"/></svg>',
    "logo-",
  );
  assert.match(out, /id="logo-g"/);
  assert.match(out, /href="#logo-g"/);
});
