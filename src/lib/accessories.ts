import { ACCESSORY_BASE_SIZE, ACCESSORY_VIEWBOX } from "./constants.ts";
import type { AccessoryId, AccessoryTransform, PlacementPreset } from "./types";

export type AccessoryMeta = {
  id: AccessoryId;
  name: string;
  hint: string;
  viewBox: [number, number];
  origin: string;
  animation: string;
};

export const ACCESSORIES: AccessoryMeta[] = [
  {
    id: "hat",
    name: "Gorro",
    hint: "Gorro de Navidad",
    viewBox: ACCESSORY_VIEWBOX.hat,
    origin: "50% 86%",
    animation: "xmas-hat",
  },
  {
    id: "beard",
    name: "Barba",
    hint: "Barba navideña",
    viewBox: ACCESSORY_VIEWBOX.beard,
    origin: "50% 18%",
    animation: "xmas-beard",
  },
  {
    id: "cane",
    name: "Bastón",
    hint: "Bastón de Navidad",
    viewBox: ACCESSORY_VIEWBOX.cane,
    origin: "50% 92%",
    animation: "xmas-cane",
  },
  {
    id: "elf",
    name: "Duende",
    hint: "Gorro de duende",
    viewBox: ACCESSORY_VIEWBOX.elf,
    origin: "50% 88%",
    animation: "xmas-elf",
  },
];

export const ACCESSORY_BY_ID = Object.fromEntries(
  ACCESSORIES.map((item) => [item.id, item]),
) as Record<AccessoryId, AccessoryMeta>;

export { ACCESSORY_BASE_SIZE };

function accessoryHeightPct(
  id: AccessoryId,
  scale: number,
  aspect: number,
) {
  const [vbW, vbH] = ACCESSORY_BY_ID[id].viewBox;
  return scale * ACCESSORY_BASE_SIZE * 100 * (vbH / vbW) * aspect;
}

export function placementFor(
  preset: PlacementPreset,
  id: AccessoryId,
  logo: { naturalWidth: number; naturalHeight: number },
): AccessoryTransform {
  const aspect = logo.naturalWidth / Math.max(logo.naturalHeight, 1);

  if (preset === "onLetter") {
    const scale = id === "cane" ? 0.3 : 0.34;
    const heightPct = accessoryHeightPct(id, scale, aspect);
    const letterX = 16;
    const letterTop = 22;
    if (id === "beard") {
      return { x: letterX, y: 58, scale, rotation: 4 };
    }
    if (id === "cane") {
      return { x: letterX, y: letterTop + 18, scale, rotation: -14 };
    }
    return {
      x: letterX,
      y: letterTop - heightPct / 2 + 6,
      scale,
      rotation: id === "elf" ? 16 : -18,
    };
  }

  const scale = id === "cane" ? 0.4 : 0.48;
  const heightPct = accessoryHeightPct(id, scale, aspect);
  const sit = 12;

  if (id === "beard") {
    return { x: 50, y: 100 + heightPct / 2 - 7, scale: 0.52, rotation: 0 };
  }
  if (id === "cane") {
    return { x: 93, y: sit - heightPct / 2, scale, rotation: 10 };
  }
  return {
    x: 50,
    y: sit - heightPct / 2,
    scale,
    rotation: id === "elf" ? 8 : -8,
  };
}

export function accessoryMarkup(id: AccessoryId, prefix: string): string {
  switch (id) {
    case "hat":
      return santaHatMarkup(prefix);
    case "beard":
      return beardMarkup(prefix);
    case "cane":
      return caneMarkup(prefix);
    case "elf":
      return elfHatMarkup(prefix);
  }
}

function softShadow(p: string, color: string): string {
  return `<filter id="${p}soft" x="-22%" y="-22%" width="144%" height="144%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity=".16"/>
    </filter>`;
}

function santaHatMarkup(p: string): string {
  return `
    <defs>
      <linearGradient id="${p}body" x1="36" y1="20" x2="110" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ff6b73"/>
        <stop offset="1" stop-color="#e02438"/>
      </linearGradient>
      <linearGradient id="${p}fur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#f0e2d4"/>
      </linearGradient>
      <radialGradient id="${p}pom" cx="34%" cy="30%" r="70%">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#f0e2d4"/>
      </radialGradient>
      ${softShadow(p, "#8a2430")}
    </defs>
    <g filter="url(#${p}soft)">
      <path fill="url(#${p}body)" d="M34 110 C40 62 74 24 110 20 C130 17 144 32 136 50 C130 64 114 62 104 72 C86 92 94 108 124 114 C88 122 46 122 34 110 Z"/>
      <circle cx="130" cy="36" r="17" fill="url(#${p}pom)"/>
      <rect x="18" y="102" width="124" height="34" rx="17" fill="url(#${p}fur)"/>
      <ellipse cx="124" cy="30" rx="6" ry="4.5" fill="#fff" opacity=".9"/>
      <ellipse cx="46" cy="114" rx="16" ry="8" fill="#fff" opacity=".45"/>
    </g>
  `;
}

function beardMarkup(p: string): string {
  return `
    <defs>
      <linearGradient id="${p}wool" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#f3e6d8"/>
      </linearGradient>
      <radialGradient id="${p}puff" cx="38%" cy="32%" r="70%">
        <stop offset="0" stop-color="#fffdfb"/>
        <stop offset="1" stop-color="#f0e2d4"/>
      </radialGradient>
      ${softShadow(p, "#6b5344")}
    </defs>
    <g filter="url(#${p}soft)">
      <ellipse cx="90" cy="78" rx="66" ry="48" fill="#efe3d6"/>
      <circle cx="50" cy="60" r="32" fill="url(#${p}puff)"/>
      <circle cx="90" cy="50" r="36" fill="url(#${p}wool)"/>
      <circle cx="130" cy="60" r="32" fill="url(#${p}puff)"/>
      <circle cx="66" cy="92" r="30" fill="url(#${p}wool)"/>
      <circle cx="114" cy="92" r="30" fill="url(#${p}wool)"/>
      <circle cx="90" cy="110" r="24" fill="#f7eee4"/>
      <ellipse cx="70" cy="42" rx="18" ry="11" fill="#fffdfb"/>
      <ellipse cx="110" cy="42" rx="18" ry="11" fill="#fffdfb"/>
      <ellipse cx="78" cy="52" rx="8" ry="5" fill="#fff" opacity=".7"/>
    </g>
  `;
}

function caneMarkup(p: string): string {
  return `
    <defs>
      <linearGradient id="${p}shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".6"/>
        <stop offset=".5" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <mask id="${p}mask">
        <path d="M42 166 V72 C42 26 102 16 110 52 C116 74 96 88 74 78" fill="none" stroke="#fff" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
      </mask>
      ${softShadow(p, "#8a2430")}
    </defs>
    <g filter="url(#${p}soft)">
      <rect x="0" y="0" width="120" height="180" fill="#fff6ec" mask="url(#${p}mask)"/>
      <g mask="url(#${p}mask)">
        <g transform="rotate(-24 60 90)">
          <rect x="-24" y="4" width="24" height="210" rx="8" fill="#f43b4a"/>
          <rect x="24" y="4" width="24" height="210" rx="8" fill="#f43b4a"/>
          <rect x="72" y="4" width="24" height="210" rx="8" fill="#f43b4a"/>
          <rect x="120" y="4" width="24" height="210" rx="8" fill="#f43b4a"/>
        </g>
      </g>
      <path d="M42 166 V72 C42 26 102 16 110 52 C116 74 96 88 74 78" fill="none" stroke="url(#${p}shine)" stroke-width="12" stroke-linecap="round"/>
    </g>
  `;
}

function elfHatMarkup(p: string): string {
  return `
    <defs>
      <linearGradient id="${p}green" x1="30" y1="8" x2="120" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#5ee08a"/>
        <stop offset="1" stop-color="#2aa85a"/>
      </linearGradient>
      <linearGradient id="${p}brim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ff6b73"/>
        <stop offset="1" stop-color="#e02438"/>
      </linearGradient>
      <radialGradient id="${p}bell" cx="35%" cy="30%" r="70%">
        <stop offset="0" stop-color="#ffe89a"/>
        <stop offset="1" stop-color="#f0b429"/>
      </radialGradient>
      ${softShadow(p, "#1f5a32")}
    </defs>
    <g filter="url(#${p}soft)">
      <path fill="url(#${p}green)" d="M32 124 C28 78 56 30 90 18 C106 12 98 4 74 10 C54 16 34 8 34 4 C50 0 86 4 106 20 C128 36 134 82 130 122 C98 114 88 122 90 132 Q94 144 124 138 C92 150 48 146 32 124 Z"/>
      <circle cx="36" cy="10" r="13" fill="url(#${p}bell)"/>
      <rect x="31" y="20" width="10" height="7" rx="3" fill="#e09a18"/>
      <ellipse cx="32" cy="6" rx="4.5" ry="3.2" fill="#fff3c4" opacity=".85"/>
      <rect x="18" y="118" width="118" height="30" rx="15" fill="url(#${p}brim)"/>
      <ellipse cx="44" cy="128" rx="12" ry="6" fill="#fff" opacity=".28"/>
    </g>
  `;
}

export const ACCESSORY_MOTION_CSS = `
@keyframes xmas-jump {
  0% { transform: translate(0, 0) rotate(0deg); }
  14% { transform: translate(0, 6px) rotate(-10deg) scaleY(.92); }
  42% { transform: translate(0, -28px) rotate(210deg); }
  62% { transform: translate(0, -6px) rotate(340deg); }
  78% { transform: translate(0, 3px) rotate(360deg) scaleY(.96); }
  100% { transform: translate(0, 0) rotate(360deg); }
}
.xmas-motion {
  animation-name: xmas-jump;
  animation-duration: .95s;
  animation-timing-function: cubic-bezier(.2, .7, .2, 1);
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
  transform-box: fill-box;
}
.xmas-hat { transform-origin: 50% 86%; }
.xmas-beard { transform-origin: 50% 18%; }
.xmas-cane { transform-origin: 50% 92%; }
.xmas-elf { transform-origin: 50% 88%; }
@media (prefers-reduced-motion: reduce) {
  .xmas-motion,
  .xmas-motion * {
    animation: none !important;
  }
}
`;
