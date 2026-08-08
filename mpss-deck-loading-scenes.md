# MPSS — Dockside Deck Loading & Wet Mating

Image-generation prompt set for a scene series showing the MPSS build sequence:
**hulls built in series → deck built and fully loaded at the quay → wet mating last.**

The single idea the series has to land in about five seconds:
**one serious platform, multiple missions, simple build, low motion, long life.**

---

## 0. Master style block

Prepend this to every scene prompt. Keep it identical across scenes — consistency across
the series is what makes it read as one platform rather than seven unrelated renders.

> Photoreal technical illustration of a real offshore construction yard. Serious industrial
> engineering photography, not concept art and not sci-fi. Overcast North Sea daylight, flat
> even light, no lens flare, no golden hour, no drama. Muted palette: steel grey, navy,
> primer red-oxide, safety yellow, cold white. Weathered plate steel with visible stiffener
> and butt-weld lines, scaffolding, cable trays, temporary lighting, mud on the quay. Real
> scale cues — people in hi-vis, 40 ft containers, SPMT trailers, quay bollards, mobile
> cranes. Sharp focus edge to edge, high detail, 35 mm to 50 mm equivalent, no fisheye,
> no tilt-shift toy effect. Clean uncluttered composition with one clear subject.

**Negative prompt (every scene):**

> no futuristic styling, no glowing lights, no neon, no lens flare, no sunset, no dramatic
> sky, no crowds, no floating text, no watermarks, no logos, no distorted or extra limbs,
> no tubular braced semi-submersible, no ship-shape hull, no barge, no jack-up, no spar,
> no visible turbine on the hull before mating, no clutter, no gadget-catalogue look.

**Aspect ratios:** 16:9 for the yard and quay scenes, 1:1 or 4:5 for the plan-view
loadout scene, 21:9 for the wet-mating sequence.

---

## 1. Geometry lock — repeat verbatim in every prompt

The whole series fails if the platform changes shape between frames. Paste this block into
each scene prompt.

> Platform geometry, exact and unchanging: a square semi-submersible. A flat square deck
> box 90 m × 90 m, box-girder flat-plate construction, no trusses, no bracing. Four square
> corner columns, each 15 m × 15 m in plan, flat-sided, right-angled, no tubulars, no cross
> bracing anywhere. A single continuous square ring pontoon joining all four columns —
> one closed square ring, not two separate ship-shaped pontoons. Everything is flat plate
> and right angles: a welded steel box, built like a bridge, not like a ship.

Derived dimensions the model must respect:

| Item | Value |
|---|---|
| Deck | 90 m × 90 m (8,100 m²) |
| Column plan size | 15 m × 15 m |
| Column centreline inset | **7.5 m from each deck edge** |
| Column centre spacing | 75 m × 75 m |
| Operating draft (at sea) | ~27 m |
| Deck underside during quay loading | **inches above the waterline** |

---

## 2. Deck loadout plan — the arrangement used in every loaded scene

Quay runs along the **south** edge of the deck. Heavy modules land on the column lines;
the deck centre is left open as the SPMT roll-on corridor.

```
                       N
   ┌──────────────────────────────────────────┐
   │  ▣ NW COLUMN            NE COLUMN ▣      │
   │  15 MW TURBINE          DATA CENTRE      │
   │  tower centre 7.5 m      containers      │
   │  in from N and W edge    stacked 3 high  │
   │  → directly over the     + dry coolers   │
   │    column centreline                     │
 W │                                          │ E
   │        ← open SPMT roll-on corridor →    │
   │                                          │
   │  ▣ SW COLUMN            SE COLUMN ▣      │
   │  CCS PROCESS BLOCK      BESS + POWER     │
   │  CO2 compression        CONVERSION       │
   │  trains, coolers,       containerised    │
   │  KO drums, pumps        battery rows +   │
   │                         e-house modules  │
   └───────────────▲──────────────────────────┘
                   │  quay ramp / SPMT route
                       S  (QUAYSIDE)
```

**The turbine placement callout — say this explicitly in the prompt and in the label:**

> The wind turbine tower is mounted **inboard, 7.5 m in from each of the two adjacent deck
> edges**. Because the corner columns are 15 m square, that offset puts the tower centreline
> **exactly on the column centreline** — the turbine loads go straight down a column into
> the ring pontoon, not into the deck span.

---

## 3. Scene prompts

### Scene 1 — Hulls in series

> [MASTER STYLE] [GEOMETRY LOCK] Wide view down a fabrication quay. **Four identical MPSS
> lower hulls in a row at different stages of completion** — the nearest fully welded and
> painted, the next in primer with the fourth column being landed by a mobile crawler crane,
> the third with only the square ring pontoon closed, the fourth as pontoon segments on
> skidways. No decks anywhere in frame. No turbines, no containers, no topsides. Ordinary
> yard: gantries, SPMTs, plate stacks, welders' tents. The repetition is the subject —
> the same hull built again and again like a production run.

**Callout:** `HULLS BUILT IN SERIES — repeat production, not a bespoke project`

---

### Scene 2 — Deck box complete, on the quay

> [MASTER STYLE] [GEOMETRY LOCK] The 90 m × 90 m square deck box alone, sitting on skidways
> and grillage on a broad concrete quay. No hull, no columns underneath — just the flat
> welded box girder deck, its underside a metre or two above the quay. Empty topside: bare
> deck plate, painted module footprints and tie-down pad-eyes marked out, hi-vis workers
> walking across it for scale. Ordinary quay cranes in the background, **no ultra-heavy-lift
> crane, no floating sheerleg**.

**Callout:** `THE DECK IS BUILT AND OUTFITTED AT QUAY LEVEL — before it ever touches a hull`

---

### Scene 3 — Loading begins

> [MASTER STYLE] [GEOMETRY LOCK] The same 90 m × 90 m deck at the quay, now being loaded.
> **Self-propelled modular transporters rolling modules aboard over a ramp at the south edge**,
> the deck surface effectively level with the quay. Two rows of **40 ft containerised battery
> units** already landed and being bolted down on the south-east quarter; **CO2 compression
> skids** landing on the south-west quarter. A standard 600 t crawler crane working alongside.
> Half the deck is still bare plate. Modules arriving on flat-top barges and low-loaders in
> the background.

**Callout:** `DECK AT QUAY LEVEL — modules roll on, they are not lifted over a 27 m draft hull`

---

### Scene 4 — Turbine erection over the corner column

> [MASTER STYLE] [GEOMETRY LOCK] The deck at the quay, part loaded. A **15 MW offshore wind
> turbine being erected on the north-west corner of the deck**: tower base flange and lower
> tower section already bolted down with the **tower centreline set 7.5 m in from the north
> edge and 7.5 m in from the west edge, directly over the 15 m square corner column**.
> A large land crawler crane lifting the second tower section; nacelle and three ~115 m blades
> laid out on the quay behind. Tower base diameter around 10 m, sitting comfortably inside the
> column footprint. Show the column below the deck edge to make the load path obvious.

**Callout:** `TOWER MOUNTED 7.5 m INBOARD — dead centre on the corner column`

> Honest framing for the caption: erecting a 15 MW machine still needs a tall crane. What
> the quay-level deck removes is the extra ~25–30 m of hook height and the offshore/afloat
> lift you would otherwise need over a deep-draft floater — not the crane itself.

---

### Scene 5 — Fully loaded deck, all zones called out (the money shot)

> [MASTER STYLE] [GEOMETRY LOCK] **High three-quarter aerial** of the fully loaded 90 m × 90 m
> deck alongside the quay, hull not yet mated, deck underside inches above the water.
> Four clearly separated zones on one uncluttered deck:
> **(1) north-west — a complete 15 MW wind turbine**, tower centred 7.5 m in from both edges,
> directly over the corner column;
> **(2) south-east — battery energy storage in 40 ft containers in neat single-high rows,
> alongside power-conversion / e-house modules** with cable trays running between them;
> **(3) south-west — a carbon-capture process block**: vertical CO2 knock-out drums, compression
> trains under an open steel frame, air coolers on top, pipe racks;
> **(4) north-east — a data centre: standard shipping-container modules stacked three high**
> in a rectangular block with dry-cooler arrays on the roof and a switch room at the base.
> A wide open cross corridor left down the deck centre. Everything bolted to marked footprints.
> Clean, ordered, industrial — a working plant, not a display of gadgets.

**Callout set (add as flat vector labels in post — do not ask the model to render text):**

- `15 MW WIND TURBINE — mounted 7.5 m inboard, centred on the corner column`
- `BESS — containerised battery energy storage`
- `POWER CONVERSION — containerised HV/MV modules and e-houses`
- `CCS — CO2 compression, cooling and injection train`
- `DATA CENTRE — container modules stacked 3 high`
- `DECK 90 × 90 m · COLUMNS 15 m SQ · SINGLE 27 m OPERATING DRAFT`
- Footer line: **`The equipment changes. The platform stays.`**

---

### Scene 6 — Wet mating (float-over), last

> [MASTER STYLE] [GEOMETRY LOCK] Three-panel sequence, same camera position, sheltered water
> just off the quay:
> **Panel A** — the completed lower hull (square ring pontoon, four 15 m columns) ballasted
> deep, column tops just proud of the water, manoeuvring beneath the loaded deck on tugs and
> winch lines.
> **Panel B** — hull centred under the deck, mating cones aligning with the deck's receiving
> sockets, only a small gap left.
> **Panel C** — hull deballasting, column tops taking the deck's weight, the whole loaded
> platform lifting clear of the water as one unit, turbine and all four module blocks already
> in place and commissioned.
> Calm water, tugs, mooring lines, no heavy-lift vessel anywhere in frame.

**Callout:** `MATING HAPPENS LAST — the hull is floated under a finished, loaded, commissioned deck`

---

### Scene 7 — On station

> [MASTER STYLE] [GEOMETRY LOCK] The completed MPSS on station offshore in a moderate
> 3–4 m sea, at its ~27 m operating draft: only the four square columns pierce the surface,
> the ring pontoon deep and invisible, deck high and dry, **no water on deck, the platform
> visibly still while the sea moves around it**. The 15 MW turbine turning on the north-west
> column, the CCS block, battery rows and the three-high data-centre stack all working.
> A supply vessel alongside for scale. Long horizon, grey sea, working platform.

**Callout:** `LOW MOTION. LONG LIFE. THE EQUIPMENT CHANGES — THE PLATFORM STAYS.`

---

### Scene 8 (alternate / recommended) — Four loadouts, one hull

Use this instead of, or immediately after, Scene 5 if the "all four missions at once" frame
starts to look like a catalogue.

> [MASTER STYLE] [GEOMETRY LOCK] A strip of **four identical MPSS platforms side by side**,
> same camera, same lighting, same hull, differing only in what is bolted to the deck:
> (1) wind — one 15 MW turbine on a corner column, rest of deck bare;
> (2) power — battery containers and conversion modules only;
> (3) carbon — CCS compression and injection train only;
> (4) data — container modules stacked three high only.
> Flat, deadpan, catalogue-of-one-object composition. The hull is visibly identical in all four.

**Callout:** `ONE PLATFORM. FOUR MISSIONS. SAME HULL, BUILT IN SERIES.`

---

## 4. Production notes

1. **Never let the image model render the callout text.** Generate clean plates, then add
   labels as flat vector type with thin leader lines in post. Rendered text is the single
   fastest way to make a technical visual look amateurish.
2. **Lock the geometry first.** Generate Scene 5 or Scene 7 first, pick the best hull, then
   use it as an image/style reference for every other frame so the platform stops drifting.
3. **One idea per frame.** Scene 1 = series build. Scene 3 = quay-level loading. Scene 4 =
   the 7.5 m offset. Scene 6 = mating last. Do not stack messages inside a frame.
4. **Scale discipline.** A 15 MW rotor is ~236–240 m across with ~115 m blades and a hub
   around 150 m up. Next to a 90 m deck the rotor is roughly 2.6 deck-widths — if the render
   makes the turbine look small, it is wrong.
5. **Keep the deck 30–40% empty** in every loaded frame. Empty deck reads as capacity and
   seriousness; a full deck reads as clutter.
