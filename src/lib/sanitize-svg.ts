import DOMPurify from "isomorphic-dompurify";
import { parseSvg, serializeSvg } from "./svg-ids.ts";

export { prefixSvgIds } from "./svg-ids.ts";

const FRAGMENT_HREF = /^#/;
const DATA_HREF = /^data:/i;
const EXTERNAL_URL = /url\s*\(\s*(['"]?)\s*(https?:|\/\/|\/(?!\/)|[a-z]+:)/i;
export const BROKEN_SVG_MESSAGE =
  "That SVG is damaged. Try another or export your logo as PNG.";

function isSafeLocalRef(value: string): boolean {
  const trimmed = value.trim();
  return FRAGMENT_HREF.test(trimmed) || DATA_HREF.test(trimmed);
}

function isExternalRef(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || isSafeLocalRef(trimmed)) return false;
  return true;
}

export function assertSvgDrawable(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error(BROKEN_SVG_MESSAGE);
  const doc = parseSvg(trimmed);
  if (doc.querySelector("parsererror")) {
    throw new Error(BROKEN_SVG_MESSAGE);
  }
  const root = doc.documentElement;
  if (!root || root.localName !== "svg") {
    throw new Error(BROKEN_SVG_MESSAGE);
  }
}

function parseLength(value: string | null): number {
  if (!value) return NaN;
  const trimmed = value.trim();
  if (/^-?[\d.]+(px)?$/i.test(trimmed)) return Number.parseFloat(trimmed);
  return NaN;
}

export function sanitizeSvg(raw: string): string {
  assertSvgDrawable(raw);

  const purified = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["use"],
    ADD_ATTR: ["href", "xlink:href"],
    FORBID_TAGS: ["style"],
  });

  if (!purified.trim()) {
    throw new Error(BROKEN_SVG_MESSAGE);
  }

  const doc = parseSvg(purified);
  const root = doc.documentElement;

  if (!root || root.localName !== "svg" || doc.querySelector("parsererror")) {
    throw new Error(BROKEN_SVG_MESSAGE);
  }

  for (const node of Array.from(
    root.querySelectorAll("foreignObject, script, iframe, object, embed, style"),
  )) {
    node.remove();
  }

  for (const el of Array.from(root.querySelectorAll("*"))) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || name === "srcdoc") {
        el.removeAttribute(attr.name);
      }
    }

    const href =
      el.getAttribute("href") ??
      el.getAttribute("xlink:href") ??
      el.getAttributeNS("http://www.w3.org/1999/xlink", "href");

    if (href && isExternalRef(href)) {
      el.removeAttribute("href");
      el.removeAttribute("xlink:href");
      el.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (el.localName === "use" || el.localName === "image") {
        el.remove();
        continue;
      }
    }

    if (el.localName === "use") {
      const useHref =
        el.getAttribute("href") ??
        el.getAttribute("xlink:href") ??
        el.getAttributeNS("http://www.w3.org/1999/xlink", "href") ??
        "";
      if (!FRAGMENT_HREF.test(useHref)) {
        el.remove();
        continue;
      }
    }

    const src = el.getAttribute("src");
    if (src && isExternalRef(src)) {
      el.removeAttribute("src");
    }

    const style = el.getAttribute("style");
    if (style && EXTERNAL_URL.test(style)) {
      el.removeAttribute("style");
    }

    for (const attr of Array.from(el.attributes)) {
      if (EXTERNAL_URL.test(attr.value) || /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  }

  if (!root.getAttribute("xmlns")) {
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  return serializeSvg(doc);
}

export function ensureSvgSize(svg: string): {
  svg: string;
  width: number;
  height: number;
} {
  const doc = parseSvg(svg);
  const root = doc.documentElement;
  const viewBox = root.getAttribute("viewBox")?.trim().split(/[\s,]+/);
  const vbW = viewBox && viewBox.length === 4 ? Number(viewBox[2]) : NaN;
  const vbH = viewBox && viewBox.length === 4 ? Number(viewBox[3]) : NaN;

  let width = parseLength(root.getAttribute("width"));
  let height = parseLength(root.getAttribute("height"));

  if (!Number.isFinite(width) || width <= 0) width = Number.isFinite(vbW) ? vbW : 800;
  if (!Number.isFinite(height) || height <= 0) height = Number.isFinite(vbH) ? vbH : 800;
  if (!root.getAttribute("viewBox")) {
    root.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));

  return { svg: serializeSvg(doc), width, height };
}
