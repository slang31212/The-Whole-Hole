# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

**Seaways MPSS** — a small, dependency-free **static marketing website** for LANG's
_Multi-Purpose Semi-Submersible_ (MPSS), a standardized deepwater production host.
The site pitches the MPSS as pre-positioned, leaseable offshore infrastructure and
includes an interactive day-rate leasing calculator.

There is **no build step, no framework, no package manager, and no backend.** The
whole project is plain HTML, CSS, and vanilla ES5-style JavaScript that runs directly
in the browser. The core marketing pages work even with JavaScript disabled; JS is
strictly progressive enhancement.

> Note: the git repository is named `The-Whole-Hole` / `slang31212/the-whole-hole`,
> but the product and all site content are branded **Seaways MPSS**. Don't rename
> product-facing copy to match the repo name.

## File map

| File | Purpose |
|------|---------|
| `index.html` | The full single-page marketing site: header/nav, hero (inline SVG rig), the MPSS (about), Five S, specs, hull comparison, the model (problem/solution), heritage, leasing, investment ("The Ask", `#invest`), contact, footer. |
| `day-rates.html` | The day-rate leasing calculator page. Shares the header/footer/nav shell with `index.html`. Contains the toolbar, global-assumptions inputs, the results table skeleton, and the comparison-bar container (rows injected by JS). |
| `styles.css` | **All** styling for both pages. Design tokens in `:root`, then clearly-commented sections. Fully responsive; navy / ocean-blue / steel palette. |
| `main.js` | Tiny shared progressive-enhancement script: mobile nav toggle + footer year. Loaded on every page. |
| `day-rates.js` | The calculator logic: state, presets, per-row economics, rendering, totals, comparison bars, CSV export, and `localStorage` persistence. Only loaded on `day-rates.html`. |
| `README.md` | Human-facing project overview, run/deploy notes, and content-editing pointers. |

## Running & deploying

It's a static site — no install, no build.

```bash
# from the repo root
python3 -m http.server 8000
# then visit http://localhost:8000
```

Open `index.html` directly in a browser for a quick look, but **use a local server**
when testing `day-rates.js` so `localStorage` and relative navigation behave normally.

Deploy to any static host (GitHub Pages, Netlify, Cloudflare Pages, S3). No
environment variables or server config are required.

## How to verify a change

There is no test suite or linter. To verify:

1. Serve the folder and load the affected page(s) in a browser.
2. For layout/CSS changes, check both desktop and a narrow/mobile viewport — the
   site is responsive and the mobile nav toggle (`main.js`) must still work.
3. For `day-rates.js` changes, exercise the calculator: add/remove tenants, toggle
   rows on/off, edit day rate / term / utilisation / opex / CAPEX, confirm totals and
   comparison bars update, test **Export CSV**, and confirm **Reset to defaults**.
   State persists across reloads via `localStorage` key `mpss-day-rate-model-v1`.
4. Confirm the marketing pages still render with JavaScript disabled.

## Conventions

- **Vanilla only.** No dependencies, no bundler, no CDN scripts, no CSS/JS frameworks.
  Keep it that way unless the user explicitly asks to add tooling.
- **JS style:** ES5-flavored, wrapped in an IIFE with `"use strict"`, `var` declarations,
  and `function` expressions (see `main.js` / `day-rates.js`). Match this style rather
  than introducing modern module syntax.
- **JS is optional.** Never make core marketing content depend on JavaScript.
  `day-rates.html` is the one page whose interactive table is JS-driven.
- **Styling is centralized.** Put styles in `styles.css`; avoid inline `style=`
  attributes except the few already present. Use the CSS custom properties in `:root`
  (`--navy-900`, `--accent`, `--flare`, `--maxw`, `--radius`, etc.) instead of
  hard-coded colors/values so the palette stays consistent.
- **Section structure.** Both HTML files and `styles.css` use loud
  `<!-- ===== SECTION ===== -->` / `/* ===== SECTION ===== */` comment banners.
  Keep new sections in that pattern; keep related CSS grouped under its banner.
- **Shared shell.** The header/nav and footer are duplicated across `index.html` and
  `day-rates.html`. If you change nav links, the brand, or the footer, **update both
  files** to keep them in sync.
- **Diagrams are hand-built.** The hull illustrations and comparison figures are inline
  SVG in the HTML (no external image assets), so they're safe to edit directly.
- **Calculator data.** Preset tenants and default model values live at the top of
  `day-rates.js` (`PRESETS`, `defaultState()`). Edit those to change illustrative
  defaults. Bump `STORE_KEY` if you make a breaking change to the persisted state
  shape, or old saved state may fail to load.

## Content-editing pointers

- Marketing copy lives inline in `index.html`, grouped by the commented sections.
- Contact email/details are in the `#contact` section of `index.html`
  (search for `stewart.lang@seaways-mpss.com`).
- Key spec figures (payload, deck area, storage, survival wave, delivery time,
  class approvals) and design heritage come from Seaways Engineering source material —
  keep them accurate if editing.
- The investment section (`#invest`) contains **illustrative placeholder figures**
  wrapped in `[brackets]` (e.g. `$[XX]M`, `[XX]%`). These are not real terms and must be
  replaced with defensible numbers before the page is shown to investors; keep the
  "indicative only / not an offer" disclaimer in place.

## Git workflow

- Active development branch for this work: `claude/claude-md-documentation-o6cep8`.
- Develop on the designated feature branch, commit with clear messages, and push with
  `git push -u origin <branch-name>`. Do not push to `main` without explicit permission.
- Do **not** open a pull request unless the user explicitly asks.
