import type { AccessoryId } from "./types";

export const ACCESSORY_BASE_SIZE = 0.46;

export const ACCESSORY_VIEWBOX: Record<AccessoryId, [number, number]> = {
  hat: [160, 150],
  beard: [180, 140],
  cane: [120, 180],
  elf: [150, 170],
};
