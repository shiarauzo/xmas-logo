# Gorrito navideño

Web app chiquita y de código abierto: sube tu logo y ponle un adorno navideño animado. Un gorro, una barba, un bastón o un gorro de duende. Lo colocas a mano, lo ves moverse y te lo bajas.

Todo corre en el navegador. No hay servidor de subida ni cuentas.

## Qué puedes hacer

- Subir un SVG, PNG, JPG o WebP
- Elegir un adorno
- Arrastrarlo, cambiar el tamaño y girarlo (también con el dedo)
- Usar atajos: encima del logo o en una letra
- Bajar un SVG animado o un PNG quieto

Los SVG se limpian con DOMPurify (`USE_PROFILES: { svg: true, svgFilters: true }`) y además se quitan scripts, `foreignObject`, `use` externos y referencias `href` / `xlink:href` hacia otras páginas o archivos. En pantalla el logo se ve como `<img>` desde un blob local, no se inyecta en crudo.

La animación se detiene si el sistema pide menos movimiento (`prefers-reduced-motion`).

## Cómo correrla

Necesitas Node 20 o más nuevo.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## Publicar en Vercel

Importa este repositorio en Vercel. El marco es Next.js, no hace falta config extra. El comando de build es `npm run build` y la carpeta de salida la resuelve Vercel sola.

## Licencia

MIT. Ver `LICENSE`.
