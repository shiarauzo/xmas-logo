export type AccessoryId = "hat" | "beard" | "cane" | "elf";

export type PlacementPreset = "onTop" | "onLetter";

export type MotionId = "jump" | "spin" | "sway" | "bounce";

export type AccessoryTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type LogoKind = "svg" | "raster";

export type LogoInk = {
  /** Visible pixels in natural logo units. maxX and maxY are exclusive. */
  box: { minX: number; minY: number; maxX: number; maxY: number } | null;
  tone: "light" | "dark";
};

export type LogoAsset = {
  kind: LogoKind;
  name: string;
  objectUrl: string;
  sanitizedSvg?: string;
  dataUrl?: string;
  naturalWidth: number;
  naturalHeight: number;
  ink?: LogoInk;
};
