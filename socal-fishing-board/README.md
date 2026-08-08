# SoCal Fishing Operations Board

A daily dock-intelligence board for private-boat fishing between **Los Angeles Harbor
and Oceanside, California** — Long Beach, Huntington Beach, Newport Beach, Dana Point
and Oceanside.

It answers one question at the top of the page — *should I go, and where* — and then
shows the evidence behind the answer, with the age of every number attached to it.

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

Three guards enforce this in `merge_landing()`:

| Situation | Behaviour |
|---|---|
| Newer count posted | Update `latest`, append to `history` |
| Fetch failed or nothing posted | Hold `latest`, advance the age chip |
| Older count returned | Rejected — a stale scrape can't overwrite fresher data |
| Same date re-posted | No duplicate history row |

## Files

| File | Purpose |
|------|---------|
| `report.json` | The dataset — the single source of truth. Rewritten by the daily job. |
| `template.html` | Page markup, styles and the renderer. `__BOARD_DATA__` is the injection point. |
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

## What's on the board

- **Today's call** — the Should I Go score, carried from the last nightly report with
  its age stated, plus the run plan and the score's recent history.
- **Corridor totals** — landings reporting, anglers, fish kept and released, kept per
  100 anglers. Labelled as a composite, because it pools landings whose reports span
  several days.
- **Target species signals** — verified counts where a landing posted a species
  breakdown; an explicit "no count posted" everywhere else.
- **Port performance** — each landing's most recent count with a freshness chip.
- **Archive trend** — kept per angler over the rolling archive, with a table-view twin.
- **Species reference** — 29 species actually reported in this corridor, with where
  they hold and when they show.

## Data sources

Landing counts come from the nightly report pipeline that emails
`stewart.lang@seaways-mpss.com`, which in turn reads the landings' own count pages via
sportfishingreport.com. Conditions come from NDBC buoys **46222** (San Pedro), **46256**
(Long Beach Channel) and **46224** (Oceanside Offshore) — a fixed-column text feed,
which is why they're read from there rather than from scraped prose.

## Known gaps

- **The landing parser has not been validated against live markup.** It was written in
  a sandbox that blocks sportfishingreport.com, against the documented page shape. Run
  the workflow manually with `dry_run: true` once and tighten the selectors from the
  log. A parse miss degrades to carry-forward, so a wrong guess costs freshness, never
  correctness.
- **Five of the ten corridor landings have no history yet** — 22nd Street, LA
  Waterfront, Long Beach Sportfishing, Huntington Beach Sportfishing and Helgren's are
  listed but not yet scraped. Add their slugs to `LANDING_SOURCES` in `refresh.py`.
- **Species counts are thin.** Only one landing in the archive has ever posted a
  species-level breakdown. Per-species trends need the scraper to pull species rows,
  not just totals.
- **Conditions are partly unwired.** Tide and moon have no feed yet and show "not
  reported" rather than a guess.

## Design notes

- Chart colours come from a categorical palette validated for colour-vision deficiency
  in both light and dark mode. Series identity is always carried by a direct label and
  a legend as well as by hue, never by hue alone.
- A multi-day trip lands several days of fishing on the date it returns, so its
  kept-per-angler is not comparable to a half-day boat's. The trend axis is fitted to
  single-day trips and multi-day points are drawn above a break with their true value
  spelled out — never rescaled away, never silently dropped.
- The board is theme-aware: it follows the viewer's light/dark setting, and both themes
  were designed and checked rather than inverted.
