# MPSS renders

Photoreal renders of the MPSS built from `mpssdeckloadingscenes.md`.

These are **not** image-model output. There is no diffusion model in this
repository. The scenes are modelled to the exact dimensions in the brief and
rendered with a small physically-motivated ray tracer written for the job, so
the geometry is verifiable rather than suggestive: a 40 ft container is 12.192 m
long because it is 12.192 m long, and the turbine tower sits on the column
centreline because that is where the code puts it.

That distinction matters for this particular brief. Its whole argument is a
load path — *the turbine goes over the column, not over the deck span* — and an
image model cannot be made to respect a load path. A renderer can.

## Output

| File | Scene | Aspect |
|---|---|---|
| `../images/mpss-turbine-erection.jpg` | Scene 4 — turbine erection over the corner column, deck part loaded | 16:9 |
| `../images/mpss-deck-loadout.jpg` | Scene 5 — fully loaded deck alongside the quay, hull not yet mated | 4:5 |
| `../images/mpss-on-station.jpg` | Scene 7 — on station at the 27 m operating draft | 16:9 |

Scene 5 is rendered 4:5 rather than 16:9 deliberately. With a 236 m rotor over
a 90 m deck the subject is roughly twice as tall as it is wide; forcing it into
16:9 either shrinks the deck to a chip or leaves half the frame empty. The
brief already allows 1:1 or 4:5 for the loadout scene, and that is the frame
the subject actually has.

## Running it

```bash
pip install numpy pillow

python3 render_mpss.py --scene quay --preview          # 640x360, ~5 s
python3 render_mpss.py --scene station --preview

# what shipped
python3 render_mpss.py --scene quay \
    --width 1600 --height 2000 --ss 2 --ao 24 --ao-stride 4 \
    --out ../images/mpss-deck-loadout.jpg
python3 render_mpss.py --scene station \
    --width 1920 --height 1080 --ss 2 --ao 24 --ao-stride 4 \
    --out ../images/mpss-on-station.jpg
```

`--ss` is the supersampling factor (2 means trace at 2x and box-filter down),
`--ao` the number of sky-dome samples per shaded point, `--ao-stride` the
subsampling of the skylight buffer relative to the traced resolution.

`frame_check.py` projects the deck corners, hub and blade tips for a candidate
camera and reports what falls outside the frame. Use it before committing to a
long render:

```bash
# orbit <az> <el> <dist> <focal> [rotor_az] [spin] [deck_top] [aim_y]
FC_W=1600 FC_H=2000 python3 frame_check.py orbit 156 22 305 35 155 60 7.35 109

# the camera actually used for Scene 5
FC_W=1600 FC_H=2000 \
  python3 frame_check.py eye "(102.6,162.7,-230.9)" "(0,109,0)" 35 155 60 7.35
```

Worth knowing before you move a camera: the rotor's blade phase changes how
much vertical room the subject needs. With one blade pointing straight down
the rotor spans 1.5 R; rotated 30 degrees off that it spans about 1.73 R, which
is another 27 m of frame to find. Cameras here are solved for the phase in
`add_turbine`, so if you change `spin` you need to re-solve rather than assume
the old framing still holds.

## Files

| File | What it is |
|---|---|
| `mpss_raytracer.py` | The tracer: oriented boxes, capped cone frusta, a two-level cluster accelerator, the camera, value noise |
| `mpss_scene.py` | All MPSS geometry and the two scene definitions. Every dimension in the brief lives here |
| `render_mpss.py` | Sky model, procedural materials, skylight sampling, water, tone mapping, the driver |
| `frame_check.py` | Camera framing solver |

## How it is lit

The brief asks for "overcast North Sea daylight, flat even light, no lens
flare, no golden hour, no drama", so there is no sun in the scene at all. The
only light source is a CIE overcast dome — luminance `(1 + 2·cos θ)/3`, pale
hazy horizon, deeper grey overhead — sampled with 24 cosine-weighted rays per
shaded point. Everything that reads as form comes from sky occlusion: the dark
under the deck girder, the shadow between container rows, the gloom inside the
CCS frame. There is no ambient-occlusion fudge factor and no fill light.

Surfaces are weathered procedurally: run-down streaking on vertical plate,
stiffener lines every 3 m, rust breaking through where the noise says the
coating has failed, corrugation on every ISO container, slab joints and
standing water on the quay, tie-down pad-eyes on a 6 m grid across the deck.

Water is an analytic surface: a flat-plane hit refined by three Newton steps
onto a sum-of-sinusoids displacement, with the wave detail faded out with
distance because past a few hundred metres a wave is smaller than a pixel and
keeping it only produces moiré. Reflections are traced for the near field.

## Geometry lock

Held identical across both scenes, straight from the brief:

```
deck            90 m x 90 m x 7 m box girder, flat plate, no trusses, no bracing
columns         four, 15 m x 15 m in plan, flat-sided, right-angled, no tubulars
column centres  7.5 m in from each deck edge -> 75 m x 75 m spacing
                (which puts each column's outer face flush with the deck edge)
pontoon         ONE continuous square ring, 15 m wide, 9 m deep
operating draft 27 m; deck underside 20 m above the waterline at sea
at the quay     deck underside 0.35 m above the waterline, quay level with the deck
turbine         tower centreline at (-37.5, +37.5) -- dead centre on the NW column
                10 m base diameter, 150 m hub height, 236 m rotor, 115 m blades
```

### Scene 4 contradicts itself, and this is how it was resolved

The brief asks Scene 4 to *"show the column below the deck edge to make the
load path obvious"*. It cannot. Scenes 2, 3, 5 and 6 all establish that the
deck is built and loaded at quay level and the hull is floated under it **last**
— so at turbine-erection time there is no column under the deck to show. The
two instructions cannot both be honoured.

Production note 3 breaks the tie: *"Scene 4 = the 7.5 m offset."* The offset is
what the frame is for; the column was only the device for showing it. So the
build sequence is kept intact and the load path is carried three other ways:

1. the camera looks in over the NW corner, the angle that opens the offset up
   rather than flattening it — solved numerically by maximising the on-screen
   distance between the tower base and the deck corner;
2. all four **column hard-point pads** are marked on the deck — a darker
   non-skid square exactly on the 15 m column plan, bordered and hatched — so
   the deck visibly has four column positions and the turbine stands centred on
   one of them;
3. two sides of each pad sit flush with the deck edge, because the column's
   outer face is flush with it. That flushness is itself part of the argument.

Worth knowing when reading the frame: the tower is 10 m across and its
centreline is 7.5 m in, so its *skin* clears the deck edge by only 2.5 m. It
genuinely stands close to the edge. What makes it a column load rather than an
edge load is the pad it stands on, not apparent distance from the edge.

If a literal column under the deck is wanted instead, that is a different
picture — the deck already mated — and it contradicts the series' central
claim. Ask before rendering it.

One honest caveat about the turbine offset. It is correct in the model — the
tower centreline is at `(-37.5, +37.5)`, exactly on the NW column centreline —
but in these two frames it is hard to *see*. Both cameras look roughly along
the deck's NW–SE diagonal, which is the one direction that foreshortens a
7.5 m inset from both adjacent edges down to about 25 px. The offset is real,
not approximate; the frame just doesn't sell it.

The brief already knows this: Scene 4 is the frame designed to prove the load
path, shot square onto the corner with the column showing below the deck edge.
If that is the point that needs making, render Scene 4 rather than trying to
read it off Scene 5. You can confirm the geometry meanwhile:

```bash
python3 -c "import mpss_scene as S; print(-S.COL_C, S.COL_C, S.COL_HALF)"
# -37.5 37.5 7.5  -> tower centre 7.5 m in from both edges, on a 15 m column
```

## Known limits

- Single-bounce lighting. Occluded sky samples return a flat bounce colour
  rather than a real second bounce, so deep interiors are slightly flatter
  than they would be in a path tracer.
- People are hi-vis coloured boxes at roughly 1.8 m. At these framings they are
  a handful of pixels and read as scale cues, not as figures. Do not crop in
  on them.
- No motion blur, so the rotor is frozen. A 15 MW rotor turning at ~7 rpm would
  show tip blur in a real photograph at any sensible shutter speed.
- Callout text is deliberately not rendered. The brief is right about this:
  generate clean plates, set the labels as flat vector type in post.
