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
| `styles.css` | All styling. Navy / ocean-blue / steel palette; fully responsive. |
| `main.js`   | Mobile nav toggle and footer year. The site works without JS (the calculators need JS). |

## SoCal Fishing — Private Boat Operations

A separate, self-contained app also lives in this repo: a chartplotter-style marine
dashboard for Southern California private-boat fishing. Open `socal-fishing.html`.

| File | Purpose |
|------|---------|
| `socal-fishing.html` | The dashboard shell — header, conditions strip, map, and all side panels. |
| `socal-fishing.css`  | Dark chartplotter theme (navy / ocean, fully responsive). |
| `socal-fishing.data.js` | The dataset: real SoCal coordinates, catch/bait/fuel/temp feeds, conditions. |
| `socal-fishing.js`   | Canvas chartplotter renderer + all interaction logic. |

Everything is rendered from the dataset on an HTML5 canvas — no external tiles or
libraries — so the page works fully offline. Features:

- **Chartplotter map** with bathymetry contours (marching-squares iso-lines), coastline
  and Catalina, harbor/launch anchors, bait receivers and recent-catch markers.
- **Layer toggle** — Chart / Satellite / SST / Chlorophyll base layers, plus Currents,
  Wind and Bait-Log overlays. Drag to pan, scroll or ± to zoom; live lat/lon + SST readout.
- **SST & chlorophyll overlays** with matching legends and a scale bar in nautical miles.
- **Should I Go?** — a Good-Day score computed from wind, swell, water temp, bite momentum,
  visibility and pressure (see the ⓘ for the weighting).
- **Best private-boat play** — distance, bearing and confidence to a search area derived
  from landing reports and water temperature (a search area, not exact fishing coordinates).
- **Trip planner** — pick a boat, cruise speed, fuel price and fishing hours; get round-trip
  distance, fuel needed, cost and usable range live, with a full trip summary.
- **Regional bite, bait-barge status, fuel prices, water-temp stations and wind/swell forecast.**
- **GPX waypoint export** and **copy coordinates** (DDM + decimal) for the recommended play.
- **Harbor / Best-Play / Bait-Barge nav buttons** that fly the map to each feature, plus a
  small live Pacific-time clock and sun/tide/moon almanac.

Data figures are illustrative placeholders modeled on the feeds a production build would
pull (NOAA / NDBC / Copernicus / SportfishingReport / GasBuddy / local bait reports); edit
them in `socal-fishing.data.js`.

## Running locally

Both sites are static — open the relevant `.html` in a browser, or serve the folder:

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
- Specs, the Five S and the lifecycle/driver tables are hand-built in HTML/CSS (no
  third-party chart images), so they're safe to edit and reuse.
- Key figures (15,000 t payload, 8,100 m² deck, 2M bbl SWIS storage, 37.5 m survival wave,
  ~14-month hull delivery, LR/ABS/DNV approval) and the design heritage are drawn from
  Seaways Engineering source material.
