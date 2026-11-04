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
  { id: "nido", name: "Nido", src: "/examples/nido.svg", width: 512, height: 120, accessory: "hat", pin: { x: 11.7, y: -21.5, scale: 0.5 } },
  { id: "pino", name: "Pino", src: "/examples/pino.svg", width: 256, height: 320, accessory: "hat" },
  { id: "kora", name: "Kora", src: "/examples/kora.svg", width: 512, height: 104, accessory: "cane", pin: { x: 95 } },
  { id: "olivo", name: "Olivo", src: "/examples/olivo.svg", width: 512, height: 140, accessory: "elf", pin: { x: 33.2, y: -11.2, scale: 0.45 } },
  { id: "lumo", name: "Lumo", src: "/examples/lumo.svg", width: 256, height: 256, accessory: "hat" },
  { id: "brisa", name: "Brisa", src: "/examples/brisa.svg", width: 600, height: 150, accessory: "beard", pin: { x: 52, y: 88, scale: 0.45 } },
  { id: "taller", name: "Taller", src: "/examples/taller.svg", width: 512, height: 160, accessory: "elf", pin: { x: 11.7, y: -29.2, scale: 0.5 } },
  { id: "faro", name: "Faro", src: "/examples/faro.svg", width: 220, height: 360, accessory: "hat" },
  { id: "quena", name: "Quena", src: "/examples/quena.svg", width: 600, height: 200, accessory: "cane", pin: { x: 89, y: 38, scale: 0.42 } },
  { id: "tumi", name: "Tumi", src: "/examples/tumi.svg", width: 512, height: 512, accessory: "beard" },
  { id: "selva", name: "Selva", src: "/examples/selva.svg", width: 512, height: 98, accessory: "hat", pin: { x: 8 } },
  { id: "cobre", name: "Cobre", src: "/examples/cobre.svg", width: 512, height: 140, accessory: "elf", pin: { x: 39.1, y: -28.3, scale: 0.45 } },
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
