# Jake Pulitzer's Portfolio

I created this repository to have a central webpage for viewing my resume and projects within GitHub.

On this GitHub page you will find my bio, professional experience, and links to my personal projects.

If you are interested in my work, please contact me at pulitzer.jake@gmail.com

---

## How the site is built

Hand-built. No framework, no build step — Bauhaus geometry, a pastel palette,
and a live motion layer.

```
index.html        all content and markup
css/style.css     design system + layout
js/main.js        canvas shape field, kinetic type, scroll behaviour
favicon.svg       geometric mark
.nojekyll         tells GitHub Pages to serve the files as-is
```

### Editing

All résumé content lives in `index.html` — experience entries are `<li class="tl-item">`
blocks inside `<ol class="timeline">`. Copy an existing one to add a job.

Colours are CSS custom properties at the top of `css/style.css`:
`--cream`, `--ink`, `--red`, `--blue`, `--yellow`, `--sage`.
Each card picks one via `data-accent="red|blue|yellow|sage"`.

### Preview locally

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

### Motion

The background field is a `<canvas>` of drifting circles, squares, triangles,
arcs and rules. It reacts to the cursor, ripples on click, and parallaxes on
scroll. Visitors can pause it with the MOTION button, and it disables itself
automatically for `prefers-reduced-motion`.
