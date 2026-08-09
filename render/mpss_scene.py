#!/usr/bin/env python3
"""
MPSS geometry, built strictly to the numbers in the brief.

Geometry lock (never varies between scenes)
-------------------------------------------
  deck                 90 m x 90 m flat box girder, no trusses, no bracing
  columns              four, 15 m x 15 m in plan, flat-sided, right-angled
  column centreline    7.5 m in from each deck edge  ->  75 m x 75 m spacing
                       (so the column's outer face is flush with the deck edge)
  pontoon              ONE continuous square ring, 15 m wide, joining all four
                       columns; outer edge on the 90 m line, inner edge at 60 m
  operating draft      27 m  (pontoon underside 27 m below the waterline)

Deck loadout (identical in every loaded scene, quay along the south edge)
------------------------------------------------------------------------
  NW quarter   15 MW wind turbine, tower centreline 7.5 m in from the north
               edge and 7.5 m in from the west edge -- i.e. dead centre on the
               NW column, so the rotor thrust and tower moment go straight
               down a column into the ring pontoon, not into the deck span.
  NE quarter   data centre, 40 ft container modules stacked three high,
               dry-cooler arrays on the roof, switch room at the base.
  SE quarter   BESS in 40 ft containers, single high, plus power-conversion
               and e-house modules, cable trays between the rows.
  SW quarter   CCS process block: CO2 knock-out drums, compression trains in
               an open steel frame, air coolers on top, pipe racks.
  centre       open cross corridor, the SPMT roll-on route, left clear.
"""

import math
import numpy as np

from mpss_raytracer import Scene, F32, norm, yaw_matrix, euler_matrix

# ---------------------------------------------------------------- geometry
DECK = 90.0
DECK_HALF = DECK / 2.0
DECK_THK = 7.0
COL = 15.0
COL_HALF = COL / 2.0
COL_INSET = 7.5                     # column centreline in from the deck edge
COL_C = DECK_HALF - COL_INSET       # 37.5 m -> 75 m centre spacing
PONT_H = 9.0
DRAFT = 27.0
AIRGAP = 20.0                       # deck underside above the waterline at sea

TOWER_BASE_D = 10.0                 # comfortably inside the 15 m column
HUB_HEIGHT = 150.0                  # above deck level
BLADE_LEN = 115.0
ROTOR_R = 118.0                     # ~236 m rotor, ~2.6 deck widths

CTR_L, CTR_W, CTR_H = 12.192, 2.438, 2.896   # 40 ft ISO container

# ---------------------------------------------------------------- materials
#          name                albedo (linear)        rough  tex
MATERIALS = [
    ('deck_paint',      (0.205, 0.215, 0.225), 0.90, 1),   # 0
    ('hull_navy',       (0.085, 0.105, 0.145), 0.78, 2),   # 1
    ('steel_grey',      (0.300, 0.315, 0.335), 0.82, 2),   # 2
    ('primer_red',      (0.230, 0.088, 0.055), 0.88, 2),   # 3
    ('ctr_blue',        (0.055, 0.085, 0.150), 0.70, 3),   # 4
    ('ctr_grey',        (0.230, 0.240, 0.250), 0.70, 3),   # 5
    ('ctr_white',       (0.430, 0.440, 0.445), 0.70, 3),   # 6
    ('concrete',        (0.250, 0.248, 0.238), 0.94, 4),   # 7
    ('safety_yellow',   (0.420, 0.300, 0.030), 0.85, 2),   # 8
    ('hi_vis',          (0.600, 0.470, 0.030), 0.85, 0),   # 9
    ('dark_steel',      (0.055, 0.058, 0.062), 0.72, 2),   # 10
    ('turbine_white',   (0.560, 0.570, 0.580), 0.55, 0),   # 11
    ('galv',            (0.330, 0.345, 0.360), 0.48, 0),   # 12
    ('rubber',          (0.022, 0.022, 0.024), 0.90, 0),   # 13
    ('pipe_grey',       (0.245, 0.252, 0.258), 0.60, 0),   # 14
    ('rust',            (0.150, 0.062, 0.032), 0.94, 2),   # 15
    ('orange',          (0.430, 0.150, 0.022), 0.80, 2),   # 16
    ('boot_black',      (0.030, 0.031, 0.033), 0.60, 2),   # 17
    ('glass_dark',      (0.030, 0.034, 0.040), 0.16, 0),   # 18
    ('grating',         (0.130, 0.135, 0.140), 0.85, 5),   # 19
    ('white_paint',     (0.480, 0.490, 0.495), 0.70, 2),   # 20
    ('green_deck',      (0.060, 0.115, 0.075), 0.88, 2),   # 21
]
MAT_ALB = np.array([m[1] for m in MATERIALS], F32)
MAT_ROUGH = np.array([m[2] for m in MATERIALS], F32)
MAT_TEX = np.array([m[3] for m in MATERIALS], np.int32)
M = {m[0]: i for i, m in enumerate(MATERIALS)}

_rng = np.random.default_rng(4711)


def jitter(scale=0.10):
    return (1.0 + _rng.uniform(-scale, scale, 3)).astype(F32)


# ---------------------------------------------------------------- helpers
def container(sc, cx, cy, cz, yaw, mat, group, tint=None):
    """40 ft ISO container; yaw 0 -> long axis east-west."""
    half = (CTR_L / 2, CTR_H / 2, CTR_W / 2)
    sc.box((cx, cy + CTR_H / 2, cz), half, mat, yaw=yaw,
           tint=tint if tint is not None else jitter(0.09), group=group)


def frame_bay(sc, x0, x1, z0, z1, y0, h, mat, group, nx=4, nz=4, post=0.42):
    """Open steel process frame: posts plus top and mid ring beams."""
    xs = np.linspace(x0, x1, nx)
    zs = np.linspace(z0, z1, nz)
    for x in xs:
        for z in zs:
            sc.box((x, y0 + h / 2, z), (post, h / 2, post), mat, group=group)
    for lev in (h * 0.52, h):
        for z in zs:
            sc.box(((x0 + x1) / 2, y0 + lev, z), ((x1 - x0) / 2 + post, 0.34, 0.30),
                   mat, group=group)
        for x in xs:
            sc.box((x, y0 + lev, (z0 + z1) / 2), (0.30, 0.34, (z1 - z0) / 2 + post),
                   mat, group=group)


def rail_line(sc, x0, x1, z0, z1, y, group, mat=None):
    """Perimeter rail run drawn as continuous rails (posts alias out at scale)."""
    mat = M['galv'] if mat is None else mat
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    hx, hz = abs(x1 - x0) / 2, abs(z1 - z0) / 2
    for hgt, th in ((1.10, 0.055), (0.55, 0.045)):
        sc.box((cx, y + hgt, cz), (max(hx, th), th, max(hz, th)), mat, group=group)
    sc.box((cx, y + 0.12, cz), (max(hx, 0.05), 0.12, max(hz, 0.05)),
           M['safety_yellow'], group=group)


def people(sc, spots, y, group):
    for (x, z) in spots:
        h = _rng.uniform(1.70, 1.86)
        sc.box((x, y + h / 2, z), (0.22, h / 2, 0.17), M['hi_vis'],
               yaw=float(_rng.uniform(0, 180)), group=group,
               tint=(1.0, 1.0 - _rng.uniform(0, .2), 1.0))


# ---------------------------------------------------------------- hull/deck
def add_deck(sc, ytop, group='deck'):
    """The 90 x 90 box-girder deck. Flat plate, right angles, no trusses."""
    yb = ytop - DECK_THK
    # deck plate (the walking surface gets its own material)
    sc.box((0, ytop - 0.13, 0), (DECK_HALF, 0.13, DECK_HALF),
           M['deck_paint'], group=group)
    # main girder box, very slightly inset so the deck edge casts a shadow line
    sc.box((0, (ytop - 0.26 + yb) / 2, 0),
           (DECK_HALF - 0.22, (ytop - 0.26 - yb) / 2, DECK_HALF - 0.22),
           M['hull_navy'], group=group)
    # side shell strakes -> horizontal break in the 7 m deep girder
    for zsgn in (-1, 1):
        sc.box((0, yb + DECK_THK * 0.30, zsgn * (DECK_HALF - 0.05)),
               (DECK_HALF - 0.3, 0.16, 0.16), M['steel_grey'], group=group)
    for xsgn in (-1, 1):
        sc.box((xsgn * (DECK_HALF - 0.05), yb + DECK_THK * 0.30, 0),
               (0.16, 0.16, DECK_HALF - 0.3), M['steel_grey'], group=group)
    # perimeter rails, opened up on the south edge for the roll-on route
    rail_line(sc, -DECK_HALF + .3, DECK_HALF - .3, DECK_HALF - .5, DECK_HALF - .5, ytop, group)
    rail_line(sc, -DECK_HALF + .3, -DECK_HALF + .3, -DECK_HALF + .5, DECK_HALF - .5, ytop, group)
    rail_line(sc, DECK_HALF - .3, DECK_HALF - .3, -DECK_HALF + .5, DECK_HALF - .5, ytop, group)
    for x0, x1 in ((-DECK_HALF + .3, -14.0), (14.0, DECK_HALF - .3)):
        rail_line(sc, x0, x1, -DECK_HALF + .5, -DECK_HALF + .5, ytop, group)


def add_hull(sc, deck_bottom, group='hull'):
    """Four square columns on a single continuous square ring pontoon."""
    pb, pt = -DRAFT, -DRAFT + PONT_H          # pontoon bottom / top
    ring_out, ring_in = DECK_HALF, DECK_HALF - COL
    cy = (pt + deck_bottom) / 2
    ch = (deck_bottom - pt) / 2
    for sx in (-1, 1):
        for sz in (-1, 1):
            sc.box((sx * COL_C, cy, sz * COL_C), (COL_HALF, ch, COL_HALF),
                   M['hull_navy'], group=group)
            # boot-top band at the waterline
            sc.box((sx * COL_C, 1.6, sz * COL_C),
                   (COL_HALF + 0.06, 3.2, COL_HALF + 0.06),
                   M['boot_black'], group=group)
            # column top haunch into the deck
            sc.box((sx * COL_C, deck_bottom - 1.0, sz * COL_C),
                   (COL_HALF + 0.9, 1.0, COL_HALF + 0.9), M['hull_navy'], group=group)
    mid = (pb + pt) / 2
    hh = PONT_H / 2
    span = (ring_out + ring_in) / 2
    for sz in (-1, 1):     # north and south pontoon legs, full width
        sc.box((0, mid, sz * span), (ring_out, hh, COL_HALF), M['hull_navy'], group=group)
    for sx in (-1, 1):     # east and west legs, trimmed so the ring is closed once
        sc.box((sx * span, mid, 0), (COL_HALF, hh, ring_in), M['hull_navy'], group=group)


# ---------------------------------------------------------------- turbine
def add_turbine(sc, ytop, group='turbine', azimuth=155.0, spin=60.0):
    """15 MW machine on the NW column centreline: x = -37.5, z = +37.5."""
    tx, tz = -COL_C, COL_C
    base_r = TOWER_BASE_D / 2
    sc.cyl((tx, ytop, tz), (0, 1, 0), 2.0, base_r + 0.55, base_r + 0.35,
           M['steel_grey'], group=group)
    sc.cyl((tx, ytop + 1.9, tz), (0, 1, 0), HUB_HEIGHT - 8.0, base_r, 2.65,
           M['turbine_white'], group=group)
    sc.box((tx - base_r - 0.05, ytop + 1.6, tz), (0.25, 1.2, 0.9),
           M['dark_steel'], group=group)   # tower door

    # rotor axis: tilted 5 deg, pointing out over the corner
    a = math.radians(azimuth)
    tilt = math.radians(5.0)
    ax = np.array([math.sin(a) * math.cos(tilt), math.sin(tilt),
                   math.cos(a) * math.cos(tilt)], F32)
    ax = norm(ax)
    up = np.array([0, 1, 0], F32)
    side = norm(np.cross(up, ax))
    vert = np.cross(ax, side)

    top = np.array([tx, ytop + HUB_HEIGHT - 6.0, tz], F32)
    nac_c = top + vert * 4.6 - ax * 1.5
    Mn = np.stack([side, vert, ax], axis=1).astype(F32)
    sc.box(nac_c, (5.2, 4.4, 11.5), M['turbine_white'], M=Mn, group=group)
    sc.box(nac_c + vert * 4.6, (3.4, 0.35, 7.0), M['galv'], M=Mn, group=group)

    hub = nac_c + ax * 12.0
    sc.cyl(hub - ax * 3.0, ax, 6.0, 3.4, 3.6, M['turbine_white'], group=group)
    sc.cyl(hub + ax * 3.0, ax, 4.2, 3.6, 0.7, M['turbine_white'], group=group)

    # three blades: 6 tapered segments each, with twist and prebend
    prof_r = np.array([3.0, 22.0, 45.0, 68.0, 91.0, 106.0, ROTOR_R], F32)
    chord = np.array([3.2, 6.4, 5.3, 4.0, 2.9, 1.9, 0.7], F32)
    thick = np.array([2.9, 2.2, 1.5, 0.95, 0.60, 0.36, 0.14], F32)
    twist = np.array([14.0, 9.0, 5.0, 2.5, 1.0, 0.2, 0.0], F32)
    for b in range(3):
        phi = math.radians(spin + b * 120.0)
        span = norm(side * math.cos(phi) + vert * math.sin(phi))
        for s in range(len(prof_r) - 1):
            r0, r1 = float(prof_r[s]), float(prof_r[s + 1])
            rm = 0.5 * (r0 + r1)
            c = float(0.5 * (chord[s] + chord[s + 1]))
            t = float(0.5 * (thick[s] + thick[s + 1]))
            tw = math.radians(float(0.5 * (twist[s] + twist[s + 1])))
            ch_dir = norm(np.cross(span, ax))
            th_dir = norm(np.cross(ch_dir, span))
            cd = ch_dir * math.cos(tw) + th_dir * math.sin(tw)
            td = norm(np.cross(cd, span))
            Mb = np.stack([norm(cd), span, td], axis=1).astype(F32)
            prebend = ax * (0.0035 * rm * rm / 10.0)
            centre = hub + span * rm + prebend
            sc.box(centre, (c / 2, (r1 - r0) / 2, t / 2),
                   M['turbine_white'], M=Mb, group=group)


# ---------------------------------------------------------------- modules
def add_bess(sc, y, group='bess'):
    """SE quarter: containerised battery storage + power conversion."""
    pal = [M['ctr_white'], M['ctr_grey'], M['ctr_white'], M['ctr_grey']]
    for r, z in enumerate((-11.6, -16.2, -20.8, -25.4, -30.0, -34.6, -39.2)):
        for c, x in enumerate((14.6, 27.4)):
            container(sc, x, y + 0.35, z, 0.0, pal[(r + c) % len(pal)], group)
            sc.box((x, y + 0.17, z), (CTR_L / 2 - 0.2, 0.18, CTR_W / 2 - 0.1),
                   M['dark_steel'], group=group)
        # HVAC / fire panels on the row ends
        sc.box((34.9, y + 1.2, z), (1.1, 1.2, 0.9), M['ctr_grey'], group=group)
    # power conversion / e-house modules along the east edge
    for z in (-12.5, -21.0, -29.5, -38.0):
        sc.box((39.4, y + 2.3, z), (3.4, 2.3, 4.0), M['ctr_grey'],
               group=group, tint=jitter(0.06))
        sc.box((39.4, y + 4.75, z), (2.6, 0.15, 3.0), M['galv'], group=group)
        sc.box((36.2, y + 1.8, z), (0.6, 1.8, 2.4), M['steel_grey'], group=group)
    # cable rack spine + branches
    sc.box((34.0, y + 1.85, -25.4), (0.55, 0.13, 14.6), M['galv'], group=group)
    for z in (-11.6, -16.2, -20.8, -25.4, -30.0, -34.6, -39.2):
        sc.box((25.0, y + 1.85, z), (9.5, 0.11, 0.45), M['galv'], group=group)
    # transformers
    for x, z in ((9.5, -43.0), (17.5, -43.0), (25.5, -43.0), (33.0, -43.0)):
        sc.box((x, y + 2.0, z), (2.6, 2.0, 2.2), M['steel_grey'], group=group)
        for dx in (-1.7, 0.0, 1.7):
            sc.cyl((x + dx, y + 4.0, z), (0, 1, 0), 1.5, 0.35, 0.30,
                   M['galv'], group=group)


def add_datacentre(sc, y, group='data'):
    """NE quarter: container modules stacked three high + dry coolers."""
    pal = [M['ctr_white'], M['ctr_grey'], M['ctr_blue'], M['ctr_white'], M['ctr_grey']]
    xs = [9.8 + i * 2.62 for i in range(13)]
    zs = [16.4, 30.4]
    for lvl in range(3):
        yb = y + 0.45 + lvl * (CTR_H + 0.10)
        for zi, z in enumerate(zs):
            for xi, x in enumerate(xs):
                container(sc, x, yb, z, 90.0, pal[(xi + zi * 2 + lvl) % len(pal)], group)
    # structural frame that actually carries the stack
    for x in (8.4, 42.0):
        sc.box((x, y + 4.9, 23.4), (0.35, 4.9, 14.4), M['steel_grey'], group=group)
    for z in (9.7, 23.4, 37.1):
        sc.box((25.2, y + 4.9, z), (16.8, 4.9, 0.35), M['steel_grey'], group=group)
    sc.box((25.2, y + 0.22, 23.4), (17.0, 0.22, 14.6), M['dark_steel'], group=group)
    # dry-cooler array on the roof
    ytop_ctr = y + 0.45 + 3 * (CTR_H + 0.10)
    sc.box((25.2, ytop_ctr + 0.2, 23.4), (12.6, 0.2, 10.4), M['galv'], group=group)
    for cx in (16.5, 23.0, 29.5, 36.0):
        for cz in (16.6, 23.4, 30.2):
            sc.box((cx, ytop_ctr + 1.3, cz), (2.7, 1.1, 3.6),
                   M['galv'], group=group, tint=jitter(0.05))
            for dz in (-1.9, 1.9):
                sc.cyl((cx, ytop_ctr + 2.4, cz + dz), (0, 1, 0), 0.42, 1.35, 1.45,
                       M['dark_steel'], group=group)
    # switch room / MV room at the base, south face
    sc.box((25.2, y + 2.4, 8.2), (15.0, 2.4, 2.4), M['ctr_grey'], group=group)
    sc.box((25.2, y + 4.95, 8.2), (14.0, 0.15, 1.9), M['galv'], group=group)
    for x in (11.0, 20.0, 29.0, 38.0):     # standby gensets on the north edge
        sc.box((x, y + 1.8, 40.4), (3.6, 1.8, 1.9), M['ctr_grey'],
               group=group, tint=jitter(0.07))
        sc.cyl((x + 2.6, y + 5.4, 40.4), (0, 1, 0), 3.4, 0.36, 0.30,
               M['dark_steel'], group=group)
    # stair tower
    sc.box((43.0, y + 5.4, 12.0), (1.7, 5.4, 1.7), M['steel_grey'], group=group)
    for lvl in range(1, 4):
        sc.box((42.0, y + lvl * 3.0, 12.0), (2.9, 0.10, 1.5), M['grating'], group=group)


def add_ccs(sc, y, group='ccs'):
    """SW quarter: CO2 knock-out drums, compression trains, air coolers."""
    frame_bay(sc, -41.5, -11.5, -41.0, -20.0, y, 14.0, M['steel_grey'], group,
              nx=5, nz=4)
    # deck plates at two levels inside the frame
    for lev in (7.3, 14.0):
        sc.box((-26.5, y + lev + 0.12, -30.5), (15.3, 0.12, 10.8),
               M['grating'], group=group)
    # compression trains under the frame: casing + motor + skid
    for i, z in enumerate((-38.5, -33.0, -27.5, -22.0)):
        sc.box((-27.0, y + 0.6, z), (11.0, 0.6, 2.2), M['dark_steel'], group=group)
        sc.cyl((-33.0, y + 2.6, z), (1, 0, 0), 8.0, 1.45, 1.45,
               M['pipe_grey'], group=group)
        sc.box((-21.5, y + 2.6, z), (3.0, 1.7, 1.7), M['steel_grey'], group=group)
        sc.cyl((-34.2, y + 2.6, z), (1, 0, 0), 1.2, 1.7, 1.7,
               M['steel_grey'], group=group)
    # vertical CO2 knock-out drums on skirts, north edge of the block
    for x in (-39.0, -33.0, -27.0, -21.0, -15.0):
        sc.cyl((x, y + 0.2, -16.5), (0, 1, 0), 3.0, 2.35, 2.35,
               M['steel_grey'], group=group)
        sc.cyl((x, y + 3.2, -16.5), (0, 1, 0), 15.0, 2.35, 2.35,
               M['white_paint'], group=group)
        sc.cyl((x, y + 18.2, -16.5), (0, 1, 0), 2.2, 2.35, 0.5,
               M['white_paint'], group=group)
        for lev in (7.0, 13.0):
            sc.cyl((x, y + lev, -16.5), (0, 1, 0), 0.12, 3.9, 3.9,
                   M['grating'], group=group)
    # air coolers on top of the frame
    for cx in (-37.0, -29.5, -22.0, -14.5):
        for cz in (-36.5, -28.5, -22.0):
            sc.box((cx, y + 15.4, cz), (3.4, 1.2, 4.0), M['galv'], group=group)
            for dz in (-2.1, 2.1):
                sc.cyl((cx, y + 16.7, cz + dz), (0, 1, 0), 0.45, 1.6, 1.7,
                       M['dark_steel'], group=group)
    # pipe rack running east along the corridor edge, two tiers
    for i, (lev, r, dz) in enumerate(((2.2, 0.55, 0.0), (2.2, 0.30, 1.3),
                                      (3.4, 0.42, 0.2), (3.4, 0.22, 1.2))):
        sc.cyl((-42.0, y + lev, -11.0 - dz), (1, 0, 0), 34.0, r, r,
               M['pipe_grey'], group=group)
    for x in np.arange(-40.0, -8.0, 6.0):
        sc.box((float(x), y + 1.8, -11.6), (0.28, 1.8, 1.5), M['steel_grey'], group=group)
    # injection wellhead / metering skid toward the corridor
    sc.box((-11.5, y + 1.7, -30.0), (2.2, 1.7, 3.2), M['ctr_grey'], group=group)
    sc.cyl((-11.5, y + 3.4, -30.0), (0, 1, 0), 4.0, 0.5, 0.4, M['orange'], group=group)


def add_turbine_plant(sc, y, group='wtgplant'):
    """What actually sits under a 15 MW machine: converter, transformer, HV."""
    sc.box((-19.5, y + 3.2, 31.0), (6.4, 3.2, 4.6), M['ctr_grey'], group=group)
    sc.box((-19.5, y + 6.6, 31.0), (5.6, 0.2, 3.8), M['galv'], group=group)
    sc.box((-19.5, y + 2.6, 21.5), (5.2, 2.6, 3.4), M['ctr_grey'], group=group)
    for dx in (-3.0, 0.0, 3.0):
        sc.cyl((-19.5 + dx, y + 5.3, 21.5), (0, 1, 0), 1.7, 0.38, 0.32,
               M['galv'], group=group)
    for z in (12.0, 16.4):                      # HV switchgear / spares row
        for x in (-40.0, -32.5):
            container(sc, x, y + 0.3, z, 0.0, M['ctr_grey'], group)
    sc.box((-30.0, y + 1.6, 40.0), (9.0, 1.6, 2.6), M['ctr_white'], group=group)
    # cable trays from the tower base out to the corridor and to the switchgear
    sc.box((-28.0, y + 1.5, 37.5), (9.0, 0.12, 0.55), M['galv'], group=group)
    sc.box((-19.2, y + 1.5, 24.0), (0.55, 0.12, 13.8), M['galv'], group=group)
    sc.box((-13.5, y + 1.5, 14.0), (6.2, 0.12, 0.55), M['galv'], group=group)
    # blade / nacelle spares cradles on the bare plate
    for i, z in enumerate((25.0, 28.5)):
        sc.box((-38.0, y + 1.0, z), (3.4, 1.0, 1.1), M['steel_grey'], group=group)
    people(sc, [(-24.0, 33.0), (-21.0, 27.0), (-33.0, 14.0), (-16.0, 12.0)], y, group)


def add_deck_details(sc, y, group='deckdet'):
    """Small things that give the 90 m deck its scale."""
    # lifeboat / muster point on the south-east corner
    sc.box((41.0, y + 1.6, -6.0), (2.4, 1.4, 1.3), M['orange'], group=group)
    sc.box((41.0, y + 3.3, -6.0), (0.25, 1.9, 0.25), M['steel_grey'], group=group)
    # crane pedestal on the north-east corner
    sc.cyl((41.0, y, 41.0), (0, 1, 0), 7.0, 1.9, 1.7, M['steel_grey'], group=group)
    sc.box((41.0, y + 8.3, 41.0), (2.4, 1.5, 3.2), M['safety_yellow'], group=group)
    head = np.array([41.0, y + 9.2, 41.0], F32)
    bdir = norm(np.array([0.62, 0.72, -0.31], F32))
    sc.cyl(head, bdir, 26.0, 0.55, 0.34, M['safety_yellow'], group=group)
    btip = head + bdir * 26.0
    sc.cyl(btip, (0, -1, 0), 12.0, 0.04, 0.04, M['dark_steel'], group=group)
    sc.box(btip + np.array([0.0, -12.6, 0.0], F32), (0.45, 0.7, 0.45),
           M['dark_steel'], group=group)
    # light masts
    for x, z in ((-6.5, -41.0), (6.5, 41.0), (-41.0, -6.5), (41.0, 20.0)):
        sc.cyl((x, y, z), (0, 1, 0), 11.0, 0.30, 0.22, M['galv'], group=group)
        sc.box((x, y + 11.3, z), (0.9, 0.25, 0.5), M['galv'], group=group)
    # bare-plate footprints kept clear + a few pallets/skids in the corridor
    for x, z, w, d in ((-3.0, -20.0, 2.4, 1.6), (3.5, 12.0, 1.8, 1.8),
                       (0.0, 30.0, 3.0, 2.0), (-2.0, -2.0, 2.2, 2.2)):
        sc.box((x, y + 0.55, z), (w / 2, 0.55, d / 2), M['steel_grey'], group=group)
    spots = [(-2.0, -12.0), (1.5, -12.8), (4.0, 6.0), (-5.0, 20.0), (9.5, -10.0),
             (-9.0, -10.5), (-14.0, 30.0), (-24.0, 33.0), (-31.0, 30.0),
             (20.0, 6.5), (30.0, 5.5), (-2.5, 40.0), (2.0, -40.0), (-33.0, 41.0),
             (12.0, -8.0), (-8.0, 3.0), (0.5, 24.0), (-20.0, -8.5), (26.0, -8.0)]
    people(sc, spots, y, group)


# ---------------------------------------------------------------- the yard
def add_quay(sc, ytop, group='quay'):
    """Concrete quay along the south edge, its surface level with the deck."""
    sc.box((0.0, ytop - 9.0, -272.0), (720.0, 9.0, 224.0), M['concrete'], group=group)
    sc.box((0.0, ytop - 0.9, -48.6), (720.0, 0.9, 0.6), M['dark_steel'], group=group)
    for z in (-49.6,):
        for x in np.arange(-300.0, 301.0, 14.0):
            sc.cyl((float(x), ytop - 2.6, z), (0, 0, 1), 1.2, 1.3, 1.3,
                   M['rubber'], group=group)
    for x in np.arange(-310.0, 311.0, 22.0):
        sc.cyl((float(x), ytop, -52.5), (0, 1, 0), 1.15, 0.42, 0.50,
               M['dark_steel'], group=group)
    # link-span ramp onto the deck (the SPMT roll-on route)
    sc.box((0.0, ytop - 0.25, -47.4), (13.0, 0.25, 3.4), M['steel_grey'], group=group)
    for sx in (-1, 1):
        sc.box((sx * 13.2, ytop + 0.55, -47.4), (0.25, 0.55, 3.4),
               M['safety_yellow'], group=group)
    # mooring lines from the deck edge down to the bollards
    for x, bx in ((-30.0, -62.0), (-16.0, -40.0), (16.0, 40.0), (30.0, 62.0)):
        p0 = np.array([x, ytop + 0.6, -DECK_HALF], F32)
        p1 = np.array([bx, ytop + 0.7, -52.5], F32)
        d = p1 - p0
        sc.cyl(p0, d, float(np.linalg.norm(d)), 0.055, 0.055,
               M['dark_steel'], group=group)


def add_apron(sc, ytop, group='apron'):
    """The working apron immediately behind the quay edge, near the ramp."""
    _r = np.random.default_rng(88)
    # module laydown waiting to roll on: skids on timber, grillage, cribbing
    for x, z in ((-72, -62), (-58, -62), (-72, -74), (-58, -74),
                 (54, -64), (68, -64), (54, -76)):
        sc.box((x, ytop + 0.45, z), (5.6, 0.45, 2.4), M['dark_steel'], group=group)
        sc.box((x, ytop + 2.6, z), (5.0, 1.7, 2.0), M['ctr_grey'],
               group=group, tint=jitter(0.07))
    for x, z in ((-100, -66), (-100, -78), (96, -70), (110, -70)):
        for k in range(3):
            sc.box((x, ytop + 0.25 + k * 0.5, z), (4.0, 0.25, 1.4),
                   M['rust'], group=group)
    # steel plate stacks and pipe bundles
    for i in range(9):
        x = float(_r.uniform(-210, 210)); z = float(_r.uniform(-108, -62))
        sc.box((x, ytop + 0.55, z), (4.6, 0.55, 2.8), M['primer_red'],
               group=group, tint=jitter(0.08))
    for i in range(7):
        x = float(_r.uniform(-190, 190)); z = float(_r.uniform(-120, -70))
        for k in range(3):
            sc.cyl((x - 5.0, ytop + 0.5 + k * 0.85, z + k * 0.45), (1, 0, 0), 10.0,
                   0.48, 0.48, M['pipe_grey'], group=group)
    # site huts, welfare cabins and stores
    for i in range(14):
        x = float(_r.uniform(-260, 260)); z = float(_r.uniform(-135, -72))
        container(sc, x, ytop, z, float(_r.choice([0.0, 90.0])),
                  [M['ctr_blue'], M['ctr_white'], M['ctr_grey']][i % 3], group)
    # trucks and trailers on the apron road
    for i, (x, z) in enumerate(((-140, -56), (-40, -58), (34, -56), (150, -58),
                                (-190, -60), (200, -56))):
        sc.box((x, ytop + 1.6, z), (7.5, 1.5, 1.4), M['ctr_grey'],
               group=group, tint=jitter(0.1))
        sc.box((x - 8.2, ytop + 1.5, z), (1.7, 1.5, 1.3),
               [M['orange'], M['ctr_blue'], M['ctr_white']][i % 3], group=group)
    # mobile telehandlers / vans, small and yellow
    for x, z in ((-16, -54), (12, -66), (-88, -55), (72, -58), (128, -66)):
        sc.box((x, ytop + 1.2, z), (2.6, 1.2, 1.1), M['safety_yellow'], group=group)
    people(sc, [(-6, -52), (-2, -53), (3, -52), (18, -55), (-22, -57), (44, -54),
                (-46, -56), (62, -60), (-64, -53), (86, -57), (-110, -58),
                (104, -62), (-130, -55), (140, -60)], ytop, group)


def add_yard(sc, ytop, group='yard'):
    """Ordinary fabrication-yard clutter behind the quay edge."""
    # 600 t crawler crane working alongside, boom slewed away from the deck
    cx, cz = 132.0, -74.0
    for dz in (-3.8, 3.8):                      # crawler tracks
        sc.box((cx, ytop + 0.85, cz + dz), (6.4, 0.85, 1.5), M['dark_steel'], group=group)
        sc.box((cx, ytop + 1.5, cz + dz), (6.6, 0.35, 1.7), M['steel_grey'], group=group)
    sc.box((cx, ytop + 2.1, cz), (5.4, 0.6, 4.2), M['dark_steel'], group=group)
    sc.box((cx, ytop + 4.0, cz), (4.6, 1.5, 3.6), M['safety_yellow'], group=group)
    sc.box((cx + 4.6, ytop + 3.9, cz), (1.6, 2.2, 3.4), M['dark_steel'], group=group)
    sc.box((cx - 3.4, ytop + 5.9, cz - 2.6), (1.3, 1.3, 1.1), M['ctr_grey'], group=group)

    base = np.array([cx - 3.0, ytop + 5.0, cz], F32)
    bd = norm(np.array([-0.33, 0.944, 0.0], F32))       # leans west, 71 deg
    boom_len = 66.0
    side = np.array([0.0, 0.0, 1.0], F32)
    upv = norm(np.cross(side, bd))
    for ox, oy in ((-1.15, -1.15), (1.15, -1.15), (-1.15, 1.15), (1.15, 1.15)):
        sc.cyl(base + side * ox + upv * oy, bd, boom_len, 0.20, 0.15,
               M['safety_yellow'], group=group)
    for k in range(1, 22):                      # lacing: rungs plus diagonals
        p = base + bd * (k * 3.0)
        sc.box(p, (0.09, 0.09, 1.25), M['safety_yellow'],
               M=np.stack([upv, bd, side], axis=1).astype(F32), group=group)
        diag = norm(bd * 3.0 + side * (2.3 if k % 2 else -2.3))
        sc.cyl(p - side * (1.15 if k % 2 else -1.15), diag, 3.8, 0.07, 0.07,
               M['safety_yellow'], group=group)
    # A-frame mast and pendant back to the counterweight
    mast = norm(np.array([0.55, 0.84, 0.0], F32))
    sc.cyl(base, mast, 16.0, 0.22, 0.16, M['safety_yellow'], group=group)
    tip = base + bd * boom_len
    top = base + mast * 16.0
    dd = tip - top
    sc.cyl(top, dd, float(np.linalg.norm(dd)), 0.05, 0.05, M['dark_steel'], group=group)
    # falls, hook block and a module on the hook
    sc.cyl(tip, (0, -1, 0), 44.0, 0.055, 0.055, M['dark_steel'], group=group)
    hook = tip + np.array([0.0, -45.0, 0.0], F32)
    sc.box(hook, (0.55, 1.1, 0.55), M['dark_steel'], group=group)
    sc.box(hook + np.array([0.0, -3.4, 0.0], F32), (5.2, 2.0, 2.6),
           M['ctr_grey'], group=group)
    for sx in (-4.4, 4.4):
        sc.cyl(hook + np.array([sx, -3.4, 0.0], F32), (0, 1, 0), 2.2,
               0.05, 0.05, M['dark_steel'], group=group)

    # SPMT with a module still on it
    sc.box((-30.0, ytop + 0.75, -60.0), (9.0, 0.75, 3.2), M['dark_steel'], group=group)
    sc.box((-30.0, ytop + 3.2, -60.0), (7.4, 1.7, 2.7), M['ctr_grey'], group=group)
    sc.box((-46.0, ytop + 0.75, -58.0), (7.0, 0.75, 3.0), M['dark_steel'], group=group)

    # laydown: container stacks, plate stacks, sheds
    for i, (x, z) in enumerate(((-96, -74), (-96, -80), (-78, -74), (-78, -80),
                                (62, -72), (62, -78), (80, -72), (128, -76),
                                (128, -82), (146, -76), (-150, -70), (-150, -76),
                                (-168, -70), (196, -90), (196, -96), (214, -90),
                                (-232, -84), (-232, -90), (-214, -84))):
        for lvl in range(2 if i % 3 else 3):
            container(sc, float(x), ytop + lvl * CTR_H, float(z), 0.0,
                      [M['ctr_blue'], M['ctr_grey'], M['ctr_white'],
                       M['ctr_grey']][(i + lvl) % 4], group)
    for x in (-8.0, 2.0, 12.0):
        sc.box((x, ytop + 0.9, -84.0), (4.2, 0.9, 2.4), M['rust'], group=group)
    for x, z, w, d, h in ((-140, -140, 26, 18, 12), (-60, -170, 34, 20, 15),
                          (60, -150, 30, 22, 14), (150, -134, 24, 16, 11),
                          (-300, -128, 40, 26, 18), (300, -150, 36, 24, 16),
                          (-430, -180, 46, 30, 20), (450, -200, 42, 28, 19),
                          (-90, -250, 52, 34, 22), (170, -270, 48, 30, 21),
                          (-560, -240, 38, 24, 15), (580, -260, 44, 28, 17)):
        sc.box((x, ytop + h / 2, z), (w, h / 2, d), M['steel_grey'],
               group=group, tint=jitter(0.05))
        sc.box((x, ytop + h + 0.4, z), (w + 0.6, 0.4, d + 0.6),
               M['ctr_grey'], group=group)
    for x in (-620.0, -480.0, -340.0, -200.0, -120.0, -40.0, 40.0, 120.0,
              200.0, 340.0, 480.0, 620.0):
        sc.cyl((x, ytop, -95.0), (0, 1, 0), 24.0, 0.55, 0.40, M['galv'], group=group)
        sc.box((x, ytop + 24.6, -95.0), (1.6, 0.35, 0.8), M['galv'], group=group)
    # portal quay cranes far along the quay (ordinary, not heavy lift)
    for x in (-175.0, 175.0, -390.0, 400.0, -600.0, 620.0):
        for dz in (-58.0, -78.0):
            sc.box((x, ytop + 16.0, dz), (1.2, 16.0, 1.2), M['ctr_grey'], group=group)
        sc.box((x, ytop + 33.0, -68.0), (1.6, 1.6, 12.0), M['ctr_grey'], group=group)
        sc.cyl((x, ytop + 34.0, -68.0), (0, 0, 1), 44.0, 0.9, 0.7,
               M['ctr_grey'], group=group)
    people(sc, [(-14, -56), (-10, -57), (34, -60), (36, -61), (-52, -62),
                (8, -70), (-70, -66), (52, -64)], ytop, group)


def add_far_bank(sc, ytop, group='farbank'):
    """The far side of the basin: an ordinary working port on the horizon."""
    z0 = 900.0
    sc.box((0.0, ytop - 10.0, z0 + 330.0), (2200.0, 10.0, 330.0),
           M['concrete'], group=group)
    sc.box((0.0, ytop - 2.4, z0 - 0.6), (2200.0, 2.4, 0.9), M['dark_steel'], group=group)
    _r = np.random.default_rng(31)
    for i in range(34):
        x = float(_r.uniform(-1500, 1500))
        w = float(_r.uniform(22, 78))
        d = float(_r.uniform(18, 46))
        h = float(_r.uniform(10, 34))
        sc.box((x, ytop + h / 2, z0 + float(_r.uniform(40, 300))),
               (w, h / 2, d), M['steel_grey'], group=group, tint=jitter(0.07))
    for i in range(12):                      # portal cranes along the far quay
        x = float(_r.uniform(-1400, 1400))
        for dz in (18.0, 46.0):
            sc.box((x, ytop + 19.0, z0 + dz), (1.5, 19.0, 1.5),
                   M['ctr_grey'], group=group)
        sc.cyl((x, ytop + 39.0, z0 + 6.0), (0, 0, 1), 58.0, 1.1, 0.8,
               M['ctr_grey'], group=group)
    for i in range(40):                      # container stacks
        x = float(_r.uniform(-1450, 1450))
        z = z0 + float(_r.uniform(6, 60))
        for lvl in range(int(_r.integers(2, 5))):
            container(sc, x, ytop + lvl * CTR_H, z, 0.0,
                      [M['ctr_blue'], M['ctr_grey'], M['ctr_white']][lvl % 3], group)
    for i in range(12):                      # chimney / mast silhouettes
        sc.cyl((float(_r.uniform(-1500, 1500)), ytop, z0 + float(_r.uniform(80, 320))),
               (0, 1, 0), float(_r.uniform(22, 48)), 0.9, 0.6, M['galv'], group=group)


def add_basin_traffic(sc, group='traffic'):
    """Flat-top barges and a tug in the basin -- modules arrive by water."""
    def barge(x0, z0, yaw, L, W, cargo):
        Mv = yaw_matrix(yaw)

        def put(c, h, mat, tint=(1, 1, 1)):
            cw = Mv @ np.asarray(c, F32) + np.array([x0, 0.0, z0], F32)
            sc.box(cw, h, mat, M=Mv, tint=tint, group=group)
        put((0, 1.1, 0), (L / 2, 2.2, W / 2), M['rust'])
        put((0, -0.8, 0), (L / 2 - 0.4, 1.2, W / 2 + 0.1), M['boot_black'])
        put((0, 3.4, 0), (L / 2, 0.25, W / 2), M['steel_grey'])
        for i, dx in enumerate(cargo):
            put((dx, 5.6, 0.0), (6.5, 2.0, W / 2 - 2.0),
                [M['ctr_grey'], M['ctr_white'], M['steel_grey']][i % 3])

    barge(-118.0, 96.0, 24.0, 78.0, 24.0, (-20.0, 4.0, 26.0))
    barge(148.0, 186.0, -8.0, 66.0, 22.0, (-14.0, 12.0))

    # tug standing off the deck's north face
    Mv = yaw_matrix(63.0)
    base = np.array([-104.0, 0.0, -6.0], F32)

    def tput(c, h, mat):
        sc.box(Mv @ np.asarray(c, F32) + base, h, mat, M=Mv, group=group)
    tput((0, 1.4, 0), (13.0, 2.6, 4.6), M['boot_black'])
    tput((0, 4.2, 0), (13.0, 1.2, 4.8), M['hull_navy'])
    tput((-1.0, 6.6, 0), (5.0, 2.2, 3.8), M['white_paint'])
    tput((-1.0, 9.4, 0), (3.0, 1.0, 3.0), M['white_paint'])
    tput((6.0, 5.8, 0), (2.2, 1.4, 3.0), M['orange'])
    sc.cyl(base + Mv @ np.array([-2.0, 10.4, 0.0], F32), (0, 1, 0), 6.0, 0.5, 0.4,
           M['dark_steel'], group=group)


def add_supply_vessel(sc, x0, z0, yaw_deg, group='vessel'):
    """Platform supply vessel alongside, for scale (Scene 7)."""
    Mv = yaw_matrix(yaw_deg)

    def put(c, h, mat, tint=(1, 1, 1)):
        cw = Mv @ np.asarray(c, F32) + np.array([x0, 0.0, z0], F32)
        sc.box(cw, h, mat, M=Mv, tint=tint, group=group)

    put((0, 1.2, 0), (38.0, 4.2, 8.2), M['hull_navy'])
    put((0, -1.4, 0), (37.0, 2.0, 8.4), M['boot_black'])
    put((0, 4.6, 0), (38.0, 1.0, 8.6), M['steel_grey'])
    put((-6.0, 5.6, 0), (22.0, 0.35, 7.6), M['green_deck'])
    put((24.0, 9.0, 0), (12.0, 4.6, 7.4), M['white_paint'])
    put((26.0, 14.4, 0), (7.0, 1.6, 6.4), M['white_paint'])
    put((26.0, 16.6, 0), (5.0, 0.8, 5.4), M['glass_dark'])
    for dz in (-4.0, 4.0):
        cw = Mv @ np.array([28.0, 20.0, dz], F32) + np.array([x0, 0, z0], F32)
        sc.cyl(cw, (0, 1, 0), 9.0, 0.22, 0.16, M['galv'], group=group)
    for i, dx in enumerate((-24.0, -16.0, -8.0)):
        put((dx, 7.2, 2.0), (3.2, 1.5, 2.6), [M['ctr_blue'], M['ctr_grey'],
                                              M['ctr_white']][i % 3])
    put((10.0, 8.4, -5.0), (2.0, 2.8, 2.0), M['orange'])


# ---------------------------------------------------------------- scenes
def scene_quay_loaded(loaded=True):
    """Scene 5 -- fully loaded deck alongside the quay, hull not yet mated.

    Deck underside inches above the waterline, quay surface level with the
    deck, no ultra-heavy-lift crane and no floating sheerleg anywhere.
    """
    sc = Scene()
    ytop = 7.35                       # deck underside 0.35 m above the water
    add_deck(sc, ytop)
    if loaded:
        add_turbine(sc, ytop)
        add_datacentre(sc, ytop)
        add_bess(sc, ytop)
        add_ccs(sc, ytop)
        add_turbine_plant(sc, ytop)
        add_deck_details(sc, ytop)
    add_quay(sc, ytop)
    add_apron(sc, ytop)
    add_yard(sc, ytop)
    add_far_bank(sc, ytop)
    add_basin_traffic(sc)
    env = dict(
        water='harbour',
        water_y=0.0,
        deck_top=ytop,
        fog_density=0.00008,
        detail_fade=420.0,
        horizon_props=True,
    )
    return sc.build(), env


def scene_on_station():
    """Scene 7 -- on station at the 27 m operating draft, moderate 3-4 m sea."""
    sc = Scene()
    ytop = AIRGAP + DECK_THK          # deck underside 20 m above the waterline
    add_deck(sc, ytop)
    add_hull(sc, AIRGAP)
    add_turbine(sc, ytop, azimuth=158.0, spin=60.0)
    add_datacentre(sc, ytop)
    add_bess(sc, ytop)
    add_ccs(sc, ytop)
    add_turbine_plant(sc, ytop)
    add_deck_details(sc, ytop)
    add_supply_vessel(sc, 104.0, 96.0, -30.0)
    env = dict(
        water='sea',
        water_y=0.0,
        deck_top=ytop,
        fog_density=0.00013,
        detail_fade=1300.0,
        horizon_props=False,
        wash=tuple((sx * COL_C, sz * COL_C, 23.0)
                   for sx in (-1, 1) for sz in (-1, 1)),
    )
    return sc.build(), env
