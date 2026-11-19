# Fathima Amna & Muhammed Nirjas — wedding invitation

Static Next.js 15 site (`output: 'export'`). Everything editable lives in `config/event.json`.

## Run
    npm install
    npm run dev        # http://localhost:3000
    npm run build      # static site in /out  (also regenerates the .ics files)

## Deploy (Netlify)
Build command `npm run build`, publish directory `out`. Then set in `config/event.json`:
- `siteUrl` → your Netlify URL (used for calendar links / sharing)
- `venues[0].lat / lng` → Shadhi Mahal coordinates (shows the live map; until then a "Open in Maps" card is shown)
Optional analytics: set env var `NEXT_PUBLIC_GA_ID` (e.g. G-XXXXXXXX) in Netlify.

## Swap images later
Replace the file, keep the name: `public/media/footer-scene.webp` (footer picture, currently a placeholder),
`public/media/mem-*.jpg` (hanging polaroids, currently dummy), `public/og.jpg` (WhatsApp/Google preview, 1200x630).
After changing og.jpg, share the link with `?v=2` to bypass WhatsApp's cache.
