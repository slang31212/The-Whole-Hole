# Seaways MPSS

Marketing landing page for **Seaways MPSS** — LANG's **Multi-Purpose Semi-Submersible**,
a validated, standardized deepwater production host built on a five-S design philosophy:
**Simple · Safe · Swift · Size · Saves.** The site positions the MPSS as pre-positioned,
leaseable offshore infrastructure that compresses the timeline from FID to first production.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | The full single-page site (hero, the MPSS, the Five S, specs, the model, heritage, leasing, contact). |
| `day-rates.html` + `day-rates.js` | An editable day-rate leasing model — swap tenants in/out, compare revenue, net and payback; export to CSV. |
| `invest.html` + `invest.js` | **For Family Offices.** An investor page framing the MPSS as a hard, income-producing real asset, with an interactive equity-returns calculator: type in a check size and see ownership, cash yield, IRR, MOIC and payback compute live, plus a year-by-year distribution schedule and CSV export. |
| `memo.html` + `memo.css` | **Founding Investor Memorandum.** A brochure-style, print-friendly memorandum: cover page, numbered sections (opportunity, problem, solution, market, business model, illustrative economics, heritage, founding round & use of proceeds, the ask) and a full disclaimer. Reuses `styles.css`; `memo.css` adds the brochure layer. |
| `styles.css` | All styling. Navy / ocean-blue / steel palette; fully responsive. |
| `main.js`   | Mobile nav toggle and footer year. The site works without JS (the calculators need JS). |

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

- **Contact details** — search `index.html` (and `invest.html`) for `stewart.lang@seaways-mpss.com`
  and update the email; add phone/address in the `#contact` / `#data-room` sections as needed.
- **Investor figures** are illustrative placeholders defined in `defaultState()` in `invest.js`
  (asset cost, leverage, interest, net charter cash flow, hold, residual). Edit there to change the
  defaults; every field is also editable live in the browser. The page carries a clear disclaimer that
  the model is for discussion only and is not an offer of securities.
- **Copy** lives inline in `index.html`, grouped by clearly-commented sections.
- **Founding-round amount** — the memorandum's "The Ask" shows a placeholder `$[__]M`
  (marked `data-illustrative` in `memo.html`). Replace it with the real figure before sharing.
  The use-of-proceeds percentages and milestone phases in the same section are illustrative too.
- Specs, the Five S and the lifecycle/driver tables are hand-built in HTML/CSS (no
  third-party chart images), so they're safe to edit and reuse.
- Key figures (30,000 t payload, 8,100 m² deck, 2M bbl SWIS storage, 37.5 m survival wave,
  ~14-month hull delivery, LR/ABS/DNV design review) and the design heritage are drawn from
  Seaways Engineering source material.
- **Why two payload numbers exist.** Deck payload is **30,000 t+** — that is the figure to
  quote. **15,000 t is the same rating as published in the 1980s**, quoted at 5 m VCG above
  deck and deliberately understated: that audience could barely accept the MPSS at all
  without the upside held to around 25%, and acceptance was hard won. The two numbers are
  one quantity at two levels of conservatism, forty years apart — not two quantities.
- **15,000 t is not hull steel.** The structure is on the order of **10,000 t** for a
  90 × 90 × 57 m envelope. The "hull steel mass" reading was invented in `9bf9c02`'s commit
  message to explain why two `invest.html` instances survived a find-and-replace; those
  lines originally read "deck payload". This error has been made twice — do not make it a
  third time.
- **Classification wording.** The societies reviewed the *design*. Nothing is built, so
  nothing is "classed" and nothing is "certified" — those are terms of art for a
  constructed, surveyed vessel. Copy says "independently reviewed" / "design reviewed"
  throughout, and the scope (primary structure, intact & damaged stability, mooring,
  ballast) is kept because it is accurate and it is the strong part.
