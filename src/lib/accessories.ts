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
    viewBox: [160, 150],
    origin: "50% 86%",
    animation: "xmas-hat",
  },
  {
    id: "beard",
    name: "Barba",
    hint: "Barba navideña",
    viewBox: [180, 140],
    origin: "50% 18%",
    animation: "xmas-beard",
  },
  {
    id: "cane",
    name: "Bastón",
    hint: "Bastón de Navidad",
    viewBox: [120, 180],
    origin: "50% 92%",
    animation: "xmas-cane",
  },
  {
    id: "elf",
    name: "Duende",
    hint: "Gorro de duende",
    viewBox: [150, 170],
    origin: "50% 88%",
    animation: "xmas-elf",
  },
];

export const ACCESSORY_BY_ID = Object.fromEntries(
  ACCESSORIES.map((item) => [item.id, item]),
) as Record<AccessoryId, AccessoryMeta>;

export const ACCESSORY_BASE_SIZE = 0.46;

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
    const scale = 0.34;
    const heightPct = accessoryHeightPct(id, scale, aspect);
    const letterX = 40;
    const letterTop = 32;
    if (id === "beard") {
      return { x: 40, y: 62, scale, rotation: 4 };
    }
    if (id === "cane") {
      return { x: 40, y: 44, scale: 0.3, rotation: -14 };
    }
    return {
      x: id === "elf" ? 82 : letterX,
      y: letterTop - heightPct / 2 + 7,
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

function santaHatMarkup(p: string): string {
  return `
    <defs>
      <linearGradient id="${p}body" x1="20" y1="20" x2="130" y2="130" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ff5d5d"/>
        <stop offset=".45" stop-color="#e43333"/>
        <stop offset="1" stop-color="#b41d2a"/>
      </linearGradient>
      <linearGradient id="${p}fur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffdf8"/>
        <stop offset="1" stop-color="#e8dfd2"/>
      </linearGradient>
      <radialGradient id="${p}pom" cx="38%" cy="32%" r="70%">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#e5d8c8"/>
      </radialGradient>
      <filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#7a2a22" flood-opacity=".28"/>
      </filter>
    </defs>
    <g filter="url(#${p}soft)">
      <path fill="url(#${p}body)" d="M30 108 C38 70 56 38 82 22 C100 10 130 16 140 38 C148 54 138 66 122 60 C106 44 88 48 82 66 C76 84 94 98 116 108 C86 112 50 114 30 108 Z"/>
      <path fill="none" stroke="#9a1c26" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="3 7" opacity=".45" d="M52 96 C64 70 80 42 100 28"/>
      <ellipse cx="136" cy="36" rx="15" ry="14.5" fill="url(#${p}pom)"/>
      <ellipse cx="131" cy="31" rx="5" ry="3.6" fill="#fff" opacity=".85"/>
      <path fill="url(#${p}fur)" d="M18 104 C24 92 46 90 64 94 C82 86 104 86 122 94 C140 88 152 96 150 110 C148 124 128 128 108 124 C88 132 58 132 38 126 C20 130 12 118 18 104 Z"/>
      <ellipse cx="40" cy="108" rx="10" ry="8" fill="#fffaf3"/>
      <ellipse cx="68" cy="104" rx="11" ry="8.5" fill="#fffaf3"/>
      <ellipse cx="96" cy="104" rx="10.5" ry="8" fill="#fffaf3"/>
      <ellipse cx="122" cy="108" rx="10" ry="7.5" fill="#fffaf3"/>
      <g transform="translate(24 96)">
        <ellipse cx="8" cy="6" rx="5" ry="8" fill="#2f7a3e" transform="rotate(-28)"/>
        <ellipse cx="16" cy="7" rx="4.5" ry="7.5" fill="#245f31" transform="rotate(32)"/>
        <circle cx="12" cy="10" r="3.1" fill="#d62828"/>
        <circle cx="11" cy="8.8" r="1" fill="#ffd8d8"/>
      </g>
    </g>
  `;
}

function beardMarkup(p: string): string {
  return `
    <defs>
      <linearGradient id="${p}wool" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffdf9"/>
        <stop offset="1" stop-color="#e3d8ca"/>
      </linearGradient>
      <linearGradient id="${p}shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f4ebe0"/>
        <stop offset="1" stop-color="#cfc2b3"/>
      </linearGradient>
      <filter id="${p}soft" x="-15%" y="-15%" width="130%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#6b5344" flood-opacity=".2"/>
      </filter>
    </defs>
    <g filter="url(#${p}soft)">
      <path fill="url(#${p}shade)" d="M22 48 C18 22 48 10 70 22 C86 8 112 8 128 24 C154 12 172 32 164 58 C176 78 168 108 142 124 C118 140 70 142 46 124 C18 110 8 78 22 48 Z"/>
      <ellipse cx="48" cy="58" rx="28" ry="22" fill="url(#${p}wool)"/>
      <ellipse cx="90" cy="66" rx="34" ry="26" fill="url(#${p}wool)"/>
      <ellipse cx="132" cy="58" rx="27" ry="22" fill="url(#${p}wool)"/>
      <ellipse cx="64" cy="92" rx="26" ry="20" fill="#fffaf4"/>
      <ellipse cx="112" cy="94" rx="27" ry="21" fill="#fffaf4"/>
      <ellipse cx="88" cy="112" rx="24" ry="16" fill="#f7efe6"/>
      <path fill="#fffdf9" d="M40 44 C48 22 72 20 86 36 C78 28 62 30 54 44 C48 52 42 52 40 44 Z"/>
      <path fill="#fffdf9" d="M96 36 C110 18 138 22 146 44 C142 52 134 52 128 44 C118 28 104 28 96 36 Z"/>
      <path fill="none" stroke="#d7c7b6" stroke-width="2" stroke-linecap="round" d="M58 78 C70 88 104 88 118 76"/>
      <path fill="none" stroke="#eadfd3" stroke-width="3" stroke-linecap="round" d="M70 104 C82 114 100 114 112 102"/>
    </g>
  `;
}

function caneMarkup(p: string): string {
  return `
    <defs>
      <linearGradient id="${p}shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>
        <stop offset=".45" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <mask id="${p}mask">
        <path d="M46 166 V74 C46 30 96 16 112 46 C122 64 108 84 86 76" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
      </mask>
      <filter id="${p}soft" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#7a2a22" flood-opacity=".22"/>
      </filter>
    </defs>
    <g filter="url(#${p}soft)">
      <rect x="0" y="0" width="120" height="180" fill="#f7f1e8" mask="url(#${p}mask)"/>
      <g mask="url(#${p}mask)">
        <g transform="rotate(-22 60 90)">
          <rect x="-20" y="8" width="22" height="200" fill="#d31f2b"/>
          <rect x="24" y="8" width="22" height="200" fill="#d31f2b"/>
          <rect x="68" y="8" width="22" height="200" fill="#d31f2b"/>
          <rect x="112" y="8" width="22" height="200" fill="#d31f2b"/>
        </g>
      </g>
      <path d="M46 166 V74 C46 30 96 16 112 46 C122 64 108 84 86 76" fill="none" stroke="url(#${p}shine)" stroke-width="10" stroke-linecap="round"/>
      <g transform="translate(78 58)">
        <path d="M0 8 C-10 -4 -2 -12 8 -2 C18 -12 26 -2 16 8 C10 16 6 16 0 8 Z" fill="#c43b3b"/>
        <path d="M8 -2 C8 -12 22 -10 20 0" fill="none" stroke="#2f7a3e" stroke-width="3" stroke-linecap="round"/>
      </g>
    </g>
  `;
}

function elfHatMarkup(p: string): string {
  return `
    <defs>
      <linearGradient id="${p}green" x1="30" y1="10" x2="120" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#5dbe6a"/>
        <stop offset=".5" stop-color="#2f8a45"/>
        <stop offset="1" stop-color="#1b5a2e"/>
      </linearGradient>
      <linearGradient id="${p}brim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ef4a4a"/>
        <stop offset="1" stop-color="#a81f2a"/>
      </linearGradient>
      <radialGradient id="${p}bell" cx="35%" cy="30%" r="70%">
        <stop offset="0" stop-color="#ffe38a"/>
        <stop offset="1" stop-color="#d0891a"/>
      </radialGradient>
      <filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#16351f" flood-opacity=".28"/>
      </filter>
    </defs>
    <g filter="url(#${p}soft)">
      <path fill="url(#${p}green)" d="M34 118 C28 96 48 70 70 42 C86 20 78 10 62 16 C44 24 28 20 24 10 C36 6 58 2 78 10 C104 20 122 48 128 78 C118 70 100 78 96 94 C90 112 110 120 124 122 C96 126 58 128 36 120 C34 120 34 119 34 118 Z"/>
      <path fill="none" stroke="#0f3d22" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 8" opacity=".4" d="M48 108 C62 78 78 48 70 28"/>
      <circle cx="28" cy="12" r="11" fill="url(#${p}bell)"/>
      <circle cx="25" cy="8" r="3.2" fill="#fff3c4" opacity=".8"/>
      <rect x="24" y="20" width="8" height="7" rx="2" fill="#b87412"/>
      <circle cx="28" cy="28" r="2.3" fill="#8a560c"/>
      <path fill="url(#${p}brim)" d="M18 118 C26 104 50 100 74 104 C98 98 128 102 138 116 C142 130 122 142 96 138 C74 146 42 146 24 136 C12 130 12 122 18 118 Z"/>
      <path fill="none" stroke="#f2c14b" stroke-width="2.1" stroke-linecap="round" stroke-dasharray="2 8" d="M30 124 C52 116 86 116 118 126"/>
      <circle cx="44" cy="122" r="3" fill="#f2c14b"/>
      <circle cx="74" cy="120" r="3" fill="#f2c14b"/>
      <circle cx="104" cy="124" r="3" fill="#f2c14b"/>
    </g>
  `;
}

export const ACCESSORY_MOTION_CSS = `
@keyframes xmas-hat {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  10% { transform: translate(0, 4px) rotate(-8deg) scaleY(.94); }
  28% { transform: translate(0, -20px) rotate(-12deg); }
  46% { transform: translate(0, -16px) rotate(220deg); }
  62% { transform: translate(0, -4px) rotate(360deg); }
  78% { transform: translate(0, 2px) rotate(360deg); }
}
@keyframes xmas-beard {
  0%, 100% { transform: rotate(0deg) skewX(0deg); }
  20% { transform: rotate(-5deg) skewX(-4deg); }
  48% { transform: rotate(4deg) skewX(3deg); }
  74% { transform: rotate(-3deg) skewX(2deg); }
}
@keyframes xmas-cane {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  28% { transform: translateY(-12px) rotate(-10deg); }
  46% { transform: translateY(3px) rotate(6deg); }
  68% { transform: translateY(-7px) rotate(-4deg); }
}
@keyframes xmas-elf {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  18% { transform: translate(2px, 3px) rotate(-6deg); }
  40% { transform: translate(-2px, -16px) rotate(14deg); }
  62% { transform: translate(1px, -4px) rotate(-8deg); }
  80% { transform: translate(0, 0) rotate(4deg); }
}
.xmas-motion {
  animation-duration: 2.8s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  transform-box: fill-box;
}
.xmas-hat { animation-name: xmas-hat; transform-origin: 50% 86%; }
.xmas-beard { animation-name: xmas-beard; transform-origin: 50% 18%; }
.xmas-cane { animation-name: xmas-cane; transform-origin: 50% 92%; }
.xmas-elf { animation-name: xmas-elf; transform-origin: 50% 88%; }
@media (prefers-reduced-motion: reduce) {
  .xmas-motion,
  .xmas-motion * {
    animation: none !important;
  }
}
`;
