# Floating Wind Platform Counter

A small static web app for tracking floating offshore wind platforms. For each
platform you record:

- **Turbine details** — manufacturer/model, rated capacity (MW), rotor
  diameter, and hub height above water.
- **Floating base details** — substructure type (spar-buoy,
  semi-submersible, tension-leg platform, or barge), displacement, draft,
  mooring system, and water depth.

The header shows running totals: number of platforms, combined turbine
capacity, and combined base displacement.

## Running it

No build step or dependencies — just open `index.html` in a browser, or serve
the folder with any static file server, e.g.:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Data is stored in the browser's
`localStorage`.
