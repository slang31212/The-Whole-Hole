#!/usr/bin/env python3
"""
SoCal Fishing Operations Board — daily refresh.

Pulls the latest dock totals for every landing between Los Angeles Harbor and
Oceanside, folds them into report.json, and re-renders the board.

The governing rule is carry-forward: a landing that posts a new count is
updated; a landing that posts nothing keeps the count it had, and only its age
advances. A failed fetch is therefore indistinguishable from "nothing new" —
which is the behaviour we want. The board never blanks and never invents.

Usage
  python3 refresh.py                 # fetch, merge, render
  python3 refresh.py --render-only   # re-render from report.json, no network
  python3 refresh.py --today 2026-08-09
  python3 refresh.py --dry-run       # fetch and report, write nothing
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
REPORT = HERE / "report.json"
TEMPLATE = HERE / "template.html"
INDEX = HERE / "index.html"
ARTIFACT = HERE / "artifact.html"

UA = "Mozilla/5.0 (compatible; socal-fishing-board/1.0; +https://github.com/slang31212/The-Whole-Hole)"
TIMEOUT = 25

# Landings in the corridor, north to south. `slug` is the sportfishingreport.com
# landing page; a landing with no slug is tracked but not yet scraped.
LANDING_SOURCES = {
    "pierpoint": "pierpoint-landing",
    "oceanside": "oceanside-sea-center",
    "danawharf": "dana-wharf-sportfishing",
    "daveys": "daveys-locker",
    "newport": "newport-landing",
}

# NDBC buoys spanning the corridor, north to south. Realtime2 is a stable
# fixed-column text feed, which is why conditions come from here rather than
# from scraped prose.
BUOYS = [
    ("46222", "San Pedro"),
    ("46256", "Long Beach Channel"),
    ("46224", "Oceanside Offshore"),
]

MISSING = {"MM", "999", "99.0", "999.0", "9999.0"}


# --------------------------------------------------------------------------
# fetch helpers
# --------------------------------------------------------------------------

def get(url: str) -> str | None:
    """Fetch a URL, returning None on any failure. Failure means 'nothing new'."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as e:
        print(f"  ! fetch failed {url}: {e}", file=sys.stderr)
        return None


def strip_tags(html: str) -> str:
    html = re.sub(r"(?is)<(script|style).*?</\1>", " ", html)
    html = re.sub(r"(?i)<br\s*/?>", "\n", html)
    html = re.sub(r"(?i)</(tr|div|p|li|h\d)>", "\n", html)
    html = re.sub(r"(?i)</t[dh]>", " | ", html)
    html = re.sub(r"<[^>]+>", " ", html)
    html = (html.replace("&nbsp;", " ").replace("&amp;", "&")
                .replace("&#39;", "'").replace("&quot;", '"')
                .replace("&lt;", "<").replace("&gt;", ">"))
    html = re.sub(r"[ \t]+", " ", html)
    return "\n".join(ln.strip() for ln in html.split("\n") if ln.strip())


# --------------------------------------------------------------------------
# landing counts
# --------------------------------------------------------------------------

MONTHS = {m: i for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july",
     "august", "september", "october", "november", "december"], 1)}

DATE_PATTERNS = [
    re.compile(r"(\d{1,2})/(\d{1,2})/(\d{4})"),
    re.compile(r"(\d{4})-(\d{2})-(\d{2})"),
    re.compile(r"([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})"),
]


def parse_date(text: str, year_hint: int) -> str | None:
    for pat in DATE_PATTERNS:
        m = pat.search(text)
        if not m:
            continue
        a, b, c = m.groups()
        try:
            if pat.pattern.startswith(r"(\d{4})"):
                return f"{int(a):04d}-{int(b):02d}-{int(c):02d}"
            if a.isalpha():
                mo = MONTHS.get(a.lower())
                if not mo:
                    continue
                return f"{int(c):04d}-{mo:02d}-{int(b):02d}"
            return f"{int(c):04d}-{int(a):02d}-{int(b):02d}"
        except ValueError:
            continue
    return None


COUNT_RE = re.compile(
    r"(\d+)\s+(?:anglers?)\b(.{0,400})", re.IGNORECASE | re.DOTALL)
KEPT_RE = re.compile(r"(\d+)\s+(?:fish\s+)?kept\b", re.IGNORECASE)
RELEASED_RE = re.compile(r"(\d+)\s+(?:fish\s+)?released\b", re.IGNORECASE)


def scrape_landing(slug: str, year_hint: int) -> dict | None:
    """
    Return {"date","anglers","kept","released"} for the landing's most recent
    posted count, or None if nothing parseable was found.

    NOTE: this parser is written against the documented shape of the landing
    pages ("<date> ... N anglers ... N fish kept ... N released"). It has not
    yet been validated against live markup — the sandbox this was authored in
    blocks the host. Because a parse miss falls through to carry-forward, a
    wrong guess degrades to "no new data", never to bad data. Validate on the
    first live run and tighten the selectors then.
    """
    url = f"https://www.sportfishingreport.com/landings/{slug}.php"
    html = get(url)
    if not html:
        return None
    text = strip_tags(html)

    best: dict | None = None
    for block in re.split(r"\n(?=[A-Z0-9])", text):
        date = parse_date(block, year_hint)
        if not date:
            continue
        m = COUNT_RE.search(block)
        if not m:
            continue
        anglers = int(m.group(1))
        tail = m.group(2)
        kept_m = KEPT_RE.search(tail) or KEPT_RE.search(block)
        if not kept_m or anglers <= 0:
            continue
        rel_m = RELEASED_RE.search(tail) or RELEASED_RE.search(block)
        rec = {
            "date": date,
            "anglers": anglers,
            "kept": int(kept_m.group(1)),
            "released": int(rel_m.group(1)) if rel_m else None,
        }
        if best is None or rec["date"] > best["date"]:
            best = rec
    return best


# --------------------------------------------------------------------------
# NDBC conditions
# --------------------------------------------------------------------------

def scrape_buoy(station: str) -> dict | None:
    """Parse the newest non-missing observation from an NDBC realtime2 feed."""
    txt = get(f"https://www.ndbc.noaa.gov/data/realtime2/{station}.txt")
    if not txt:
        return None
    lines = [ln for ln in txt.splitlines() if ln and not ln.startswith("#")]
    if not lines:
        return None
    cols = lines[0].split()
    if len(cols) < 15:
        return None

    def val(i, cast=float):
        if i >= len(cols) or cols[i] in MISSING:
            return None
        try:
            return cast(cols[i])
        except ValueError:
            return None

    wspd, gst, wvht = val(6), val(7), val(8)
    atmp, wtmp = val(13), val(14)
    try:
        obs = dt.datetime(int(cols[0]), int(cols[1]), int(cols[2]),
                          int(cols[3]), int(cols[4]), tzinfo=dt.timezone.utc)
    except (ValueError, IndexError):
        obs = None

    return {
        "station": station,
        "observedAt": obs.isoformat() if obs else None,
        "windKt": round(wspd * 1.94384, 1) if wspd is not None else None,
        "gustKt": round(gst * 1.94384, 1) if gst is not None else None,
        "waveFt": round(wvht * 3.28084, 1) if wvht is not None else None,
        "airF": round(atmp * 9 / 5 + 32, 1) if atmp is not None else None,
        "waterF": round(wtmp * 9 / 5 + 32, 1) if wtmp is not None else None,
        "windDirDeg": val(5, int),
    }


def compass(deg: int | None) -> str:
    if deg is None:
        return ""
    pts = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
           "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return pts[int((deg % 360) / 22.5 + 0.5) % 16]


def apply_conditions(data: dict, obs: list[dict]) -> int:
    """Fill the conditions rail from buoy observations. Returns fields updated."""
    live = [o for o in obs if o]
    if not live:
        return 0

    def first(key):
        for o in live:
            if o.get(key) is not None:
                return o[key], o["station"]
        return None, None

    water, water_st = first("waterF")
    air, air_st = first("airF")
    wave, wave_st = first("waveFt")
    wind, wind_st = first("windKt")
    wdir, _ = first("windDirDeg")

    updates = {
        "water": (f"{water:.1f}" if water is not None else None, "°F", water_st),
        "air":   (f"{air:.0f}" if air is not None else None, "°F", air_st),
        "swell": (f"{wave:.1f}" if wave is not None else None, "FT", wave_st),
    }
    if wind is not None:
        updates["wind"] = (f"{compass(wdir)} {wind:.0f}".strip(), "KT", wind_st)

    n = 0
    for cond in data["conditions"]:
        if cond["key"] in updates:
            value, unit, station = updates[cond["key"]]
            if value is None:
                continue
            cond["value"] = value
            cond["unit"] = unit
            cond["state"] = "reported"
            cond["note"] = f"NDBC buoy {station}"
            n += 1
    if n:
        stations = ", ".join(f"{s} {name}" for s, name in BUOYS)
        data["conditionsSource"] = {
            "asOf": dt.datetime.now(dt.timezone.utc).date().isoformat(),
            "text": ("Wind, seas, air and water temperature are the newest non-missing "
                     f"observations from NDBC buoys {stations}. Fields still marked "
                     "not reported have no feed wired yet and have not been inferred."),
        }
    return n


# --------------------------------------------------------------------------
# merge
# --------------------------------------------------------------------------

def merge_landing(entry: dict, fresh: dict | None) -> bool:
    """Fold a scraped count into a landing. Returns True if anything changed."""
    if not fresh:
        return False
    if fresh["date"] <= entry["latest"]["date"]:
        return False

    entry["latest"] = {
        "date": fresh["date"],
        "anglers": fresh["anglers"],
        "kept": fresh["kept"],
        "released": fresh["released"],
        # The adjusted score is the upstream nightly report's own freshness
        # weighting. Recomputing it here would invent a number, so it is
        # cleared until the next nightly report supplies one.
        "adjScore": round(fresh["kept"] / fresh["anglers"], 2) if fresh["anglers"] else 0.0,
    }
    if not any(h["date"] == fresh["date"] for h in entry["history"]):
        entry["history"].append({
            "date": fresh["date"], "anglers": fresh["anglers"],
            "kept": fresh["kept"], "released": fresh["released"], "flag": None,
        })
        entry["history"].sort(key=lambda h: h["date"])
        del entry["history"][:-14]          # keep a rolling fortnight
    return True


def refresh(data: dict, today: str) -> list[str]:
    changed: list[str] = []
    year = int(today[:4])

    print("Fetching landing counts…")
    for entry in data["landings"]:
        slug = LANDING_SOURCES.get(entry["id"])
        if not slug:
            continue
        fresh = scrape_landing(slug, year)
        if merge_landing(entry, fresh):
            changed.append(entry["name"])
            print(f"  + {entry['name']}: new count for {fresh['date']}")
        else:
            age = (dt.date.fromisoformat(today)
                   - dt.date.fromisoformat(entry["latest"]["date"])).days
            print(f"  = {entry['name']}: holding {entry['latest']['date']} ({age}d old)")

    print("Fetching buoy conditions…")
    obs = [scrape_buoy(s) for s, _ in BUOYS]
    n = apply_conditions(data, obs)
    if n:
        changed.append(f"conditions ({n} fields)")
        print(f"  + conditions: {n} fields updated")
    else:
        print("  = conditions: no buoy data, holding")

    return changed


def restamp(data: dict, today: str, changed: list[str]) -> None:
    data["meta"]["today"] = today
    data["meta"]["renderedAt"] = dt.datetime.now().astimezone().isoformat(timespec="seconds")
    data["meta"]["newDataToday"] = bool(changed)
    data["meta"]["carryForward"] = (
        "Updated today: " + ", ".join(changed) + ". Every other landing keeps its last "
        "posted count, with its age advanced."
        if changed else
        f"No landing posted a new count for {dt.date.fromisoformat(today).strftime('%B %-d')}. "
        "The board is holding the previous report unchanged — every number below still "
        "carries the date it was actually posted."
    )

    dates = sorted({h["date"] for L in data["landings"] for h in L["history"]})
    data["meta"]["archiveDates"] = dates[-10:]

    n = len(dates)
    data["meta"]["trendStatus"] = (
        f"The rolling archive holds {n} verified report date{'s' if n != 1 else ''}. "
        + ("A valid 30-day trend is not yet available." if n < 30
           else "Showing the most recent 10 report dates.")
    )


# --------------------------------------------------------------------------
# render
# --------------------------------------------------------------------------

def render(data: dict) -> None:
    body = TEMPLATE.read_text(encoding="utf-8").replace(
        "__BOARD_DATA__",
        json.dumps(data, ensure_ascii=False).replace("</", "<\\/"),
    )
    ARTIFACT.write_text(body, encoding="utf-8")
    INDEX.write_text(
        '<!doctype html>\n<html lang="en">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<meta name="description" content="Daily dock intelligence for private-boat '
        'fishing between Los Angeles Harbor and Oceanside, California.">\n'
        + body + "\n</body>\n</html>\n",
        encoding="utf-8",
    )
    print(f"Rendered {INDEX.name} and {ARTIFACT.name}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--render-only", action="store_true",
                    help="re-render from report.json without fetching")
    ap.add_argument("--dry-run", action="store_true",
                    help="fetch and report, but write nothing")
    ap.add_argument("--today", default=dt.date.today().isoformat(),
                    help="board date, YYYY-MM-DD")
    args = ap.parse_args()

    data = json.loads(REPORT.read_text(encoding="utf-8"))

    if args.render_only:
        render(data)
        return 0

    changed = refresh(data, args.today)
    restamp(data, args.today, changed)

    if args.dry_run:
        print("\n[dry run] " + (", ".join(changed) if changed else "nothing changed"))
        return 0

    REPORT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    render(data)
    print("\n" + (f"Updated: {', '.join(changed)}" if changed
                  else "No new data — previous report held."))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
