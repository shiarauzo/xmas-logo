// SVG helpers that do not need DOMPurify, so export code can use them
// without pulling the sanitizer into the first page load.

export function parseSvg(xml: string): Document {
  if (typeof DOMParser === "undefined") {
    throw new Error("Your browser can't read SVGs here. Try a PNG or another browser.");
  }
  return new DOMParser().parseFromString(xml, "image/svg+xml");
}

export function serializeSvg(doc: Document): string {
  if (typeof XMLSerializer === "undefined") {
    throw new Error("Your browser can't read SVGs here. Try a PNG or another browser.");
  }
  return new XMLSerializer().serializeToString(doc);
}

export function prefixSvgIds(svg: string, prefix: string): string {
  const doc = parseSvg(svg);
  const root = doc.documentElement;
  if (!root) return svg;

  const ids = new Map<string, string>();
  for (const el of Array.from(root.querySelectorAll("[id]"))) {
    const current = el.getAttribute("id");
    if (!current) continue;
    const next = `${prefix}${current}`;
    ids.set(current, next);
    el.setAttribute("id", next);
  }

  const rewrite = (value: string) =>
    value
      .replace(
        /url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g,
        (match, quote: string, id: string) =>
          ids.has(id) ? `url(${quote}#${ids.get(id)}${quote})` : match,
      )
      .replace(/^#(.+)$/, (_, id: string) =>
        ids.has(id) ? `#${ids.get(id)}` : `#${id}`,
      );

  for (const el of Array.from(root.querySelectorAll("*"))) {
    for (const name of ["href", "xlink:href"]) {
      const value = el.getAttribute(name);
      if (value?.startsWith("#")) el.setAttribute(name, rewrite(value));
    }
    const nsHref = el.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    if (nsHref?.startsWith("#")) {
      el.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        rewrite(nsHref),
      );
    }
    // fill, stroke, clip-path, mask, filter, marker-*, and style all point
    // at gradients and friends with url(#id).
    for (const attr of Array.from(el.attributes)) {
      if (attr.name === "id" || !/url\(/.test(attr.value)) continue;
      const next = rewrite(attr.value);
      if (next !== attr.value) el.setAttribute(attr.name, next);
    }
  }

  return serializeSvg(doc);
}
