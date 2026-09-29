# jake-pulitzer.com

Personal résumé site. Hand-built, no framework, no build step.

**Bauhaus geometry, pastel palette, live motion layer.**

## Structure

```
index.html        all content and markup
css/style.css     design system + layout
js/main.js        canvas shape field, kinetic type, scroll behaviour
favicon.svg       geometric mark
.nojekyll         tells GitHub Pages to serve the files as-is
```

## Editing

All résumé content lives in `index.html` — experience entries are `<li class="tl-item">`
blocks inside `<ol class="timeline">`. Copy an existing one to add a job.

Colours are CSS custom properties at the top of `css/style.css`:
`--cream`, `--ink`, `--red`, `--blue`, `--yellow`, `--sage`.
Each card picks one via `data-accent="red|blue|yellow|sage"`.

## Preview locally

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Motion

The background field is a `<canvas>` of drifting circles, squares, triangles,
arcs and rules. It reacts to the cursor, ripples on click, and parallaxes on
scroll. Visitors can pause it with the MOTION button, and it disables itself
automatically for `prefers-reduced-motion`.
