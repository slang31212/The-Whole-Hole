# SoCal Fishing — Private Boat Operations

A chartplotter-style marine dashboard for Southern California private-boat fishing.
Everything is rendered from a local dataset on an HTML5 canvas — no external tiles or
libraries — so the page works fully offline.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The dashboard shell — header, conditions strip, map, and all side panels. |
| `styles.css` | Dark chartplotter theme (navy / ocean, fully responsive). |
| `data.js`    | The dataset: real SoCal coordinates, catch / bait / fuel / temp feeds, conditions. |
| `app.js`     | Canvas chartplotter renderer + all interaction logic. |

## Features

- **Chartplotter map** with bathymetry contours (marching-squares iso-lines), coastline
  and Catalina, harbor / launch anchors, bait receivers and recent-catch markers.
- **Layer toggle** — Chart / Satellite / SST / Chlorophyll base layers, plus Currents,
  Wind and Bait-Log overlays. Drag to pan, scroll or ± to zoom; live lat/lon + SST readout.
- **SST & chlorophyll overlays** with matching legends and a scale bar in nautical miles.
- **Should I Go?** — a Good-Day score computed from wind, swell, water temp, bite momentum,
  visibility and pressure (see the ⓘ for the weighting).
- **Best private-boat play** — distance, bearing and confidence to a search area derived
  from landing reports and water temperature (a search area, not exact fishing coordinates).
- **Trip planner** — pick a boat, cruise speed, fuel price and fishing hours; get round-trip
  distance, fuel needed, cost and usable range live, with a full trip summary.
- **Regional bite, bait-barge status, fuel prices, water-temp stations and wind / swell forecast.**
- **GPX waypoint export** and **copy coordinates** (DDM + decimal) for the recommended play.
- **Harbor / Best-Play / Bait-Barge nav buttons** that fly the map to each feature, plus a
  small live Pacific-time clock and sun / tide / moon almanac.

## Running locally

Static site — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/socal-fishing/
```

## Notes

- Data figures are illustrative placeholders modeled on the feeds a production build would
  pull (NOAA / NDBC / Copernicus / SportfishingReport / GasBuddy / local bait reports).
  Edit them in `data.js`.
- The landing reports are the catch-intelligence backbone. The best play and hotspots are
  framed as **search areas, not exact fishing coordinates** — that language is carried
  through the play card, the trip summary and the GPX export.
