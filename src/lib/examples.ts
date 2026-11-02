import { ACCESSORY_BASE_SIZE, ACCESSORY_VIEWBOX } from "./constants.ts";
import { clamp } from "./geometry.ts";
import type { AccessoryId, AccessoryTransform } from "./types";

export type ExampleLogo = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  accessory: AccessoryId;
  pin?: Partial<AccessoryTransform>;
};

export const EXAMPLES: ExampleLogo[] = [
  { id: "cloudflare", name: "Cloudflare", src: "/examples/cloudflare.svg", width: 512, height: 76, accessory: "elf", pin: { x: 6 } },
  { id: "vercel", name: "Vercel", src: "/examples/vercel.svg", width: 512, height: 103, accessory: "hat", pin: { x: 8 } },
  { id: "apple", name: "Apple", src: "/examples/apple.svg", width: 256, height: 315, accessory: "hat" },
  { id: "nintendo", name: "Nintendo", src: "/examples/nintendo.svg", width: 600, height: 200, accessory: "cane", pin: { x: 94 } },
  { id: "logitech", name: "Logitech", src: "/examples/logitech.svg", width: 1000, height: 304, accessory: "elf", pin: { x: 8 } },
  { id: "amazon", name: "Amazon", src: "/examples/amazon.svg", width: 603, height: 182, accessory: "beard", pin: { x: 10 } },
  { id: "google", name: "Google", src: "/examples/google.svg", width: 512, height: 168, accessory: "hat", pin: { x: 9 } },
  { id: "microsoft", name: "Microsoft", src: "/examples/microsoft.svg", width: 512, height: 110, accessory: "hat", pin: { x: 8 } },
  { id: "meta", name: "Meta", src: "/examples/meta.svg", width: 512, height: 104, accessory: "elf", pin: { x: 8 } },
  { id: "netflix", name: "Netflix", src: "/examples/netflix.svg", width: 512, height: 138, accessory: "cane", pin: { x: 95 } },
  { id: "spotify", name: "Spotify", src: "/examples/spotify.svg", width: 512, height: 160, accessory: "elf", pin: { x: 10 } },
  { id: "tesla", name: "Tesla", src: "/examples/tesla.svg", width: 255, height: 254, accessory: "cane", pin: { x: 92, y: 36 } },
  { id: "stripe", name: "Stripe", src: "/examples/stripe.svg", width: 512, height: 214, accessory: "hat", pin: { x: 10 } },
  { id: "shopify", name: "Shopify", src: "/examples/shopify.svg", width: 612, height: 192, accessory: "elf", pin: { x: 10 } },
  { id: "airbnb", name: "Airbnb", src: "/examples/airbnb.svg", width: 512, height: 161, accessory: "beard", pin: { x: 10, y: 90 } },
  { id: "slack", name: "Slack", src: "/examples/slack.svg", width: 512, height: 130, accessory: "beard", pin: { x: 10 } },
  { id: "figma", name: "Figma", src: "/examples/figma.svg", width: 256, height: 384, accessory: "hat" },
  { id: "github", name: "GitHub", src: "/examples/github.svg", width: 512, height: 139, accessory: "beard", pin: { x: 10 } },
  { id: "nvidia", name: "NVIDIA", src: "/examples/nvidia.svg", width: 512, height: 98, accessory: "hat", pin: { x: 8 } },
  { id: "openai", name: "OpenAI", src: "/examples/openai.svg", width: 512, height: 126, accessory: "cane", pin: { x: 94 } },
];

export function isWideLogo(width: number, height: number) {
  return width / Math.max(height, 1) > 1.55;
}

export function placementOnLogo(
  id: AccessoryId,
  width: number,
  height: number,
): AccessoryTransform {
  const [vbW, vbH] = ACCESSORY_VIEWBOX[id];
  const wide = isWideLogo(width, height);
  const accAspect = vbH / vbW;

  if (id === "beard") {
    const targetH = height * (wide ? 0.72 : 0.4);
    const scale = clamp(
      targetH / (ACCESSORY_BASE_SIZE * width * accAspect),
      0.26,
      1.5,
    );
    return {
      x: wide ? 12 : 50,
      y: wide ? 84 : 90,
      scale,
      rotation: 2,
    };
  }

  if (id === "cane") {
    const targetH = height * (wide ? 1.2 : 0.72);
    const scale = clamp(
      targetH / (ACCESSORY_BASE_SIZE * width * accAspect),
      0.2,
      1.15,
    );
    return {
      x: wide ? 94 : 88,
      y: wide ? 46 : 40,
      scale,
      rotation: 8,
    };
  }

  const origin = id === "elf" ? 0.88 : 0.86;
  const targetH = height * (wide ? 1.4 : 0.52);
  const scale = clamp(
    targetH / (ACCESSORY_BASE_SIZE * width * accAspect),
    0.26,
    1.7,
  );
  const hatH = scale * ACCESSORY_BASE_SIZE * width * accAspect;
  const brimY = height * (wide ? 0.08 : 0.05);
  const centerY = brimY - (origin - 0.5) * hatH;
  return {
    x: wide ? 10 : 50,
    y: (centerY / Math.max(height, 1)) * 100,
    scale,
    rotation: id === "elf" ? 10 : -12,
  };
}

export function exampleTransform(item: ExampleLogo): AccessoryTransform {
  return { ...placementOnLogo(item.accessory, item.width, item.height), ...item.pin };
}
