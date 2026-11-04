// Builds the tricky-logo corpus. Run: node fixtures/generate.mjs
// manifest.json lists each file with its true ink box in natural pixels
// (the size the browser gives the <img>) and, for wordmarks, each glyph box.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const dir = path.dirname(new URL(import.meta.url).pathname);
const out = (name, data) => fs.writeFileSync(path.join(dir, name), data);

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const manifest = [];
const add = (file, natural, ink, extra = {}) => manifest.push({ file, natural, ink, ...extra });
const C = "#1f3a5f";

// Three block glyphs "I U I" with a tall middle letter, in a given box.
function glyphs(x0, y0, w, h) {
  const gw = w * 0.22, gap = (w - gw * 3) / 2;
  return [0, 1, 2].map((i) => {
    const top = i === 1 ? y0 : y0 + h * 0.25;
    return { x: x0 + i * (gw + gap), y: top, w: gw, h: y0 + h - top };
  });
}
const rects = (gs) => gs.map((g) => `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="${C}"/>`).join("");
const box = (gs) => ({ minX: Math.min(...gs.map((g) => g.x)), minY: Math.min(...gs.map((g) => g.y)), maxX: Math.max(...gs.map((g) => g.x + g.w)), maxY: Math.max(...gs.map((g) => g.y + g.h)) });

// 1 wide wordmark, ink fills the canvas
{ const gs = glyphs(0, 0, 1000, 200);
  out("wide.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="200" viewBox="0 0 1000 200">${rects(gs)}</svg>`);
  add("wide.svg", [1000, 200], box(gs), { glyphs: gs }); }
// 2 tall mark
{ out("tall.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="1000" viewBox="0 0 200 1000"><rect x="20" y="0" width="160" height="1000" fill="${C}"/></svg>`);
  add("tall.svg", [200, 1000], { minX: 20, minY: 0, maxX: 180, maxY: 1000 }); }
// 3 lots of whitespace above the ink (common export from design tools)
{ const gs = glyphs(60, 220, 280, 80);
  out("padded.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${rects(gs)}</svg>`);
  add("padded.svg", [400, 400], box(gs), { glyphs: gs }); }
// 4 viewBox with a negative origin
{ out("neg-origin.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="-500 -300 1000 600"><rect x="-200" y="-50" width="400" height="100" fill="${C}"/></svg>`);
  add("neg-origin.svg", [1000, 600], { minX: 300, minY: 250, maxX: 700, maxY: 350 }); }
// 5 transforms and nested groups: ink at x 100..500, y 150..250 in a 600x300 box
{ out("transforms.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><g transform="translate(100 100)"><g transform="scale(2)"><g transform="translate(0 25)"><rect x="0" y="0" width="200" height="50" fill="${C}"/></g></g></g></svg>`);
  add("transforms.svg", [600, 300], { minX: 100, minY: 150, maxX: 500, maxY: 250 }); }
// 6 text converted to paths, glyph paths in a group with a matrix
{ const gs = glyphs(0, 0, 300, 100);
  const d = gs.map((g) => `M${g.x} ${g.y}h${g.w}v${g.h}h${-g.w}z`).join("");
  out("text-paths.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="200" viewBox="0 0 500 200"><g transform="matrix(1 0 0 1 100 60)"><path d="${d}" fill="${C}"/></g></svg>`);
  const moved = gs.map((g) => ({ ...g, x: g.x + 100, y: g.y + 60 }));
  add("text-paths.svg", [500, 200], box(moved), { glyphs: moved }); }
// 7 viewBox only, no width/height
{ out("no-size.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120"><rect x="40" y="30" width="240" height="60" fill="${C}"/></svg>`);
  add("no-size.svg", [320, 120], { minX: 40, minY: 30, maxX: 280, maxY: 90 }); }
// 8 width/height only, no viewBox
{ out("size-only.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><rect x="30" y="40" width="240" height="60" fill="${C}"/></svg>`);
  add("size-only.svg", [300, 100], { minX: 30, minY: 40, maxX: 270, maxY: 100 }); }
// 9 huge coordinates, no width/height
{ out("huge-coords.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000000 250000"><rect x="100000" y="50000" width="800000" height="200000" fill="${C}"/></svg>`);
  add("huge-coords.svg", [1000000, 250000], { minX: 100000, minY: 50000, maxX: 900000, maxY: 250000 }); }
// 10 tiny 16 px PNG, fully opaque
{ out("tiny16.png", png(16, 16, () => [31, 58, 95, 255]));
  add("tiny16.png", [16, 16], { minX: 0, minY: 0, maxX: 16, maxY: 16 }); }
// 11 transparent PNG with ink low in the frame
{ out("transparent.png", png(400, 400, (x, y) => (x >= 120 && x < 280 && y >= 200 && y < 300 ? [31, 58, 95, 255] : [0, 0, 0, 0])));
  add("transparent.png", [400, 400], { minX: 120, minY: 200, maxX: 280, maxY: 300 }); }
// 12 big 4000 px PNG (noise so it does not compress away)
{ let s = 7; const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s & 15) * 16; };
  out("big4000.png", png(4000, 2000, (x, y) => (y >= 400 ? [rnd(), rnd(), 200, 255] : [0, 0, 0, 0])));
  add("big4000.png", [4000, 2000], { minX: 0, minY: 400, maxX: 4000, maxY: 2000 }, { big: true }); }
// 13 big SVG (~3 MB of paths), ink 0..1200 x 100..400
{ let s = 3; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const parts = [];
  for (let i = 0; i < 40000; i++) {
    const x = (rnd() * 1180).toFixed(3), y = (100 + rnd() * 280).toFixed(3);
    parts.push(`<path d="M${x} ${y}l${(rnd() * 20).toFixed(3)} ${(rnd() * 20).toFixed(3)}l${(-rnd() * 10).toFixed(3)} ${(rnd() * 10).toFixed(3)}z" fill="${C}"/>`);
  }
  parts.push(`<rect x="0" y="100" width="1200" height="1" fill="${C}"/><rect x="0" y="399" width="1200" height="1" fill="${C}"/>`);
  out("big.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">${parts.join("")}</svg>`);
  add("big.svg", [1200, 500], { minX: 0, minY: 100, maxX: 1200, maxY: 400 }, { big: true }); }

out("manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(manifest.map((m) => `${m.file} ${(fs.statSync(path.join(dir, m.file)).size / 1024).toFixed(0)}KB`).join("\n"));
