# MPSS × Renewables — Promotion Plan

*A plan to promote the Seaways MPSS into offshore renewables and the wider energy
transition, built from what is already in this repository.*

> **Superseded in two places — do not execute as written.**
>
> **§6.1 is wrong.** There is no payload contradiction. Deck payload is 30,000 t; the
> 15,000 t figures in `invest.html` are *hull steel mass*, deliberately left that way in
> `9bf9c02`. Only `README.md` was stale, and it has been corrected.
>
> **§3 overstates the wind case.** A full IEA-15-240-RWT is roughly 2,000–2,500 t against
> a 30,000 t deck. Wind is a light-duty loadout for a hull sized around dry trees, SCRs
> and 2M bbl of storage — so the renewables argument is *headroom*, not capability, and it
> sits inside the oil and gas story rather than beside it. The positioning in §3 needs
> rebuilding on that basis before any of §5 is built.
>
> The claim-accuracy work in §6.2–6.5 has been done — see the class-wording pass across
> `index.html`, `invest.html`, `memo.html` and `README.md`.

---

## 1. The read — what we actually have

### 1.1 The asset

| | |
|---|---|
| Deck | 90 × 90 m, 8,100 m², box-girder flat plate, no trusses, no bracing |
| Columns | Four, 15 × 15 m in plan, unbraced, centres 7.5 m in from each deck edge (75 × 75 m spacing) |
| Pontoon | One continuous square ring, 15 m wide × 9 m deep |
| Draft | Single 27 m operating draft — no survival-draft change |
| Air gap | 20 m of clear water under the deck on station |
| Payload | 30,000 t on the main site / 15,000 t on the investor page — **unresolved, see §6** |
| Motion | Ring pontoon at 27 m sees ~40% of surface wave height — very low heave |
| Survival | Tested to a 37.5 m (123 ft) wave, no water on deck, broken-mooring survival |
| Build | ~14-month hull, panel-line series production in standard mild steel |
| Class | Lloyd's Register, ABS and DNV review — structure, stability, mooring, ballast |
| Storage | Up to 2M bbl in the SWIS configuration |

### 1.2 The renewables story that already exists

It is real, it is engineered, and it is almost entirely invisible to a visitor.

**The load path.** The turbine tower centreline sits 7.5 m in from both adjacent
deck edges. Because the corner columns are 15 m square, that offset puts the
tower *exactly on the column centreline* — the machine loads straight down a
column into the ring pontoon, not into a deck span. The modelled machine is the
IEA-15-240-RWT (NREL/DTU reference): 240 m rotor, 117 m blades, 150 m hub,
tower tapering 10 m → 6.5 m. This is documented in `render/README.md` and
verifiable from the scene model.

**The build sequence.** The deck box is built, loaded and commissioned at quay
level, its underside 0.35 m above the water, with modules rolled on by SPMT over
a ramp. The hull is floated under it *last* and deballasts to take the load. No
heavy-lift vessel, no floating sheerleg, no offshore lift. The honest version of
the claim — already written down in `render/mpssdeckloadingscenes.md` — is that
erecting a 15 MW machine still needs a tall crane; what the quay-level deck
removes is the extra ~25–30 m of hook height and the afloat lift over a
deep-draft floater.

**The four-mission loadout.** One deck carries, simultaneously: a 15 MW turbine
on the NW column, a data centre of containers stacked three high on the NE, a
CO₂ compression and injection train on the SW, and containerised BESS plus power
conversion on the SE — with the deck centre left open as a roll-on corridor and
30–40% of the deck deliberately empty.

**The commercial frame.** `day-rates.js` already carries renewables tenants as
presets: offshore wind install ($180k/day), data centre ($220k), power
generation ($160k), CCS ($200k), green hydrogen ($210k). All illustrative.

### 1.3 Where it lives today

| Where renewables actually appears | Weight |
|---|---|
| `index.html` — one figure caption + one image alt on the deck-loadout plate | Buried at the bottom of a dark specs section |
| `index.html` — the four-missions strip in the Leasing section | Caption only, no copy |
| `memo.html` — one bullet, "The energy transition", in §04 Market | One sentence |
| `invest.html` — "power, compression, CCS, hydrogen, data centres" in a list | One clause |
| `day-rates.js` — five renewables tenant presets | Behind a calculator, unlabelled |
| `render/` — 10 renders + a working raytracer that can generate more | Not surfaced as a story |

---

## 2. The problem

**The site sells a deepwater oil host. The renewables case is the strongest thing
in the repository and it is invisible.**

Concretely:

- The word "wind" appears in the body copy of `index.html` **zero** times. It
  appears twice in image `alt` text and once in a caption.
- The `<title>`, meta description and OG tags are 100% oil & gas — "deepwater
  production host", "first oil". A floating-wind developer searching for
  anything will never find this page, and if they land on it they will bounce
  before the fold.
- Navigation has nine entries. None of them is renewables, energy transition,
  wind, CCS, or data centres.
- The "kill zone" narrative — Select → Define/FEED → FID → First Production — is
  an oil development lifecycle. A wind developer's gauntlet is different
  (seabed lease → consent → CfD/PPA auction → FID → COD) and we say nothing
  about it.
- Every economic figure on the site is anchored to first oil. The day-rate
  calculator defaults to an FPSO tenant.

The asset is multi-purpose. The marketing is single-purpose.

---

## 3. The claim

One sentence, and everything else supports it:

> **The MPSS is not a floating wind foundation. It is a series-built energy host
> that carries a 15 MW turbine *and* three more revenue-earning payloads on one
> hull, one mooring and one export route — assembled and commissioned alongside
> a quay before it ever goes to sea.**

This matters because it side-steps the fight we would lose. Against WindFloat,
Hywind or TetraSpar as a single-turbine foundation, we are competing on
$/MW of steel — a race to the bottom against platforms with installed operating
hours. As a **multi-payload host**, there is no direct comparator, and the
question changes from "is your foundation cheaper?" to "what else can this
mooring earn?"

### Three proof pillars

**A — The load path is the argument.**
The turbine goes over a 15 m column into a continuous ring pontoon, not over a
deck span. We have the geometry, the reference machine and the render. This is
the single most technically credible thing we own, and it takes 20 seconds to
explain to a naval architect.

**B — The build happens at the quay, and mating is last.**
Deck built, loaded, bolted down and commissioned at quay level. Hull floated
under it afterwards. This is the schedule and risk argument: work that normally
happens offshore, on a weather window, happens on concrete.

**C — One mooring, four revenues.**
Wind + BESS + CCS + data centre on one deck, with 30–40% still empty. The
day-rate model already stacks tenants; it just isn't framed this way. This is
the argument that a family office or an infra fund can actually underwrite,
because it de-risks single-offtake exposure.

**Supporting, in this order:** low motion (40% of surface wave at 27 m draft,
20 m air gap, effectively motionless in sub-12 m seas — which is a *turbine
availability and cable fatigue* argument, not just a comfort one) · classed by
LR/ABS/DNV · 14-month series hull · redeployable, so residual value doesn't die
with one lease area.

---

## 4. Audiences, and the question each one actually asks

| Audience | The question they ask | What we lead with |
|---|---|---|
| **Floating wind developers** (lease-area holders, JV consortia) | "Does this beat a semi-sub foundation on $/MW and can I consent it?" | Reframe: don't sell a foundation. Sell the hub — one mooring, one cable, multiple payloads, so the wind economics stop carrying the whole project alone. Pillar C then A. |
| **Turbine OEMs** (nacelle and tower engineering) | "What are the tower-base loads, heel and nacelle accelerations?" | Pillar A, then the motion data. This audience will not move without a naval-architecture note — see §6. |
| **Hyperscalers / offshore data centre developers** | "Where does the power come from, how do I cool it, and what's the latency route?" | Co-located generation + BESS + seawater cooling on the same deck. This is the highest-intent audience we have and the least contested. |
| **CCS and hydrogen developers** | "Can I put a compression train offshore without a bespoke platform?" | Pillar B (quay commissioning of process plant) + the classed hull. |
| **Shipyards** (the build partner) | "Is this repeat work?" | Series production, panel line, standard mild steel, uniform box. The `hulls-in-series` render *is* the pitch. |
| **Infra funds & family offices** | "Is the income contracted and is the residual real?" | Already served by `invest.html` and `memo.html` — but both currently under-sell the multi-tenant revenue stack. Add it. |
| **Ports & national agencies** | "Does this create local assembly work?" | Quay-level integration means the value-add lands in *their* port, not on a foreign heavy-lift vessel. |

---

## 5. What to build

Prioritised. Tier 1 is the minimum before any outreach starts — sending traffic
to the current site would waste the outreach.

### Tier 1 — Make the site answerable (target: 2 weeks)

1. **`renewables.html`** — a dedicated landing page, same design system, built
   around the three pillars. Structure:
   hero (the one-sentence claim) → the load path (turbine-erection plate,
   labelled) → the quay-level build sequence (hulls-in-series → deck-on-quay →
   loading → wet mating) → one deck, four payloads (the labelled loadout plate)
   → the energy-hub revenue stack → "not a foundation" comparison table →
   contact. Every image already exists.
2. **Navigation** — add "Renewables" to the nav in `index.html`,
   `invest.html`, `day-rates.html` and `memo.html`.
3. **SEO / OG** — new title, description and OG tags on the new page targeting
   *floating offshore wind platform*, *offshore energy hub*, *floating
   substation*, *offshore data centre platform*, *floating CCS platform*.
   Add a renewables clause to the `index.html` description.
4. **Hero copy on `index.html`** — one line and one stat that acknowledges the
   asset is multi-mission. Currently the hero is oil-only.
5. **Day-rate model** — add an "Energy hub" preset stack (wind + BESS + data
   centre + CCS as a single default scenario) and a mode that shows the four
   payloads as concurrent tenants on one hull rather than sequential leases.
   This is the numeric expression of Pillar C and it is a small change to
   `day-rates.js`.
6. **Fix the payload contradiction** (§6.1) before anything is promoted.

### Tier 2 — The proof pack (target: weeks 3–6)

7. **"Foundation vs. energy host" comparison** — a matrix in the same visual
   language as the existing hull-comparison section: single-turbine semi-sub
   foundation vs. spar vs. MPSS energy host, across turbines per mooring,
   additional payload capacity, assembly method, offshore lift required,
   redeployability, second life. This is the page a developer forwards
   internally.
8. **A two-page PDF** for outreach — pillars A/B/C, the labelled loadout plate,
   the specs table, contact. Print-friendly, from the `memo.css` brochure layer.
9. **The naval-architecture note** (§6.3) — the single hardest blocker on
   technical credibility. Heel under rated thrust, nacelle acceleration, tower
   base loads and watch circle. Until this exists, every OEM and developer
   conversation stops at the same question.
10. **Energy-hub economics one-pager** — the stacked day-rate case with the
    revenue diversification argument written out, for the infra-fund audience.

### Tier 3 — New renders (the pipeline already exists)

11. **On station, operating** — turbine turning, BESS and data centre live,
    export cable and J-tube visible, supply vessel alongside. Scene 7 exists;
    this variant adds the *electrical* story that is currently missing.
12. **Silhouette comparison plate** — MPSS energy host beside a single-turbine
    floating foundation at the same scale and camera. Deadpan, catalogue style,
    the way Scene 8 works. This one image carries the whole repositioning.
13. **O&M / walk-to-work** — a CTV or SOV alongside in a 3–4 m sea with the
    platform visibly still. The availability argument, drawn.

---

## 6. Claim hygiene — fix before promoting

Non-negotiable. This audience contains naval architects, and one wrong number
ends the conversation.

**6.1 The payload contradiction.** `index.html` and `memo.html` say **30,000 t**
deck payload in five places. `invest.html` and the root `README.md` say
**15,000 t** in three. One of these is wrong and both are load-bearing claims.
Resolve against the Seaways Engineering source material and correct every
instance. *This must be settled before the first outreach email.*

**6.2 What the class approvals cover.** LR, ABS and DNV reviewed the hull —
primary structure, intact and damaged stability, mooring and ballast. They did
**not** approve a 15 MW turbine loadout. The site must never imply otherwise.
Correct framing: *"the hull is classed; the wind configuration is a topside
package on a classed hull."* Anyone qualified will check, and getting caught
overstating class costs more than the claim is worth.

**6.3 Turbine-specific behaviour is not yet evidenced.** We have heave and
survival-wave data for a production host. A 15 MW machine with a 150 m hub adds
rated thrust at height — heel, nacelle acceleration and tower-base fatigue.
Nothing in this repository addresses it. Either commission the note (§5.9) or
say plainly on the page that the wind configuration study is in progress. Do
not fill the gap with the oil-host motion numbers.

**6.4 Day rates are illustrative.** They already carry a disclaimer in the
calculator. Any renewables page reusing them needs the same disclaimer at the
same prominence.

**6.5 "14 months" is a hull, not a project.** Fourteen months is hull delivery.
It is not time to first power, which includes deck build, loadout, mating,
tow, hook-up and commissioning. State the whole sequence or state the scope.

**6.6 The turbine offset is real but hard to see.** `render/README.md` is
candid that the existing frames foreshorten the 7.5 m inset to ~25 px. If Pillar
A is the lead argument, it deserves a frame that actually sells it — shot square
onto the corner — or a simple plan-view diagram beside the photo. A diagram is
cheaper and clearer than another render.

---

## 7. Sequence

### Phase 0 — Foundation (weeks 1–2)
Tier 1 items. Resolve §6.1. Nothing goes out until `renewables.html` is live and
the payload figure is one number.

### Phase 1 — Proof and direct outreach (weeks 3–6)
Tier 2 proof pack. Then direct, named outreach — not broadcast:
- **Floating wind developers** holding lease areas in deep basins where fixed
  bottom is impossible (Celtic Sea, Gulf of Maine, California, Ulsan, Med).
  Pitch the hub, not the foundation.
- **Offshore data centre developers and hyperscaler infrastructure teams** —
  the least contested and highest-intent audience. Lead with co-located
  generation and cooling.
- **Shipyards** with panel-line capacity and no floating-wind product. They are
  a channel, not just a supplier: a yard that adopts the design promotes it.
- **Ports and regional development agencies** in floating-wind regions, on the
  local-assembly argument.

Each of these is a warm, specific email plus the two-page PDF — twenty good
emails, not two thousand.

### Phase 2 — Visibility (weeks 7–12)
- **Conference presence**, chosen for floating wind and offshore energy
  specifically rather than oil & gas. Verify current dates and CFP deadlines
  before committing — a technical paper on quay-level integration of a
  multi-payload host is a stronger entry than a booth.
- **A technical article** on the load path and quay-level assembly, placed in
  offshore/renewables trade press. The engineering is genuinely novel; write it
  as engineering, not as marketing.
- **LinkedIn**, using the renders. The four-loadouts strip and the labelled
  deck plate are strong visual assets and this industry reads LinkedIn. One
  post per pillar, spaced, each ending at `renewables.html`.
- **The heritage angle** — 1980 origin, Faulkner's endorsement, the
  peer-reviewed paper, 1:100 tank testing, doctoral research at Glasgow and
  Newcastle. In a sector full of unbuilt concepts, four decades of independent
  scrutiny is a differentiator. Currently it sits at the bottom of the page.

---

## 8. Measurement

| | Signal |
|---|---|
| **Leading** | Renewables page sessions and scroll depth; day-rate calculator runs in energy-hub mode; PDF downloads; reply rate on direct outreach |
| **Real** | Technical questions received (a heel/thrust question is a *good* outcome — it means someone qualified is reading); NDA requests; yard conversations; conference talk accepted |
| **Outcome** | A signed feasibility study, a JDP with an OEM or developer, or a lease LOI |

Vanity metrics to ignore: impressions, follower growth, page views without
scroll depth.

---

## 9. Decisions needed

1. **Payload: 15,000 t or 30,000 t?** Blocks everything.
2. **Do we commission the wind-configuration naval-architecture note**, or
   publish with an explicit "study in progress"? Determines how hard we can
   push at OEMs in Phase 1.
3. **Lead audience for Phase 1** — floating wind, or offshore data centres?
   Data centres are less contested and better funded; wind is the bigger
   long-term market. The plan can carry both, but the outreach copy differs and
   one has to go first.
4. **Does `renewables.html` sit alongside `index.html`, or does the whole site
   reposition?** This plan assumes alongside — oil & gas is still the nearest
   revenue. A full reposition is a bigger call.
5. **Founding-round figure** in `memo.html` is still a `$[__]M` placeholder. If
   any of this outreach reaches investors, it needs a number.
