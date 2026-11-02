import { ACCESSORY_VIEWBOX } from "./constants.ts";
import type { AccessoryId } from "./types";

export type ExampleLogo = {
  id: string;
  name: string;
  color: string;
  accessory: AccessoryId;
};

export const EXAMPLES: ExampleLogo[] = [
  { id: "cloudflare", name: "Cloudflare", color: "#F38020", accessory: "elf" },
  { id: "vercel", name: "Vercel", color: "#111111", accessory: "hat" },
  { id: "apple", name: "Apple", color: "#111111", accessory: "hat" },
  { id: "nintendo", name: "Nintendo", color: "#E60012", accessory: "cane" },
  { id: "logitech", name: "Logitech", color: "#00B8FC", accessory: "elf" },
  { id: "amazon", name: "amazon", color: "#FF9900", accessory: "beard" },
  { id: "google", name: "Google", color: "#4285F4", accessory: "hat" },
  { id: "microsoft", name: "Microsoft", color: "#00A4EF", accessory: "hat" },
  { id: "meta", name: "Meta", color: "#0866FF", accessory: "elf" },
  { id: "netflix", name: "NETFLIX", color: "#E50914", accessory: "cane" },
  { id: "spotify", name: "Spotify", color: "#1DB954", accessory: "elf" },
  { id: "tesla", name: "Tesla", color: "#CC0000", accessory: "cane" },
  { id: "stripe", name: "Stripe", color: "#635BFF", accessory: "hat" },
  { id: "shopify", name: "Shopify", color: "#95BF47", accessory: "elf" },
  { id: "airbnb", name: "Airbnb", color: "#FF5A5F", accessory: "beard" },
  { id: "slack", name: "Slack", color: "#4A154B", accessory: "beard" },
  { id: "figma", name: "Figma", color: "#F24E1E", accessory: "hat" },
  { id: "github", name: "GitHub", color: "#181717", accessory: "beard" },
  { id: "nvidia", name: "NVIDIA", color: "#76B900", accessory: "hat" },
  { id: "openai", name: "OpenAI", color: "#412991", accessory: "cane" },
];

export const GOOGLE_LETTER_COLORS = [
  "#4285F4",
  "#EA4335",
  "#FBBC05",
  "#4285F4",
  "#34A853",
  "#EA4335",
];

export const WORDMARK_VIEW = { width: 480, height: 300 } as const;
export const WORDMARK_FONT_SIZE = 52;
export const WORDMARK_BASELINE = 188;

export type LetterBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AccessoryFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  originY: number;
  flip: boolean;
};

const LETTER_EM: Record<string, number> = {
  M: 0.86,
  W: 0.86,
  m: 0.82,
  w: 0.82,
  A: 0.72,
  C: 0.74,
  D: 0.74,
  G: 0.78,
  H: 0.74,
  N: 0.74,
  O: 0.78,
  Q: 0.78,
  U: 0.74,
  I: 0.3,
  i: 0.28,
  j: 0.3,
  l: 0.28,
  f: 0.38,
  t: 0.4,
  r: 0.4,
};

function letterEm(letter: string) {
  return LETTER_EM[letter] ?? (letter === letter.toLowerCase() ? 0.56 : 0.62);
}

function isLower(letter: string) {
  return letter !== letter.toUpperCase();
}

export function wordmarkLayout(name: string) {
  const advances = [...name].map((letter) => letterEm(letter) * WORDMARK_FONT_SIZE);
  const textWidth = advances.reduce((sum, value) => sum + value, 0);
  const textX = (WORDMARK_VIEW.width - textWidth) / 2;
  const first = name[0] ?? "A";
  const last = name[name.length - 1] ?? first;
  const firstH = WORDMARK_FONT_SIZE * (isLower(first) ? 0.53 : 0.72);
  const lastH = WORDMARK_FONT_SIZE * (isLower(last) ? 0.53 : 0.72);
  const firstW = advances[0] ?? WORDMARK_FONT_SIZE * 0.6;
  const lastW = advances[advances.length - 1] ?? firstW;

  return {
    fontSize: WORDMARK_FONT_SIZE,
    baseline: WORDMARK_BASELINE,
    midX: WORDMARK_VIEW.width / 2,
    first: {
      x: textX,
      y: WORDMARK_BASELINE - firstH,
      width: firstW,
      height: firstH,
    },
    last: {
      x: textX + textWidth - lastW,
      y: WORDMARK_BASELINE - lastH,
      width: lastW,
      height: lastH,
    },
  };
}

export function accessoryFrame(
  id: AccessoryId,
  letters: { first: LetterBox; last: LetterBox },
): AccessoryFrame {
  const [vbW, vbH] = ACCESSORY_VIEWBOX[id];
  const firstCx = letters.first.x + letters.first.width / 2;
  const lastCx = letters.last.x + letters.last.width / 2;

  if (id === "beard") {
    const width = Math.max(letters.first.width * 1.7, WORDMARK_FONT_SIZE * 1.35);
    const height = width * (vbH / vbW);
    const originY = 0.16;
    return {
      x: firstCx - width / 2,
      y: letters.first.y + letters.first.height * 0.58 - height * originY,
      width,
      height,
      rotation: 2,
      originY,
      flip: false,
    };
  }

  if (id === "cane") {
    const width = WORDMARK_FONT_SIZE * 1.18;
    const height = width * (vbH / vbW);
    const originY = 0.11;
    return {
      x: lastCx - width * 0.16,
      y: letters.last.y - height * originY + letters.last.height * 0.1,
      width,
      height,
      rotation: -8,
      originY,
      flip: true,
    };
  }

  const originY = id === "elf" ? 0.86 : 0.9;
  const width = WORDMARK_FONT_SIZE * (id === "elf" ? 1.95 : 2.05);
  const height = width * (vbH / vbW);
  const sit = letters.first.y + letters.first.height * 0.08;
  return {
    x: firstCx - width / 2,
    y: sit - height * originY,
    width,
    height,
    rotation: id === "elf" ? 10 : -12,
    originY,
    flip: false,
  };
}
