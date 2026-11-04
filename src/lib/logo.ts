import { analyzeInk, inkSampleSize, stageTone } from "./ink";
import { ensureSvgSize, sanitizeSvg } from "./sanitize-svg";
import type { LogoAsset, LogoInk } from "./types";

const RASTER_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function isAllowedLogo(file: File): boolean {
  if (RASTER_TYPES.has(file.type) || file.type === "image/svg+xml") return true;
  return /\.(svg|png|jpe?g|webp)$/i.test(file.name);
}

function revokeIfNeeded(url?: string) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function releaseLogo(logo?: LogoAsset | null) {
  if (!logo) return;
  revokeIfNeeded(logo.objectUrl);
}

async function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn’t read the file. Try again."));
    reader.readAsDataURL(file);
  });
}

type Measured = { width: number; height: number; image: HTMLImageElement };

function measureImage(src: string): Promise<Measured> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({
        width: image.naturalWidth || 800,
        height: image.naturalHeight || 800,
        image,
      });
    image.onerror = () => reject(new Error("Couldn’t open the logo. Try another file."));
    image.src = src;
  });
}

function sampleContext(width: number, height: number) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height).getContext("2d", {
      willReadFrequently: true,
    });
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext("2d", { willReadFrequently: true });
}

/** Reads the visible pixels from a small copy of the logo. */
/** A small copy of a raster file, decoded off the main thread when possible. */
async function rasterSample(file: Blob, width: number, height: number) {
  if (typeof createImageBitmap !== "function") return undefined;
  try {
    return await createImageBitmap(file, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: "medium",
    });
  } catch {
    return undefined;
  }
}

export async function readInk(
  measured: Measured,
  file?: Blob,
): Promise<LogoInk | undefined> {
  try {
    const sample = inkSampleSize(measured.width, measured.height);
    const ctx = sampleContext(sample.width, sample.height);
    if (!ctx) return undefined;
    const bitmap = file && (await rasterSample(file, sample.width, sample.height));
    ctx.drawImage(bitmap ?? measured.image, 0, 0, sample.width, sample.height);
    bitmap?.close();
    const pixels = ctx.getImageData(0, 0, sample.width, sample.height).data;
    const ink = analyzeInk(pixels, sample.width, sample.height);
    const sx = measured.width / sample.width;
    const sy = measured.height / sample.height;
    return {
      box: ink.box && {
        minX: ink.box.minX * sx,
        minY: ink.box.minY * sy,
        maxX: ink.box.maxX * sx,
        maxY: ink.box.maxY * sy,
      },
      tone: stageTone(ink.luminance),
    };
  } catch {
    return undefined;
  }
}

export async function logoFromSvgText(
  raw: string,
  name: string,
): Promise<LogoAsset> {
  const sanitized = sanitizeSvg(raw);
  const sized = ensureSvgSize(sanitized);
  const blob = new Blob([sized.svg], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const measured = await measureImage(objectUrl);
    return {
      kind: "svg",
      name,
      objectUrl,
      sanitizedSvg: sized.svg,
      naturalWidth: measured.width || sized.width,
      naturalHeight: measured.height || sized.height,
      ink: await readInk(measured),
    };
  } catch (error) {
    revokeIfNeeded(objectUrl);
    throw error;
  }
}

export async function logoFromFile(file: File): Promise<LogoAsset> {
  if (!isAllowedLogo(file)) {
    throw new Error("Unsupported format. Upload an SVG, PNG, JPG or WebP.");
  }

  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
  if (isSvg) {
    return logoFromSvgText(await file.text(), file.name);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const measured = await measureImage(objectUrl);
    const dataUrl = await readAsDataUrl(file);
    return {
      kind: "raster",
      name: file.name,
      objectUrl,
      dataUrl,
      naturalWidth: measured.width,
      naturalHeight: measured.height,
      ink: await readInk(measured, file),
    };
  } catch (error) {
    revokeIfNeeded(objectUrl);
    throw error;
  }
}

