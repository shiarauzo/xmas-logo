export const AVATAR_SIZE = 400;
/** Share of the avatar kept empty on each side, so round crops don't cut the art. */
export const AVATAR_MARGIN = 0.12;

/** Where to draw a width×height image, centered and contained, in the square avatar. */
export function avatarRect(width: number, height: number, size = AVATAR_SIZE, margin = AVATAR_MARGIN) {
  const box = size * (1 - 2 * margin);
  const scale = box / Math.max(width, height, 1);
  const w = width * scale;
  const h = height * scale;
  return { x: (size - w) / 2, y: (size - h) / 2, width: w, height: h };
}
