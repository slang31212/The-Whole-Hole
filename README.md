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
- Key figures (15,000 t payload, 8,100 m² deck, 2M bbl SWIS storage, 37.5 m survival wave,
  ~14-month hull delivery, LR/ABS/DNV approval) and the design heritage are drawn from
  Seaways Engineering source material.

---

# SWOT — Renewable projects · Support vessels · The MPSS

**Internal working analysis · August 2026 · Not investor-facing copy.**
Nothing below should be pasted into `index.html`, `memo.html` or `invest.html` without
rewriting — it is deliberately critical of the current positioning.

Three SWOTs and a comparison, prepared to test one question the site and the memorandum
currently leave open: **how much of the MPSS case should rest on renewables?**

## Scope — three different businesses, not three versions of one

| Unit of analysis | What it covers | Position |
|---|---|---|
| **A. Renewable projects** | Offshore wind, fixed-bottom and floating, plus the adjacent transition missions the site already sells against: CCS, offshore green hydrogen, offshore power and BESS, offshore data centres. | Asset owner / developer |
| **B. Support vessels** | WTIVs and offshore heavy-lift, SOV/CSOVs, CSVs and cable-lay, feeder barges, AHTS and tow spreads for floating wind. | Contractor / tonnage owner |
| **C. The MPSS** | A moored, low-motion 90 × 90 m box semi: 30,000 t deck payload, 8,100 m² deck, single 27 m operating draft, ~14-month hull, LR/ABS/DNV reviewed, leased on multi-year day rate. | Infrastructure landlord |

That distinction drives the whole comparison.

## A. SWOT — Renewable projects

**Strengths** *(internal · helpful)*

- **Long-dated contracted revenue.** CfDs, PPAs and offtake agreements run 15–20 years —
  longer than any oil-and-gas charter, and largely insulated from the commodity price.
- **Policy-manufactured demand.** Where the mandate holds, demand is legislated rather than
  discovered: net-zero targets, seabed leasing rounds, CCS storage licences.
- **Investment-grade counterparties.** Utilities and majors — Ørsted, Equinor, EnBW, RWE, bp —
  not marginal E&P independents.
- **Real technical adjacency for a low-motion host.** Floating wind, offshore hydrogen, CO₂
  injection and offshore data all need what the MPSS sells: deck area, payload,
  station-keeping, low heave.

**Weaknesses** *(internal · harmful)*

- **The economics do not carry a $600 M host.** A semi-submersible floating-wind substructure
  runs roughly €430–485 k per MW installed — about €15 M for a 12 MW unit. One 15 MW machine
  on a corner column is ~€6–7 M of substructure value on a platform the memo prices at $600 M.
- **Power is the lowest-value cargo per m² of deck.** Wind sells electrons at a strike price;
  oil sells barrels. The gap shows up directly in the day rates below.
- **Chronic schedule slip.** Consenting, grid connection, port capacity and turbine supply each
  delay first power independently; the compounded schedule is the sector's defining risk.
- **Fabrication and quay capacity are the real constraint** on floating wind — not hull design.
  The MPSS does not relieve that bottleneck; it competes for the same quay.

**Opportunities** *(external · helpful)*

- **Floating wind is still pre-industrial** — no dominant substructure design, no serial
  production line, no incumbent. The MPSS's serial-build thesis aims at precisely this gap.
- **The adjacent missions are emptier than wind.** Offshore CCS, hydrogen and data centres have
  no standard host at all — a blanker sheet than wind.
- **Offshore data is the outlier**: power-hungry, latency-tolerant if sited well, backed by
  counterparties whose willingness to pay dwarfs anything in the wind supply chain.
- **A 2026 recovery is being called** after two brutal years, with UK AR7 adding secured
  floating offtake.

**Threats** *(external · harmful)*

- **A live wave of cancellations.** EnBW halted its 3 GW Mona and Morgan projects in the Irish
  Sea; the 58.4 MW Blyth 2 floating project was cancelled in January 2026; in February 2026 the
  US suspended leases on five large projects including Empire Wind.
- **Strict capital discipline has replaced growth at any cost.** Every developer is cutting
  scope — not adding a novel, unproven host to the critical path.
- **A thin floating pipeline.** 2026 added roughly 193 MW of secured floating offtake — a
  fraction of one MPSS's worth of capital.
- **Political reversibility.** Unlike an oil field, the demand is a policy artefact and can be
  withdrawn by an election, as the US lease suspensions show.

## B. SWOT — Renewable-support vessels

**Strengths** *(internal · helpful)*

- **A proven, liquid business model.** Day-rate chartering is a century-old bankable structure
  with an established owner base, standard charterparties and deep second-hand markets.
- **Very high rates at the top of the fleet.** High-spec WTIVs are valued around $500 k/day,
  with wait-on-weather for a full spread at $18–22 k/hour in 2026.
- **Mobility is the core asset.** When the North Sea softens the hull sails to Taiwan or the US
  East Coast — the single most valuable structural feature the MPSS does not have.
- **O&M demand is structural.** Every turbine installed becomes 20–25 years of SOV demand
  whether or not new FIDs are taken.

**Weaknesses** *(internal · harmful)*

- **Utilisation risk sits with the owner.** Idle steel earns nothing, and the spread between a
  chartered and an idle year is the whole return.
- **Long charters earn thin returns.** Guaranteed-utilisation SOV charters trade at
  comparatively low day rates and often yield single-digit IRRs — the safety is priced in.
- **Turbine upscaling obsoletes tonnage.** A jack-up specified for 8 MW machines cannot install
  15 MW. Modern SOVs earn €45–60 k/day, ~30% above 2020 — but that is a rate for the current
  generation only.
- **Capital-intensive with no alternative use.** A WTIV outside offshore wind is a stranded
  asset with a very short buyer list.

**Opportunities** *(external · helpful)*

- **Europe tightens later in the decade.** Supply of ≥15 MW-capable WTIVs is forecast tight from
  2032, and from 2030 in other markets. Patient, well-timed tonnage gets paid.
- **Floating wind re-shuffles the vessel mix**, shifting work from jack-ups toward tow, mooring
  and offshore-assembly spreads — an opening for new asset types.
- **Consolidation is under way.** Fleet sales signal a maturing sector where scale owners buy
  distressed tonnage cheaply.

**Threats** *(external · harmful)*

- **A structural oversupply, now arriving.** More than 60 WTIVs and heavy-lift vessels deliver
  between 2026 and 2030; ≥15 MW-capable supply outside China goes from none in 2020 to over 25
  by 2028.
- **The same story in the service fleet**: around 60 SOV/CSOV deliveries by end-2026 against 40
  in 2025, into a market widely forecast oversupplied through 2030.
- **Rate collapse is the base case, not the tail.** The 2022–24 record rates were a shortage
  artefact, and the orderbook is fixing the shortage.
- **Cancellations hit the vessel market twice** — less installation work now, and fewer turbines
  to service for the next 25 years.

## C. SWOT — The MPSS

**Strengths** *(internal · helpful)*

- **The engineering risk is genuinely behind it.** Four decades of work, 1:100 tank testing,
  doctoral research at Glasgow and Newcastle, peer-reviewed publication, and classification
  review by Lloyd's Register, ABS and DNV. Very few offshore concepts can say this.
- **The build sequence is the real differentiator.** Deck box outfitted at quay level, hull
  floated under it last (`render/mpssdeckloadingscenes.md`, Scenes 2–6). That removes the afloat
  lift and ~25–30 m of hook height — not the crane, but the most expensive hour in the schedule.
- **Load path integrity.** Tower centreline 7.5 m inboard lands dead centre on a 15 m square
  column, putting point loads into the ring pontoon rather than a deck span.
- **Low motion by construction.** A deep ring pontoon at 27 m sees ~40% of surface wave height;
  tested to a 37.5 m survival wave with no water on deck and no change of draft.
- **Standardisation is the actual product.** Serial hulls, one classed design, topsides swapped
  per mission — leaseable inventory available *before* FID. Nobody in floating wind has
  industrialised anything comparable.

**Weaknesses** *(internal · harmful)*

- **The renewable tenants cannot pay the required rate.** On the repo's own inputs, the ~15%
  unlevered yield in `memo.html` is achievable on exactly one preset: oil production.
- **A naming error diligence will catch.** `day-rates.js:15` sells "Offshore wind turbine
  install" at $180 k/day. The MPSS is a moored host with no heavy-lift crane and no transit mode
  — it is not an installation vessel. The turbine in the renders stands *on* the platform; it is
  not installed *by* it.
- **Immobile by design.** The mobility that lets a WTIV chase demand across basins is exactly
  what a moored host gives up. Redeployment is a de-mob, tow and re-moor campaign, not a voyage.
- **Not yet built.** Classed and reviewed is not delivered. First-of-class risk, yard slot risk
  and the ~14-month hull claim are unproven in steel.
- **Single-asset concentration.** One $600 M hull, one tenant at a time; a vessel owner
  diversifies across a fleet.

**Opportunities** *(external · helpful)*

- **Reposition wind from generator to hub.** The value is not one turbine on a corner column —
  it is the substation, BESS, conversion, hydrogen and accommodation functions for a whole
  floating array, on one classed platform that also survives a 37.5 m wave.
- **Offshore data is the strongest transition tenant in the model below** — the only
  non-hydrocarbon preset that clears the assumed 8% debt cost with room to spare.
- **CCS and hydrogen sell term, not rate.** 12-year and 10-year charters at 8.2–8.3% unlevered
  are the closest renewable analogue to infrastructure yield — and appeal to a different
  investor than the memo addresses.
- **Counter-cyclical yard pricing.** Cancellations free yard slots and soften steel and
  fabrication pricing. The best time to order serial hulls is a bad market.
- **Vessel oversupply is an argument *for* the MPSS**: a permanently moored host substitutes for
  chartered tonnage over a 10–20 year life, converting volatile day-rate exposure into a fixed one.

**Threats** *(external · harmful)*

- **The hydrocarbon core carries the returns while the renewable story carries the marketing.**
  Any investor who runs the day-rate model finds this in ten minutes. It should be stated first,
  not discovered.
- **Renewables counterparties are cutting, not committing.** Under strict capital discipline, no
  developer adds a first-of-class host to the critical path.
- **The market will compare against known things** — a WindFloat-class floater, a chartered
  CSOV, an FPSO conversion — not the "conventional bespoke FPU" the site benchmarks against.
  That table answers a question nobody in renewables is asking.
- **Illustrative figures still anchor.** $600 M, ~15%, 2× MOIC and 60% residual are placeholders
  in `invest.js`, but they read as claims.
- **First-mover risk is unpriced.** Serial production needs a second and third order that do not
  exist until the first hull earns.

## D. The comparison

### D.1 Every tenant preset, run against the investor model

Each preset in `day-rates.js` at face value, against the `invest.js` deal — $600 M asset,
55% debt at 8%, so $26.4 M/yr interest on $270 M of equity:

| Tenant preset | Term | Net $M/yr | Unlevered yield | Equity CF | Cash-on-equity |
|---|---:|---:|---:|---:|---:|
| Oil production host (FPSO) | 8 y | 94.0 | **15.7%** | $67.6M | **25.0%** |
| Drilling support | 3 y | 72.9 | 12.2% | $46.5M | 17.2% |
| Offshore data center | 10 y | 55.5 | 9.2% | $29.1M | 10.8% |
| Green hydrogen | 10 y | 49.8 | 8.3% | $23.4M | 8.7% |
| CCS / carbon storage | 12 y | 49.3 | 8.2% | $22.9M | 8.5% |
| Power generation | 10 y | 37.8 | 6.3% | $11.4M | 4.2% |
| Offshore wind turbine install | 2 y | 36.5 | 6.1% | $10.1M | 3.7% |
| Accommodation / flotel | 2 y | 23.4 | 3.9% | −$3.0M | **−1.1%** |

Three things fall out of this table:

1. **The memorandum's headline is the oil case.** `invest.js` defaults to
   `netCharter: 94000000` — which is, to the dollar, the oil-production preset at 92%
   utilisation. The "~15% illustrative unlevered net yield" in `memo.html` §06 is not a blended
   figure and not a renewable one.
2. **Leverage only works above 8%.** At the assumed debt cost, gearing is accretive for oil,
   drilling, data centre, hydrogen and — marginally — CCS. For power generation, wind install
   and accommodation the debt eats the spread, and the flotel case goes cash-negative.
3. **Term and rate trade in the right direction.** CCS at 12 years and hydrogen at 10 pay less
   per day but far more predictably than 2-year wind or flotel work. For an infrastructure
   buyer, 8.2% across twelve years is a *better* asset than 12.2% across three — an argument the
   memorandum does not yet make.

### D.2 Where the three sit structurally

| Dimension | Renewable projects | Support vessels | MPSS |
|---|---|---|---|
| Position in the chain | Asset owner / developer | Contractor, tonnage supplier | Infrastructure landlord |
| Revenue | Power price × output | Day rate × utilisation | Day rate × utilisation |
| Contract length | 15–20 y (CfD / PPA) | 2–10 y, spot to term | 2–12 y by mission |
| Who holds utilisation risk | Developer (wind resource) | **Owner** | **Owner** |
| Mobility | Fixed for life | **High — chases demand** | Low; moored, tow to redeploy |
| Current supply balance | Demand shrinking | **Oversupplied 2025–2030** | No supply — none built |
| Rate direction | Strike prices under pressure | Softening from 2022–24 peak | Unproven |
| Capital per unit | €430–485 k/MW substructure | ~$300–500 M+ high-spec WTIV | $600 M/host (illustrative) |
| Obsolescence | 25–30 y asset life | **High — turbine upscaling** | Low — topsides swap, hull stays |
| Residual value | Site-bound, decom liability | Liquid but cyclical | Hard steel, redeployable |
| Counterparty | Government / utility | Developer / EPC | Operator / utility / hyperscaler |
| Main risk | Policy and consenting | Utilisation and rate collapse | **First-of-class, single asset** |
| Best return in this model | 6.1–9.2% unlevered | Single-digit IRR on term charters | 15.7% unlevered — on oil |

### D.3 What the comparison actually says

**The MPSS is structurally closer to a vessel than to a renewable project — and it inherits the
vessel model's weakness, owner-held utilisation risk, without its strength, mobility.** It
compensates with two things a vessel does not have: **topside reconfigurability**, which defeats
the turbine-upscaling obsolescence that dates a WTIV, and a **27 m fixed draft with a 37.5 m
survival wave**, which lets it hold station through weather that sends a CSOV to port. Those two
features are the honest core of the advantage over tonnage, and the site currently buries them
under the five-S pitch.

**Against renewable projects, the MPSS is not a competitor and should stop implying it is.** It
cannot beat a €15 M semi-submersible floater as a 15 MW generator platform, and it cannot beat a
$500 k/day WTIV as an installer. What it can do — and what no floater or vessel does — is hold a
large, powered, low-motion, permanently-manned deck on station for twenty years. That is the
natural home for an array substation, BESS, hydrogen production, CO₂ compression and injection, a
data centre, or all of them at once: the argument Scene 5 of the render series already makes
visually and the copy does not make commercially.

**The timing argument cuts both ways.** Vessel oversupply and project cancellations both make
renewables a poor *first* tenant — nobody is committing capital to a first-of-class host in this
market. The same conditions make it an excellent *second* one: a hull ordered into a soft yard
market and paid for by an oil-production charter is positioned to take transition work when
floating wind industrialises later in the decade, exactly as European ≥15 MW vessel supply
tightens from 2030–32.

## E. What follows from it

1. **Lead the memorandum with the hydrocarbon case and name it as such.** The ~15% figure is the
   oil-production preset. Saying so up front converts a diligence liability into a credibility
   asset, and makes the transition tenants optionality on top of an oil-underwritten return — a
   stronger structure than a blended claim nobody can reproduce.
2. **Fix `day-rates.js:15`.** Rename "Offshore wind turbine install" to something the MPSS can
   actually do — "Floating wind hub: substation, BESS & O&M base" — and re-rate it on a 10-year
   term. The current line invites the question "where is your crane?"
3. **Promote the offshore data centre.** It is the best-yielding non-hydrocarbon tenant in the
   model above — 9.2% unlevered, 10.8% on equity, 10-year term at 95% utilisation — and it faces
   a counterparty class with a genuinely different willingness to pay.
4. **Sell CCS and hydrogen on term, not rate.** Twelve and ten years of contracted cash flow at
   ~8% unlevered is an infrastructure product for an infrastructure buyer — a different and
   larger pool of capital than the family offices `invest.html` currently targets.
5. **Add the comparison the market will actually make.** The hull table in `index.html`
   benchmarks against a conventional twin-pontoon FPU. Add a second table against a
   floating-wind semi and a chartered CSOV — the MPSS wins on deck, payload, station-keeping and
   mission life, and that is a fight worth picking publicly.
6. **Use Scene 8 as the wind story, not Scene 4.** Four identical hulls under four loadouts is
   the standardisation argument. A single turbine being erected on a corner column is a $600 M
   platform doing a €15 M job, and a wind specialist will say so.

## Sources

- [Vessel Sector Deep Dive: WTIVs](https://www.oedigital.com/news/538691-vessel-sector-deep-dive-wtivs) — Offshore Engineer
- [2026 WTIV Charter Rate Forecast](https://oithamarine.com/2026-wtiv-charter-rate-forecast-estimating-epci-mobilization-costs-for-15mw-offshore-projects/) — Oitha Marine
- [SOV/CSOV Through 2030: Oversupply and Market Volatility](https://www.maritimemagazines.com/offshore-engineer/202501/oversupply-and-market-volatility/) — Maritime Magazines
- [CSOV Market Consolidates as 60 Service Vessels Deliver in 2026](https://eagleintelmari.com/news/offshore-wind-csov-market-60-vessels-delivery-2026) — Eagle Intel Maritime
- [Service operation vessels](https://guidetofloatingoffshorewind.com/guide/o-operations-and-maintenance/o-4-offshore-vessels-and-logistics/o-4-2-service-operation-vessels/) — Guide to a Floating Offshore Wind Farm
- [Offshore Wind Forecast Slashed, but Signs of Recovery Emerge for 2026](https://www.tgs.com/press-releases/offshore-wind-forecast-slashed-but-signs-of-recovery-emerge-for-2026) — TGS
- [2026 Global floating status: pipeline remains slim](https://www.aegirinsights.com/2026-global-floating-status-small-boost-early-this-year-but-pipeline-remains-slim) — Aegir Insights
- [EnBW 3 GW UK project cancellation](https://enkiai.com/offshore-wind/uk-project-cancellations-strike-price/) — EnkiAI
- [Modelling the installation of next generation floating offshore wind farms](https://www.sciencedirect.com/science/article/pii/S0306261924013849) — ScienceDirect
- [Floating substructure](https://guidetofloatingoffshorewind.com/guide/b-balance-of-plant/b-2-floating-substructure/) — Guide to a Floating Offshore Wind Farm

Market figures are third-party estimates gathered August 2026 and are indicative only. All MPSS
economics are this repo's own illustrative placeholders — not projections, offers or guarantees
of return.
