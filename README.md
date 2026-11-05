# Xmastize your logo

A small open-source web app: upload your logo, drop a Christmas accessory on it, watch it move, download it.

It all runs in the browser. No upload server, no accounts.

## What you can do

- Upload an SVG, PNG, JPG, or WebP
- Pick an accessory
- Drag, resize, and rotate it on the logo
- Pick a motion: jump (hop, spin, land), spin, sway, bounce
- Download a GIF, PNG, SVG, or Avatar
- Avatar is a 400×400 PNG for profile pictures, with the logo centered and at least a 12% margin on every side so round crops don't cut it
- On phones and tablets, PNG and Avatar open the share sheet. On desktop they download
- Browse example logos in Gallery

SVGs are cleaned with DOMPurify (`USE_PROFILES: { svg: true, svgFilters: true }`). Scripts, `<style>`, `foreignObject`, event handlers, external `use`, and `href` / `xlink:href` pointing at other pages or files are stripped. On screen the logo is an `<img>` from a local blob, never injected raw.

On screen and in the SVG, motion stops if the system asks for less movement (`prefers-reduced-motion`). The GIF always moves.

## Run it

Node 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## Publish on Vercel

Import this repo in Vercel. The framework is Next.js. Build command is `npm run build`. Vercel picks the output folder.

## License

MIT. See `LICENSE`. Example logos are fictional brands made for this project.
