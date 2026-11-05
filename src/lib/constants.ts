import type { AccessoryId } from "./types";

export const ACCESSORY_BASE_SIZE = 0.46;

export const ACCESSORY_VIEWBOX: Record<AccessoryId, [number, number]> = {
  hat: [160, 150],
  beard: [180, 140],
  cane: [120, 180],
  elf: [150, 170],
};

/** transform-origin of each accessory's motion, as fractions of its box. */
export const ACCESSORY_ORIGIN: Record<AccessoryId, [number, number]> = {
  hat: [0.5, 0.86],
  beard: [0.5, 0.18],
  cane: [0.5, 0.92],
  elf: [0.5, 0.88],
};

// Scale is a share of the logo file width. Below 0.2 an accessory is
// smaller than the stage handles on a phone.
export const SCALE_MIN = 0.2;
export const SCALE_MAX = 2.4;
// Smallest longest side an Encima accessory gets, as a share of the
// logo's longest side, so a mark in a big empty file still shows it.
export const MIN_VISIBLE_SIDE = 0.16;
