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
- **Founding round** — the memorandum is by **Lang Leasing** (Stewart Lang), which leases the MPSS
  designed by **Seaways Engineering** (Craig Lang). "The Ask" shows an indicative **$4–6M** range; the
  use-of-proceeds percentages and milestone phases in that section are illustrative. The memo carries
  visible **DRAFT** markings (ribbon chip + cover badge) — remove them in `memo.html`/`memo.css` when final.
- **Field envelope & storage** — the memo frames the MPSS across the full envelope (marginal shallow-water
  ~65–150 m through deepwater) and states storage as ~300,000 bbl dry above the waterline plus up to 2M bbl
  oil-over-water in the "Big SWIS" lower tank. Origin is credited to the early 1980s with Glasgow validation
  in 1988–89 (Faulkner, Incecik &amp; Lang).
- Specs, the Five S and the lifecycle/driver tables are hand-built in HTML/CSS (no
  third-party chart images), so they're safe to edit and reuse.
- Key figures (15,000 t payload, 8,100 m² deck, 2M bbl SWIS storage, 37.5 m survival wave,
  ~14-month hull delivery, LR/ABS/DNV approval) and the design heritage are drawn from
  Seaways Engineering source material.
