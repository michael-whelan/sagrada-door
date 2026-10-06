# Sagrada Família – Our Father door

No build, no dependencies. Open `index.html` (or serve the folder with any static server).

- `data.js`  – the 50 languages: highlight boxes (% of the photo) and prayer texts. Edit this to fix things.
- `app.js`   – search, highlight, overlay (desktop) / text below (mobile).
- `index.html?edit` – pick a language, drag on the door to redraw its box (shift-drag adds one); copy the JSON into data.js.

## Glow highlight
Selecting a language dims the whole door (`#dim`) except a soft pool around its boxes, then lights
the carved letters inside them.

The glow follows the carving itself, not the box. The prayer texts can't give us that — the
lettering is hand-cut, so any font rendered across a box would land off the real glyphs — so
`strokeMask` in `app.js` measures it off the photo instead: how far each pixel sits from its own
local background, judged against how busy that patch already is. The result becomes an SVG mask, so
the sharpened photo (`#boost`), the warm `.ink` and the blurred `.halo` all land only on the
strokes. `getImageData` is blocked on `file://`, so opening the page straight off disk falls back
to the soft box (`#lit.boxed`); serve the folder to get the stroke glow.

Boxes come from `data.js` and can be redrawn with `?edit` — a box taller than its line will light
the neighbouring lines too. `HOLE_FILL` in `app.js` controls how much dim is lifted around the line.
