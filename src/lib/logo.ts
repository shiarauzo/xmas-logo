import { ensureSvgSize, sanitizeSvg } from "./sanitize-svg";
import type { LogoAsset } from "./types";

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

function measureImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({
        width: image.naturalWidth || 800,
        height: image.naturalHeight || 800,
      });
    image.onerror = () => reject(new Error("Couldn’t open the logo. Try another file."));
    image.src = src;
  });
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
    };
  } catch (error) {
    revokeIfNeeded(objectUrl);
    throw error;
  }
}

