import DOMPurify from "isomorphic-dompurify";

const FRAGMENT_HREF = /^#/;
const EXTERNAL_URL = /url\s*\(\s*(['"]?)\s*(https?:|\/\/|\/(?!\/)|[a-z]+:)/i;

function isExternalRef(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (FRAGMENT_HREF.test(trimmed)) return false;
  return true;
}

function parseSvg(xml: string): Document {
  if (typeof DOMParser === "undefined") {
    throw new Error("No se pudo leer el SVG.");
  }
  return new DOMParser().parseFromString(xml, "image/svg+xml");
}

function serializeSvg(doc: Document): string {
  if (typeof XMLSerializer === "undefined") {
    throw new Error("No se pudo leer el SVG.");
  }
  return new XMLSerializer().serializeToString(doc);
}

export function sanitizeSvg(raw: string): string {
  const purified = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["use"],
    ADD_ATTR: ["href", "xlink:href"],
  });

  if (!purified.trim()) {
    throw new Error("El SVG quedó vacío después de limpiarlo.");
  }

  const doc = parseSvg(purified);
  const root = doc.documentElement;

  if (!root || root.localName !== "svg") {
    throw new Error("No se pudo leer el SVG.");
  }

  for (const node of Array.from(
    root.querySelectorAll("foreignObject, script, iframe, object, embed"),
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
      if (EXTERNAL_URL.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  }

  if (!root.getAttribute("xmlns")) {
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  return serializeSvg(doc);
}

export function prefixSvgIds(svg: string, prefix: string): string {
  return svg
    .replace(/\bid="([^"]+)"/g, `id="${prefix}$1"`)
    .replace(/\burl\(#([^)]+)\)/g, `url(#${prefix}$1)`)
    .replace(/\bhref="#([^"]+)"/g, `href="#${prefix}$1"`)
    .replace(/\bxlink:href="#([^"]+)"/g, `xlink:href="#${prefix}$1"`);
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

  let width = Number.parseFloat(root.getAttribute("width") ?? "");
  let height = Number.parseFloat(root.getAttribute("height") ?? "");

  if (!Number.isFinite(width) || width <= 0) width = Number.isFinite(vbW) ? vbW : 800;
  if (!Number.isFinite(height) || height <= 0) height = Number.isFinite(vbH) ? vbH : 800;
  if (!root.getAttribute("viewBox")) {
    root.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));

  return { svg: serializeSvg(doc), width, height };
}
