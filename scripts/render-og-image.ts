// Renders public/og.png, the og:image, with the same renderer Next uses
// for opengraph-image routes. Run: npm run og:image
import { readFileSync, writeFileSync } from "node:fs";
import { ImageResponse } from "next/og.js";
import { ogCard } from "../src/lib/og-card.ts";
import { OG_LOGO, OG_SIZE } from "../src/lib/og-scene.ts";

const logoSvg = readFileSync(OG_LOGO.src, "utf8");
const png = new ImageResponse(ogCard(logoSvg), OG_SIZE);
writeFileSync("public/og.png", Buffer.from(await png.arrayBuffer()));
console.log("public/og.png");
