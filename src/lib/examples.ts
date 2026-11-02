import type { AccessoryId, AccessoryTransform } from "./types";

export type ExampleLogo = {
  id: string;
  name: string;
  src: string;
  accessory: AccessoryId;
  transform: AccessoryTransform;
};

const hat = (rotation = -8): AccessoryTransform => ({
  x: 50,
  y: 30,
  scale: 0.42,
  rotation,
});

const elf = (rotation = 8): AccessoryTransform => ({
  x: 50,
  y: 28,
  scale: 0.42,
  rotation,
});

const beard: AccessoryTransform = { x: 50, y: 76, scale: 0.48, rotation: 0 };

const cane = (x = 78): AccessoryTransform => ({
  x,
  y: 44,
  scale: 0.34,
  rotation: 12,
});

export const EXAMPLES: ExampleLogo[] = [
  { id: "cloudflare", name: "Cloudflare", src: "/examples/cloudflare.svg", accessory: "elf", transform: elf(10) },
  { id: "vercel", name: "Vercel", src: "/examples/vercel.svg", accessory: "hat", transform: hat(-10) },
  { id: "apple", name: "Apple", src: "/examples/apple.svg", accessory: "hat", transform: hat(-6) },
  { id: "nintendo", name: "Nintendo", src: "/examples/nintendo.svg", accessory: "cane", transform: cane(80) },
  { id: "logitech", name: "Logitech", src: "/examples/logitech.svg", accessory: "elf", transform: elf(6) },
  { id: "amazon", name: "Amazon", src: "/examples/amazon.svg", accessory: "beard", transform: beard },
  { id: "google", name: "Google", src: "/examples/google.svg", accessory: "hat", transform: hat(-12) },
  { id: "microsoft", name: "Microsoft", src: "/examples/microsoft.svg", accessory: "hat", transform: hat(-4) },
  { id: "meta", name: "Meta", src: "/examples/meta.svg", accessory: "elf", transform: elf(12) },
  { id: "netflix", name: "Netflix", src: "/examples/netflix.svg", accessory: "cane", transform: cane(76) },
  { id: "spotify", name: "Spotify", src: "/examples/spotify.svg", accessory: "elf", transform: elf(4) },
  { id: "tesla", name: "Tesla", src: "/examples/tesla.svg", accessory: "cane", transform: cane(79) },
  { id: "stripe", name: "Stripe", src: "/examples/stripe.svg", accessory: "hat", transform: hat(-8) },
  { id: "shopify", name: "Shopify", src: "/examples/shopify.svg", accessory: "elf", transform: elf(8) },
  { id: "airbnb", name: "Airbnb", src: "/examples/airbnb.svg", accessory: "beard", transform: beard },
  { id: "slack", name: "Slack", src: "/examples/slack.svg", accessory: "beard", transform: beard },
  { id: "figma", name: "Figma", src: "/examples/figma.svg", accessory: "hat", transform: hat(-14) },
  { id: "github", name: "GitHub", src: "/examples/github.svg", accessory: "beard", transform: beard },
  { id: "nvidia", name: "NVIDIA", src: "/examples/nvidia.svg", accessory: "hat", transform: hat(-6) },
  { id: "openai", name: "OpenAI", src: "/examples/openai.svg", accessory: "cane", transform: cane(77) },
];
