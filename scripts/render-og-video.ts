// Renders public/og.mp4, the og:video: the og:image card with the hat
// doing the studio's jump (hop, spin, land), twice, with a short rest
// before each hop so the clip loops cleanly. Needs ffmpeg on PATH.
// Run: npm run og:video
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ImageResponse } from "next/og.js";
import { MOTION_TIMING, motionOffset } from "../src/lib/motion.ts";
import { ogCard } from "../src/lib/og-card.ts";
import { OG_LOGO, OG_SIZE } from "../src/lib/og-scene.ts";

const FPS = 30;
const REST_MS = 400;
const HOPS = 2;
const HOP_MS = MOTION_TIMING.jump.durationMs;

const logoSvg = readFileSync(OG_LOGO.src, "utf8");
const dir = mkdtempSync(join(tmpdir(), "og-video-"));
const cycleFrames = Math.round(((REST_MS + HOP_MS) / 1000) * FPS);
const restFrames = Math.round((REST_MS / 1000) * FPS);

try {
  let index = 0;
  for (let hop = 0; hop < HOPS; hop += 1) {
    for (let i = 0; i < cycleFrames; i += 1) {
      const t = i < restFrames ? 0 : (i - restFrames) / (cycleFrames - restFrames);
      const frame = new ImageResponse(ogCard(logoSvg, motionOffset("jump", t)), OG_SIZE);
      const name = `frame-${String(index).padStart(4, "0")}.png`;
      writeFileSync(join(dir, name), Buffer.from(await frame.arrayBuffer()));
      index += 1;
    }
  }
  execFileSync(
    "ffmpeg",
    [
      "-y", "-loglevel", "error",
      "-framerate", String(FPS),
      "-i", join(dir, "frame-%04d.png"),
      "-c:v", "libx264", "-profile:v", "high", "-preset", "veryslow", "-crf", "20",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
      "public/og.mp4",
    ],
    { stdio: "inherit" },
  );
  console.log(`public/og.mp4: ${index} frames at ${FPS} fps`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
