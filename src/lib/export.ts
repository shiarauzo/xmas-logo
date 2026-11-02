import {
  ACCESSORY_BY_ID,
  ACCESSORY_MOTION_CSS,
  accessoryMarkup,
} from "./accessories";
import { accessorySize, exportRasterScale, exportViewBox } from "./geometry";
import { prefixSvgIds } from "./sanitize-svg";
import type { AccessoryId, AccessoryTransform, LogoAsset } from "./types";

export { exportRasterScale, exportViewBox } from "./geometry";

export function buildExportSvg(
  logo: LogoAsset,
  accessoryId: AccessoryId,
  transform: AccessoryTransform,
  animated: boolean,
): string {
  const width = logo.naturalWidth || 800;
  const height = logo.naturalHeight || 800;
  const accessory = ACCESSORY_BY_ID[accessoryId];
  const [vbW, vbH] = accessory.viewBox;
  const { width: accW, height: accH } = accessorySize(
    accessoryId,
    transform.scale,
    width,
  );
  const tx = (transform.x / 100) * width;
  const ty = (transform.y / 100) * height;
  const view = exportViewBox(width, height, accessoryId, transform);

  let logoLayer: string;
  if (logo.kind === "svg" && logo.sanitizedSvg) {
    const nested = prefixSvgIds(
      logo.sanitizedSvg.replace(/<\?xml[^>]*>/i, "").trim(),
      "logo-",
    );
    logoLayer = `<g id="logo">${nested}</g>`;
  } else {
    const href = logo.dataUrl ?? logo.objectUrl;
    logoLayer = `<image id="logo" href="${href}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  const art = accessoryMarkup(accessoryId, "acc-");
  const motionClass = animated
    ? ` class="xmas-motion xmas-${accessoryId}"`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.x} ${view.y} ${view.width} ${view.height}" width="${view.width}" height="${view.height}">
  <title>Logo con adorno navideño</title>
  <style>${ACCESSORY_MOTION_CSS}</style>
  ${logoLayer}
  <g id="adorno" transform="translate(${tx} ${ty}) rotate(${transform.rotation})">
    <g${motionClass}>
      <svg x="${-accW / 2}" y="${-accH / 2}" width="${accW}" height="${accH}" viewBox="0 0 ${vbW} ${vbH}" overflow="visible">
        ${art}
      </svg>
    </g>
  </g>
</svg>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadAnimatedSvg(
  logo: LogoAsset,
  accessoryId: AccessoryId,
  transform: AccessoryTransform,
) {
  const svg = buildExportSvg(logo, accessoryId, transform, true);
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "logo-navidad.svg");
}

export async function downloadPng(
  logo: LogoAsset,
  accessoryId: AccessoryId,
  transform: AccessoryTransform,
) {
  const svg = buildExportSvg(logo, accessoryId, transform, false);
  const view = exportViewBox(
    logo.naturalWidth || 800,
    logo.naturalHeight || 800,
    accessoryId,
    transform,
  );
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const scale = exportRasterScale(view.width, view.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(view.width * scale));
    canvas.height = Math.max(1, Math.round(view.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear la imagen.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("No se pudo crear la imagen."))),
        "image/png",
      );
    });
    downloadBlob(png, "logo-navidad.png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo crear la imagen."));
    image.src = src;
  });
}
