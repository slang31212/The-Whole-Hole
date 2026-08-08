# SoCal Charter Fleet Board

A daily dock-intelligence board for the **open-party and charter sportfishing fleet**
between **Los Angeles Harbor and Oceanside, California** — San Pedro, Long Beach,
Newport Beach, Dana Point and Oceanside.

These are the cattle boats: the counts the fleet posts when it ties up, not private-boat
results. The board answers *is the fleet catching, which landing, and which boat* — and
attaches the age of every number to the number itself.

**Status: alpha, for comment.** See "Open for your sign-off" at the bottom of the board
for the calls that still need a decision.

## The rule that shapes everything

Landings do not report on a schedule. On any given morning some have posted last
night's count, some are three days stale, and some have posted nothing in a week. So:

> **A landing that posts a new count is updated. A landing that posts nothing keeps the
> count it had, and only its age advances.**

The board never blanks a landing for want of fresh data, never fills a gap with an
estimate, and never shows a number without the date it was actually posted. A failed
fetch is therefore indistinguishable from "nothing new" — which is exactly right.

Four guards enforce this in `merge_landing()`:

| Situation | Behaviour |
|---|---|
| Newer count posted | Update `latest`, append to `history` |
| Fetch failed or nothing posted | Hold `latest`, advance the age chip |
| Older count returned | Rejected — a stale scrape can't overwrite fresher data |
| Same date re-posted | No duplicate history row |

## Trip class is not decoration

A 2.5-day boat lands several days of fishing on the date it returns, so it will always
out-score a 5-hour half-day boat on kept-per-angler. **Compare half day to half day.**

This is why one Pierpoint line in the archive reads 18.9 fish per angler — the source
report flags it as a multi-day return. The board handles it three ways: the trend axis
is fitted to single-day trips, multi-day points are drawn above a scale break with their
true value, and the archive baseline excludes them entirely. Per-boat data fixes this
properly, because trip class travels with the boat.

The fleet cards mark long-range boats (full day, overnight, 1.5–2.5 day) in brass, so
the boats that actually reach tuna and dorado read apart from the half-day fleet at a
glance.

## Files

| File | Purpose |
|------|---------|
| `report.json` | The dataset — the single source of truth. Rewritten by the daily job. |
| `template.html` | Page markup, styles and the renderer. `__BOARD_DATA__` and `__FISH_JS__` are the injection points. |
| `fish.js` | The twelve species illustrations, as inline SVG. Inlined at render time. |
| `refresh.py` | Fetch → merge → re-render. The whole pipeline. |
| `index.html` | **Generated.** Self-contained standalone page for GitHub Pages. |
| `artifact.html` | **Generated.** Same page as body-content only, for publishing as an Artifact. |

Both generated files embed the data inline, so the board works from `file://`, from a
static host, and offline. There is no runtime fetch and no external dependency.

## Running it

```bash
python3 refresh.py                 # fetch, merge, re-render
python3 refresh.py --render-only   # re-render from report.json, no network
python3 refresh.py --dry-run       # fetch and report, write nothing
python3 refresh.py --today 2026-08-09
```

`.github/workflows/fishing-board.yml` runs it daily at **06:15 Pacific** and commits
only when the data actually moved. It also accepts a manual `workflow_dispatch` run.

## Four tabs, board first

Everything you need at a glance is on **Board**. The reference material sits behind it
rather than scrolling past it.

**Board**
- **Today's fish** — a tile per species, each with its own illustration and its verified
  count. A species with no verified count says so in words *and* in form: the fish goes
  flat grey. Every tile also names the trip class that reaches that fish.
- **Fleet read** — kept fish per angler across the corridor, banded (excellent / good /
  fair / slow) against an archive baseline computed from single-day reports only. Both
  numbers are derived from the posted counts, not assigned.
- **The read** — where that number comes from and what it's worth.
- **Landing dock totals** — each landing's most recent count with a freshness chip.
- **Archive trend** — kept per angler over the rolling archive.

**Fleet** — 36 boats across 7 landings, each with length, capacity where known, and the
trip classes it runs. This is the roster the per-boat counts will hang off.

**Species guide** — 29 species reported in this corridor, with where they hold, when
they show, and which trip gets you to them.

**Notes** — the open questions, the full report archive (the table view of the trend),
the refresh contract, data limits and marine sources.

## The fish

`fish.js` draws all twelve species as inline SVG — no image files, no external requests.
Each is built from one of eight silhouette families (tuna, jack, mahi, barracuda, bass,
rockfish, flatfish, shark) with per-species proportions, palette and markings, then
inlined into the page at render time so a published board stays self-contained.

They are drawn as **layered plates, not flat shapes**. `plate()` assembles each fish in
a fixed order:

| Layer | What it does |
|---|---|
| `defs` | countershade gradient, scale `<pattern>`, body `clipPath`, blur filter |
| behind | far-side and median fins — translucent membrane carried on rays |
| base | body filled with the countershade gradient |
| clipped | scale field, species markings, dorsal shadow, specular flank band, belly bounce — blurred and clipped to the silhouette, so shading reads as volume |
| outline | fine ink edge |
| front | near pectoral, gill, jaw, eye |

The countershade breaks hard rather than fading (stops at 21% / 31%), which is what makes
a real fish look metallic rather than airbrushed. `P()` takes back / flank / belly / fin /
finlet / outline, plus an `extra` object for `sheen`, `bellyShade`, `band` and `spot`.

**Ceiling note:** this is about as far as hand-authored inline SVG goes. Photographic
realism would need raster art embedded as data URIs, which trades the self-contained,
diff-able, recolourable vector for a binary blob.

These colours are **illustration, not encoding** — they depict the fish. Chart series
colours come from the validated categorical palette and are kept deliberately separate,
so a fish never reads as a data series.

## Data sources

Landing counts come from the nightly report pipeline that emails
`stewart.lang@seaways-mpss.com`, which reads the landings' own count pages via
sportfishingreport.com. Fleet rosters were compiled from the landings' own fleet pages.
Conditions come from NDBC buoys **46222** (San Pedro), **46256** (Long Beach Channel)
and **46224** (Oceanside Offshore) — a fixed-column text feed, which is why they're read
from there rather than from scraped prose.

## Known gaps

- **Per-boat counts are the big one.** The nightly email reports at the *landing* level —
  the whole fleet's day in one line — so the archive has no per-boat split. The roster is
  real; the count beside each boat waits on the scraper reading the by-boat page.
- **The landing parser has not been validated against live markup.** It was written in a
  sandbox that blocks sportfishingreport.com, against the documented page shape. Run the
  workflow manually with `dry_run: true` once and tighten the selectors from the log. A
  parse miss degrades to carry-forward, so a wrong guess costs freshness, never
  correctness.
- **Two rosters unverified.** Newport Landing and Oceanside Sea Center post counts, but
  their boat names could not be confirmed from a source worth trusting, so their cards
  show the gap rather than a guess.
- **Four landings have rosters but no counts** — 22nd Street, LA Waterfront, Long Beach
  Sportfishing and Helgren's. Add their slugs to `LANDING_SOURCES` in `refresh.py`.
- **Conditions are partly unwired.** Tide and moon have no feed yet and show "not
  reported" rather than a guess.
- **The private-boat go/no-go score was dropped.** It weighted whether a small boat could
  safely run from Dana Point, which is the wrong question for an 85-foot party boat. The
  gauge now reads the fleet's own output. Easy to add back alongside if wanted.

## Design notes

- Chart colours come from a categorical palette validated for colour-vision deficiency
  in both light and dark mode. Series identity is always carried by a direct label and
  a legend as well as by hue, never by hue alone.
- The board is theme-aware: it follows the viewer's light/dark setting, and both themes
  were designed and checked rather than inverted.
