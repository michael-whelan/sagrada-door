# Sagrada Família – Our Father door

No build, no dependencies. Open `index.html` (or serve the folder with any static server).

- `data.js`  – the 50 languages: highlight boxes (% of the photo) and prayer texts. Edit this to fix things.
- `app.js`   – search, highlight, overlay (desktop) / text below (mobile).
- `index.html?edit` – pick a language, drag on the door to redraw its box (shift-drag adds one); copy the JSON into data.js.

## Glow highlight
`door-lit.jpg` is an amber edge map of the door photo (made by `tools-make-lit-map.py` from the original full shot; needs numpy, scipy, Pillow). The page reveals it through soft masks over the selected boxes, adds a bloom and a one-off light sweep, so the carved letters look lit rather than boxed. Boxes still come from `data.js` and can be redrawn with `?edit`.
