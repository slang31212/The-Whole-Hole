# Floating Wind Platform Counter

A small static web app for tracking floating offshore wind platforms. For each
platform you record:

- **Turbine details** — manufacturer/model, rated capacity (MW), rotor
  diameter, and hub height above water.
- **Floating base details** — substructure type (spar-buoy,
  semi-submersible, tension-leg platform, or barge), displacement, draft,
  mooring system, and water depth.
- **Status** — Operational, Under Construction, or Planned / Announced,
  with an optional source URL for the announcement.

The header shows running totals: number of platforms, combined turbine
capacity, and combined base displacement. The list can be filtered by
status.

## Announced future platforms

On first load the board is seeded with publicly announced floating wind
projects that aren't operational yet, each linked to its source:

- **Green Volt** (ScotWind, North Sea, UK) — semi-submersible, up to 35
  turbines at 10-16 MW each.
- **Salamander** (Peterhead, Scotland, UK) — semi-submersible, 100 MW
  across 6-7 turbines.
- **Erebus** (Celtic Sea, Wales, UK) — WindFloat semi-submersible, 7
  turbines up to 18 MW each, under construction.
- **Firefly / Bandibuli** (Ulsan, South Korea) — semi-submersible (Equinor
  Wind Semi / Ekwil INOC), 54 x 15 MW Siemens Gamesa turbines.

These are seeded once via `localStorage`; remove or edit them like any
other entry.

## Pages

- `index.html` — add, edit, and remove platforms; filter the list by status.
- `dashboard.html` — read-only dashboard with the same running counter,
  a bar chart breakdown by status and by floating base type, and a full
  table of every tracked platform.

Both pages read/write the same `localStorage` data via `data.js`.

## Running it

No build step or dependencies — just open `index.html` in a browser, or serve
the folder with any static file server, e.g.:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Data is stored in the browser's
`localStorage`.

## Add to Home Screen (iPad/iPhone)

The app needs to be served over HTTP(S) (not opened as a `file://` page) for
"Add to Home Screen" to pick up the icon and standalone display mode. In
Safari on iPad: open `index.html` (or `dashboard.html`) from a server, tap
Share, then "Add to Home Screen". It launches full-screen with its own icon,
separate from `index.html` and `dashboard.html` if you add both.

This is a Home Screen app shortcut, not a native iPadOS widget — true
Home Screen/Today-View widgets require native WidgetKit code and can't
read a webpage's `localStorage`, so they're out of scope for a static
site like this one.
