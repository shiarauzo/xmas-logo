# Tricky logo corpus

`node fixtures/generate.mjs` writes the files and `manifest.json` (natural size, true ink box, glyph boxes). The two big files (`big4000.png`, about 8 MB, and `big.svg`, about 2.7 MB) are not committed.

| file | what it tests |
|---|---|
| wide.svg | wide wordmark, three glyphs |
| tall.svg | tall mark |
| padded.svg | ink low in a big square file |
| neg-origin.svg | viewBox with a negative origin |
| transforms.svg | nested groups with translate and scale |
| text-paths.svg | text converted to paths, under a matrix |
| no-size.svg | viewBox only, no width or height |
| size-only.svg | width and height, no viewBox |
| huge-coords.svg | viewBox one million wide, no width or height |
| tiny16.png | 16 px opaque PNG |
| transparent.png | transparent PNG, ink low in the frame |
| big4000.png | 4000 px PNG, about 8 MB |
| big.svg | 40000 paths, about 2.7 MB |
| black-wordmark.svg | black wordmark (from the Reviewer set) |
| white-logo.svg | white logo |
