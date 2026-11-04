import {
  ACCESSORY_BY_ID,
  ACCESSORY_MOTION_CSS,
  accessoryMarkup,
} from "./accessories";
import { shareOrDownload, type DeliveryMethod } from "./share";
import {
  accessorySize,
  exportRasterScale,
  exportViewBox,
  gifRasterScale,
  motionExportViewBox,
} from "./geometry";
import { gifFrames, motionOffset, motionTransform, type MotionFrame } from "./motion";
import { prefixSvgIds } from "./sanitize-svg";
import type {
  AccessoryId,
  AccessoryTransform,
  LogoAsset,
  MotionId,
} from "./types";

export { exportRasterScale, exportViewBox } from "./geometry";

export function buildExportSvg(
  logo: LogoAsset,
  accessoryId: AccessoryId,
  transform: AccessoryTransform,
  motionId: MotionId,
  animated: boolean,
  layers: "all" | "logo" | "accessory" = "all",
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
  // Animated output and GIF layers make room for the whole motion.
  const view =
    animated || layers !== "all"
      ? motionExportViewBox(width, height, accessoryId, transform, motionId)
      : exportViewBox(width, height, accessoryId, transform);

  let logoLayer = "";
  if (layers === "accessory") {
    // Drawn on its own over a logo that was rasterized once.
  } else if (logo.kind === "svg" && logo.sanitizedSvg) {
    const nested = prefixSvgIds(
      logo.sanitizedSvg.replace(/<\?xml[^>]*>/i, "").trim(),
      "logo-",
    );
    logoLayer = `<g id="logo">${nested}</g>`;
  } else {
    const href = logo.dataUrl ?? logo.objectUrl;
    logoLayer = `<image id="logo" href="${href}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  const art = layers === "logo" ? "" : accessoryMarkup(accessoryId, "acc-");
  const motionClass = animated
    ? ` class="xmas-motion xmas-${motionId} xmas-${accessoryId}"`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.x} ${view.y} ${view.width} ${view.height}" width="${view.width}" height="${view.height}">
  <title>Xmastized logo</title>
  <style>${ACCESSORY_MOTION_CSS}</style>
  ${logoLayer}
  <g id="accessory" transform="translate(${tx} ${ty}) rotate(${transform.rotation})">
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
  motionId: MotionId,
) {
  const svg = buildExportSvg(logo, accessoryId, transform, motionId, true);
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "xmastize-logo.svg");
}

export async function downloadPng(
  logo: LogoAsset,
  accessoryId: AccessoryId,
  transform: AccessoryTransform,
): Promise<DeliveryMethod> {
  const svg = buildExportSvg(logo, accessoryId, transform, "jump", false);
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
    if (!ctx) throw new Error("Couldn’t create the image. Try again.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("Couldn’t create the image. Try again."))),
        "image/png",
      );
    });
    const file = new File([png], "xmastize-logo.png", { type: "image/png" });
    return await shareOrDownload(file, () => downloadBlob(png, file.name));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadGif(
  logo: LogoAsset,
  accessoryId: AccessoryId,
  transform: AccessoryTransform,
  motionId: MotionId,
) {
  const { GIFEncoder, applyPalette, quantize } = await import("gifenc");
  const view = motionExportViewBox(
    logo.naturalWidth || 800,
    logo.naturalHeight || 800,
    accessoryId,
    transform,
    motionId,
  );
  const scale = gifRasterScale(view.width, view.height);
  const width = Math.max(1, Math.round(view.width * scale));
  const height = Math.max(1, Math.round(view.height * scale));
  const gif = GIFEncoder();
  let palette: number[][] | undefined;
  let transparentIndex = -1;

  // The logo is the heavy part (big SVGs, 4000 px PNGs). Draw it once and
  // only redraw the accessory on each frame. No fill: the GIF keeps the
  // transparent background, like the PNG and the preview.
  const base = document.createElement("canvas");
  base.width = width;
  base.height = height;
  const baseCtx = base.getContext("2d");
  if (!baseCtx) throw new Error("Couldn’t create the image. Try again.");
  await drawSvg(
    baseCtx,
    buildExportSvg(logo, accessoryId, transform, motionId, false, "logo"),
    width,
    height,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Couldn’t create the image. Try again.");

  for (const { t, delay } of gifFrames(motionId)) {
    const framed = buildFrameSvg(
      logo,
      accessoryId,
      transform,
      motionId,
      motionOffset(motionId, t),
    );
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(base, 0, 0);
    await drawSvg(ctx, framed, width, height);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    if (!palette) {
      palette = quantize(pixels, 256, { format: "rgba4444", oneBitAlpha: true });
      transparentIndex = palette.findIndex((color) => color[3] === 0);
    }
    const index = applyPalette(pixels, palette, "rgba4444");
    gif.writeFrame(index, width, height, {
      palette,
      delay,
      repeat: 0,
      transparent: transparentIndex >= 0,
      transparentIndex: Math.max(0, transparentIndex),
      // Clear each frame so the moving accessory leaves no trail.
      dispose: 2,
    });
  }

  gif.finish();
  downloadBlob(
    new Blob([Uint8Array.from(gif.bytes())], { type: "image/gif" }),
    "xmastize-logo.gif",
  );
}

function buildFrameSvg(
  logo: LogoAsset,
  accessoryId: AccessoryId,
  transform: AccessoryTransform,
  motionId: MotionId,
  frame: MotionFrame,
) {
  const raw = buildExportSvg(
    logo,
    accessoryId,
    transform,
    motionId,
    false,
    "accessory",
  );
  const { width, height } = accessorySize(
    accessoryId,
    transform.scale,
    logo.naturalWidth || 800,
  );
  const motion = motionTransform(accessoryId, frame, width, height);
  return raw.replace(
    /<g id="accessory" transform="([^"]+)">/,
    `<g id="accessory" transform="$1 ${motion}">`,
  );
}

async function drawSvg(
  ctx: CanvasRenderingContext2D,
  svg: string,
  width: number,
  height: number,
) {
  const url = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    ctx.drawImage(await loadImage(url), 0, 0, width, height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Couldn’t create the image. Try again."));
    image.src = src;
  });
}
