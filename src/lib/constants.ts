import type { AccessoryId } from "./types";

export const ACCESSORY_BASE_SIZE = 0.46;

/** Jump height as a fraction of the accessory box. Used in CSS and export pad. */
export const ACCESSORY_JUMP_PCT = 0.28;

export const ACCESSORY_VIEWBOX: Record<AccessoryId, [number, number]> = {
  hat: [160, 150],
  beard: [180, 140],
  cane: [120, 180],
  elf: [150, 170],
};
