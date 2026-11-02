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

export type LogoAsset = {
  kind: LogoKind;
  name: string;
  objectUrl: string;
  sanitizedSvg?: string;
  dataUrl?: string;
  naturalWidth: number;
  naturalHeight: number;
};
