# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

A **static marketing website** for **Seaways MPSS** — LANG's Multi-Purpose
Semi-Submersible, a standardized deepwater production host marketed as
leaseable offshore infrastructure. The site is built on a five-S design story:
**Simple · Safe · Swift · Size · Saves.**

There is **no build step, no framework, no package manager, and no tests.**
It is hand-written HTML, CSS, and vanilla JavaScript. Every page works with
JavaScript disabled; JS is progressive enhancement only.

The repo name on disk is `The-Whole-Hole`; the product/brand is "Seaways MPSS"
and the target domain is `seaways-mpss.com`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The main single-page site. Sections: hero, About (`#about`), Five S (`#five-s`), Specs (`#specs`), Hull Comparison (`#comparison`), The Model (`#model`), Heritage (`#heritage`), Leasing (`#leasing`), Contact (`#contact`). |
| `day-rates.html` | Standalone interactive day-rate leasing calculator page. Linked from the main nav ("Day Rates"). Marked `noindex`. |
| `styles.css` | **All** styling for both pages. CSS custom properties in `:root`, organized into commented section banners. No preprocessor. |
| `main.js` | Small progressive-enhancement script shared by both pages: mobile nav toggle + footer year. |
| `day-rates.js` | The day-rate model logic (calculator state, rendering, CSV export). Loaded only by `day-rates.html`, after `main.js`. |
| `README.md` | Human-facing project overview and content-editing notes. |

## Running locally

It's a static site. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

There is nothing to install, compile, or bundle. Verifying a change means
opening the affected page in a browser and looking at it — there is no test
suite or linter configured.

## Conventions

### General
- **No dependencies.** Do not introduce a framework, build tool, npm packages,
  CSS preprocessor, or a CDN `<script>`/`<link>`. Everything stays vanilla and
  self-contained. Illustrations (hull schematics, platform art, favicon) are
  inline SVG — no third-party images.
- **Progressive enhancement.** The site must remain fully readable and usable
  with JS off. Keep JS optional and defensive (guard DOM lookups with `if`).
- Keep the two pages visually consistent: shared header, footer, brand mark,
  and `styles.css`.

### HTML
- Copy lives inline, grouped under clearly-commented section banners:
  `<!-- ===================== SPECS ===================== -->`. Match that
  style when adding a section.
- Accessibility is maintained deliberately: `aria-label`, `aria-expanded`,
  `aria-controls`, `aria-current`, `role="img"` on decorative/illustrative
  SVGs, and `abbr title` on abbreviations. Preserve these when editing.
- Both pages share the same header/nav and footer markup — if you change one,
  change the other to keep them in sync. Note the nav link sets differ slightly
  between pages (that is intentional).

### CSS (`styles.css`)
- Use the existing CSS custom properties from `:root` (e.g. `--navy-900`,
  `--accent`, `--accent-deep`, `--slate`, `--bg-alt`, `--radius`, `--shadow-md`,
  `--maxw`, `--font`) rather than hard-coding colors or sizes. The palette is
  navy / ocean-blue / steel with an orange `--flare` accent.
- File is organized top-to-bottom by commented section banners matching the
  HTML sections; a `RESPONSIVE` block at the end holds the media queries. Add
  new rules under the relevant banner, and put breakpoint overrides in the
  responsive section.
- The layout is mobile-first responsive using a `.container` (max-width
  `var(--maxw)`) wrapper and fl/grid. Keep it responsive.

### JavaScript
- Both scripts are wrapped in an IIFE with `"use strict";`. ES5-style
  (`var`, function expressions) is used throughout — match it for consistency.
- `day-rates.js` persists the calculator state to `localStorage` under the key
  `mpss-day-rate-model-v1`. If you change the state shape incompatibly, bump
  the key version so old saved state doesn't break `load()`.
- Calculator structure: `PRESETS` (tenant library) → `state` (capex, daysYear,
  rows) → `calcRow()` economics → `render()`/`recompute()` DOM updates →
  toolbar wiring → `exportCsv()`. `recompute()` updates only computed cells and
  totals; `render()` rebuilds all rows. Prefer `recompute()` for value edits.

## Content notes

- **Contact email** appears in `index.html` (`stewart.lang@seaways-mpss.com`,
  in the `#contact` section and the hero/nav CTA). Update all occurrences
  together.
- Engineering figures are drawn from Seaways source material — e.g. 15,000 t
  deck payload, 8,100 m² deck, 2M bbl SWIS storage, 37.5 m survival wave,
  ~14-month hull delivery, and LR/ABS/DNV classification approval. Treat these
  as factual claims; don't casually alter them.
- The day-rate calculator numbers are **illustrative placeholders, not quotes**
  — the page says so explicitly. Keep that disclaimer intact if you touch the
  defaults.

## Git & workflow

- Active development branch for AI-assisted work: `claude/claude-md-docs-nlfgo5`.
  Develop, commit, and push there; do not push to `main` without explicit
  permission. Do not open a pull request unless asked.
- Deployment is any static host (GitHub Pages, Netlify, Cloudflare Pages, S3).
  There is no CI/CD configured in the repo.
