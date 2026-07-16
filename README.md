# Seaways MPSS

Marketing landing page for **Seaways MPSS** — LANG's **Multi-Purpose Semi-Submersible**,
a validated, standardized deepwater production host built on a five-S design philosophy:
**Simple · Safe · Swift · Size · Saves.** The site positions the MPSS as pre-positioned,
leaseable offshore infrastructure that compresses the timeline from FID to first production.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | The full single-page site (hero, the MPSS, the Five S, specs, the model, heritage, leasing, contact). |
| `investment-book.html` | The **MPSS Infrastructure Investment Book** — a modular, family-office-facing pitch built as re-orderable "modules" (the problem, connection certainty, engineering proof / RAOs, motion = money, 20-year economics, the asset we lease, infrastructure economics, eight markets, fleet strategy, the ask). |
| `book.css` | Module styling for the investment book. Extends `styles.css`. |
| `day-rates.html` / `day-rates.js` | Interactive day-rate leasing model. |
| `styles.css` | Shared styling. Navy / ocean-blue / steel palette; fully responsive. |
| `main.js`   | Mobile nav toggle and footer year. The site works without JS. |

## The Investment Book

`investment-book.html` reframes the MPSS from a brochure into an **investment platform**. It is built
as a *library of modules* so the same content can be re-cut for different audiences — the file ships
the family-office ordering (vision → problem → proof → economics → the asset → returns → growth →
fleet → the ask). To retarget it, reorder or drop the `<section>` blocks; each is a self-contained
module with its own chapter marker.

- **Numbers** ($45M hull, $125–500k/day lease, 70+ year life, 12-month build, 10–15 year lease) are
  the pitch figures and live inline in the HTML.
- **RAO comparison** (Ch. 3) uses *illustrative relative values* for MPSS vs. conventional hull forms
  (GVA 4000, Pacesetter, Sedco, Aker H3) — clearly labelled as such. Swap in measured RAOs when
  available by editing the `style="width:…%"` bars and `.rao-val` figures.
- **Savings and economics** are flagged illustrative; the interactive `day-rates.html` model backs the
  day-rate assumptions.

## Running locally

It's a static site — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

Any static host works (GitHub Pages, Netlify, Cloudflare Pages, S3, etc.).
For the `seaways-mpss.com` domain, point the host at this repository / folder.

## Content notes

- **Contact details** — search `index.html` for `stewart.lang@seaways-mpss.com` and update the
  email; add phone/address in the `#contact` section as needed.
- **Copy** lives inline in `index.html`, grouped by clearly-commented sections.
- Specs, the Five S and the lifecycle/driver tables are hand-built in HTML/CSS (no
  third-party chart images), so they're safe to edit and reuse.
- Key figures (15,000 t payload, 8,100 m² deck, 2M bbl SWIS storage, 37.5 m survival wave,
  ~14-month hull delivery, LR/ABS/DNV approval) and the design heritage are drawn from
  Seaways Engineering source material.
