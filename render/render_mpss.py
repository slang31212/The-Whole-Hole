#!/usr/bin/env python3
"""
Render the MPSS scenes described in mpssdeckloadingscenes.md.

Lighting follows the brief: a CIE overcast dome, flat even light, no sun, no
lens flare, no golden hour.  Everything that makes the image read as a real
photograph comes from sky occlusion, weathering and correct scale, not from
dramatic light.

    python3 render_mpss.py --scene quay --preview
    python3 render_mpss.py --scene quay  --out ../images/mpss-deck-loadout.jpg
    python3 render_mpss.py --scene station --out ../images/mpss-on-station.jpg
"""

import argparse
import math
import os
import sys
import time

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mpss_raytracer import F32, Camera, normalize, vnoise, fbm       # noqa: E402
import mpss_scene as S                                               # noqa: E402

# ------------------------------------------------------------------ sky
ZENITH = np.array([0.400, 0.440, 0.520], F32)
HORIZON = np.array([0.680, 0.695, 0.715], F32)
UNDERSIDE = np.array([0.045, 0.050, 0.056], F32)
BOUNCE = np.array([0.052, 0.055, 0.060], F32)


def sky(d):
    """CIE overcast dome. Bright pale horizon, slightly deeper grey overhead."""
    up = np.clip(d[..., 1], 0.0, 1.0)
    lum = (1.0 + 2.0 * up) / 3.0
    col = ZENITH[None, :] * lum[..., None]
    haze = np.exp(-up * 5.5)[..., None]
    col = col * (1.0 - haze) + HORIZON[None, :] * haze
    below = d[..., 1] < 0.0
    return np.where(below[..., None], UNDERSIDE[None, :], col).astype(F32)


def fog_colour(d):
    """What the aerial perspective converges to: the pale horizon band."""
    up = np.clip(d[..., 1], -0.05, 1.0)
    t = np.clip(up * 4.0, 0.0, 1.0)[..., None]
    return (HORIZON[None, :] * (1.0 - t) + ZENITH[None, :] * 1.25 * t).astype(F32)


# ------------------------------------------------------------------ textures
YELLOW = np.array([0.400, 0.285, 0.030], F32)
RUSTC = np.array([0.135, 0.055, 0.028], F32)


def _flat(p):
    q = p.copy()
    q[:, 1] = 0.0
    return q


def apply_textures(p, loc, nrm, mat, alb, rough):
    """Procedural weathering. Cheap, but it is what kills the CG look."""
    tex = S.MAT_TEX[mat]

    # -- painted deck plate -------------------------------------------
    m = tex == 1
    if m.any():
        q = _flat(p[m])
        x, z = p[m, 0], p[m, 2]
        stain = fbm(q, 0.035, 3)
        grit = vnoise(q, 1.7)
        f = 0.88 + 0.42 * (stain - 0.5) + 0.10 * (grit - 0.5)
        sx = np.abs(np.mod(x + 1.5, 3.0) - 1.5)
        sz = np.abs(np.mod(z + 1.5, 3.0) - 1.5)
        f *= np.where((sx < 0.055) | (sz < 0.055), 0.86, 1.0)
        f *= np.where(stain > 0.74, 0.72, 1.0)          # oil / traffic staining
        a = alb[m] * f[:, None]
        # corridor edge lines and the perimeter walkway line
        ax, az = np.abs(x), np.abs(z)
        line = (((ax > 6.55) & (ax < 7.15) & (az < 43.2)) |
                ((az > 6.55) & (az < 7.15) & (ax < 43.2)) |
                ((ax > 42.6) & (ax < 43.1)) | ((az > 42.6) & (az < 43.1)))
        hatch = (np.mod(x * 0.7 + z * 0.7, 2.2) < 1.1)
        line = line & (hatch | (ax < 43.0) & (az < 43.0))
        wear = np.clip(0.35 + 1.2 * (grit - 0.25), 0.0, 1.0)[:, None]
        a = np.where(line[:, None], a * (1 - wear) + YELLOW[None, :] * wear, a)
        # tie-down pad-eyes on a 6 m grid -- the deck is a bolt-down field
        px = np.abs(np.mod(x + 3.0, 6.0) - 3.0)
        pz = np.abs(np.mod(z + 3.0, 6.0) - 3.0)
        pad = (px * px + pz * pz) < 0.10
        a = np.where(pad[:, None], a * 0.45, a)
        alb[m] = a
        rough[m] = 0.90 - 0.08 * stain

    # -- weathered plate steel ----------------------------------------
    m = tex == 2
    if m.any():
        pp = p[m]
        streak = fbm(pp * np.array([1.0, 0.07, 1.0], F32), 0.22, 3)
        broad = fbm(pp, 0.045, 3)
        y = pp[:, 1]
        stiff = np.abs(np.mod(y + 1.5, 3.0) - 1.5) < 0.045
        f = 0.86 + 0.34 * (streak - 0.5) + 0.16 * (broad - 0.5)
        f = np.where(stiff, f * 0.84, f)
        a = alb[m] * f[:, None]
        rustw = np.clip((broad - 0.70) * 3.4, 0.0, 1.0) * np.clip(streak * 1.4, 0, 1)
        a = a * (1 - rustw)[:, None] + RUSTC[None, :] * rustw[:, None]
        alb[m] = a
        rough[m] = np.clip(rough[m] + 0.10 * (broad - 0.5), 0.35, 0.98)

    # -- ISO container corrugation ------------------------------------
    m = tex == 3
    if m.any():
        lx, ly, lz = loc[m, 0], loc[m, 1], loc[m, 2]
        is_end = np.abs(lx) > np.maximum(np.abs(lz), 1.0) * 2.3
        along = np.where(is_end, lz, lx)
        corr = np.sin(along * (2 * math.pi / 0.29))
        top = np.abs(ly) > S.CTR_H / 2 - 0.06
        f = 1.0 + 0.115 * corr
        f = np.where(top, 1.0 + 0.05 * np.sin(lx * (2 * math.pi / 0.55)), f)
        # corner posts and top/bottom rails read darker
        rail = (np.abs(ly) > S.CTR_H / 2 - 0.20) & ~top
        f = np.where(rail, f * 0.80, f)
        pp = p[m]
        dirt = fbm(pp * np.array([1.0, 0.10, 1.0], F32), 0.5, 2)
        f *= 0.90 + 0.22 * dirt
        alb[m] = alb[m] * f[:, None]
        rough[m] = np.clip(0.72 - 0.12 * dirt, 0.4, 0.95)

    # -- concrete quay -------------------------------------------------
    m = tex == 4
    if m.any():
        q = _flat(p[m])
        broad = fbm(q, 0.012, 3)
        med = fbm(q, 0.11, 3)
        fine = vnoise(q, 1.1)
        f = 0.80 + 0.44 * (broad - 0.5) + 0.30 * (med - 0.5) + 0.10 * (fine - 0.5)
        # slab joints on a 6 m grid
        jx = np.abs(np.mod(p[m, 0] + 3.0, 6.0) - 3.0)
        jz = np.abs(np.mod(p[m, 2] + 3.0, 6.0) - 3.0)
        f *= np.where((jx < 0.07) | (jz < 0.07), 0.72, 1.0)
        # standing water and mud on the quay
        wet = np.clip((0.47 - med) * 5.0, 0.0, 1.0) * np.clip((broad - 0.35) * 3.0, 0, 1)
        a = alb[m] * f[:, None]
        a = a * (1 - 0.55 * wet)[:, None]
        alb[m] = a
        rough[m] = np.clip(0.94 - 0.72 * wet, 0.12, 0.97)

    # -- open grating --------------------------------------------------
    m = tex == 5
    if m.any():
        q = p[m]
        g = (np.mod(q[:, 0] * 8.0, 1.0) < 0.45) ^ (np.mod(q[:, 2] * 8.0, 1.0) < 0.45)
        alb[m] = alb[m] * np.where(g, 1.25, 0.70)[:, None]

    return alb, rough


# ------------------------------------------------------------------ skylight
_AO_RNG = np.random.default_rng(99)


def skylight(scene, p, n, nsamp, maxdist):
    """Sky irradiance / pi at each point: cosine-weighted dome sampling."""
    N = p.shape[0]
    up = np.where((np.abs(n[:, 1]) < 0.94)[:, None],
                  np.array([0, 1, 0], F32), np.array([1, 0, 0], F32))
    tx = normalize(np.cross(up, n))
    tz = np.cross(n, tx)
    origin = (p + n * 0.035).astype(F32)

    acc = np.zeros((N, 3), F32)
    phase = _AO_RNG.random(N).astype(F32) * F32(2 * math.pi)
    for s in range(nsamp):
        r = math.sqrt((s + 0.5) / nsamp)
        ang = phase + F32(2 * math.pi * ((s * 0.6180339887) % 1.0))
        dx = (r * np.cos(ang)).astype(F32)
        dz = (r * np.sin(ang)).astype(F32)
        dy = np.sqrt(np.maximum(1.0 - r * r, 0.0)).astype(F32)
        d = normalize(tx * dx[:, None] + n * dy + tz * dz[:, None])
        occ = scene.intersect(origin, d, F32(maxdist), any_hit=True)
        L = sky(d)
        acc += np.where(occ[:, None], BOUNCE[None, :], L)
    return acc / nsamp


# ------------------------------------------------------------------ water
WAVES = {
    # (amplitude m, wavelength m, direction deg, phase)
    'sea': [(0.95, 132.0, 22.0, 0.3), (0.68, 82.0, 41.0, 1.9),
            (0.46, 49.0, -12.0, 2.7), (0.30, 28.0, 63.0, 0.8),
            (0.20, 13.5, 28.0, 4.1), (0.105, 6.6, -47.0, 2.2),
            (0.052, 3.1, 78.0, 5.0)],
    'harbour': [(0.085, 15.0, 26.0, 0.4), (0.052, 8.4, -31.0, 2.1),
                (0.030, 4.3, 58.0, 3.3), (0.017, 2.2, 8.0, 1.2),
                (0.009, 1.05, -68.0, 4.4)],
}


def _wave_terms(kind):
    out = []
    for a, wl, ddeg, ph in WAVES[kind]:
        k = 2 * math.pi / wl
        th = math.radians(ddeg)
        out.append((F32(a), F32(k * math.sin(th)), F32(k * math.cos(th)), F32(ph)))
    return out


def wave_height(x, z, terms):
    h = np.zeros_like(x)
    for a, kx, kz, ph in terms:
        h += a * np.sin(kx * x + kz * z + ph)
    return h


def wave_normal(x, z, terms):
    dx = np.zeros_like(x)
    dz = np.zeros_like(x)
    for a, kx, kz, ph in terms:
        c = a * np.cos(kx * x + kz * z + ph)
        dx += c * kx
        dz += c * kz
    n = np.stack([-dx, np.ones_like(x), -dz], axis=1)
    return normalize(n), dx, dz


WATER_FAR = 40000.0        # beyond this the surface is just the horizon band


def water_intersect(o, d, y0, terms, iters=3, near=6000.0):
    """Flat-plane hit, then a few Newton steps onto the displaced surface.

    The displacement solve is only run where it matters: at grazing angles the
    step is unstable and the wave is far below one pixel anyway.
    """
    dy = d[:, 1]
    ok = dy < -1e-5
    t = np.where(ok, (y0 - o[:, 1]) / np.where(ok, dy, F32(-1.0)), F32(np.inf))
    t = np.where(t > 0, t, F32(np.inf))
    near_m = np.isfinite(t) & (t < near)
    if near_m.any():
        tf = t[near_m]
        of, df, dyf = o[near_m], d[near_m], dy[near_m]
        for _ in range(iters):
            pf = of + tf[:, None] * df
            h = y0 + wave_height(pf[:, 0], pf[:, 2], terms)
            tf = np.clip(tf + (pf[:, 1] - h) / (-dyf), 0.0, near * 2.0)
        t[near_m] = tf
    return np.minimum(t, F32(WATER_FAR))


# ------------------------------------------------------------------ shading
def shade_env(scene, p, nrm, alb, rough, irr, view, env):
    """Diffuse from the sky dome plus a rough specular sky reflection."""
    diff = alb * irr
    ndv = np.clip(-np.einsum('ni,ni->n', view, nrm), 0.0, 1.0)
    fres = 0.035 + 0.965 * (1.0 - ndv) ** 5
    refl = view - 2.0 * np.einsum('ni,ni->n', view, nrm)[:, None] * nrm
    smooth = np.clip(1.0 - rough, 0.0, 1.0) ** 1.4
    vis = np.clip(irr.mean(axis=1) / 0.42, 0.0, 1.2)[:, None]
    spec = sky(refl) * (fres * (0.18 + 0.82 * smooth))[:, None] * vis
    return diff + spec


def shade_water(scene, o, d, t, env, terms, irr_ref):
    p = o + t[:, None] * d
    n, sx, sz = wave_normal(p[:, 0], p[:, 2], terms)

    # fine ripple: perturb the normal with a noise gradient
    e = 0.6
    flat = np.array([1.0, 0.0, 1.0], F32)
    base = fbm(p * flat, 0.9, 2)
    gx = fbm((p + np.array([e, 0, 0], F32)) * flat, 0.9, 2)
    gz = fbm((p + np.array([0, 0, e], F32)) * flat, 0.9, 2)
    amp = 0.16 if env['water'] == 'sea' else 0.05
    n = n + np.stack([-(gx - base) * amp / e, np.zeros_like(base),
                      -(gz - base) * amp / e], axis=1)

    # fade surface detail out with distance: past a few hundred metres a wave
    # is far smaller than a pixel, and keeping it only produces moire.
    fade = np.exp(-t / F32(env['detail_fade']))[:, None]
    up = np.array([0.0, 1.0, 0.0], F32)[None, :]
    n = normalize(up + (n - up) * fade)

    refl = d - 2.0 * np.einsum('ni,ni->n', d, n)[:, None] * n
    refl[:, 1] = np.where(refl[:, 1] < 0.012, 0.012, refl[:, 1])
    refl = normalize(refl)

    col = sky(refl)
    near = t < F32(2500.0)
    rt = np.full(t.shape, np.inf, F32)
    rid = np.full(t.shape, -1, np.int32)
    if near.any():
        ni = np.nonzero(near)[0]
        rt_n, rid_n = scene.intersect((p[ni] + n[ni] * 0.05).astype(F32),
                                      refl[ni], F32(4000.0))
        rt[ni] = rt_n
        rid[ni] = rid_n
    hit = rid >= 0
    if hit.any():
        rp = p[hit] + rt[hit][:, None] * refl[hit]
        rn, rloc, rmat, rtint = scene.surface(rp, rid[hit])
        ralb = S.MAT_ALB[rmat] * rtint
        rrough = S.MAT_ROUGH[rmat].copy()
        ralb, rrough = apply_textures(rp, rloc, rn, rmat, ralb, rrough)
        facing = np.clip(rn[:, 1], -1.0, 1.0)
        amb = irr_ref * (0.62 + 0.38 * np.clip(facing, 0, 1))[:, None]
        rc = ralb * amb
        fogt = 1.0 - np.exp(-env['fog_density'] * rt[hit])
        rc = rc * (1 - fogt)[:, None] + fog_colour(refl[hit]) * fogt[:, None]
        col[hit] = rc

    ndv = np.clip(-np.einsum('ni,ni->n', d, n), 0.0, 1.0)
    F = 0.021 + 0.979 * (1.0 - ndv) ** 5

    body_col = (np.array([0.013, 0.023, 0.025], F32) if env['water'] == 'sea'
                else np.array([0.026, 0.030, 0.028], F32))
    body = body_col[None, :] * (0.55 + 0.45 * np.clip(irr_ref.mean() / 0.45, 0, 1.5))
    out = body * (1 - F)[:, None] + col * F[:, None]

    if env['water'] == 'sea':
        h = wave_height(p[:, 0], p[:, 2], terms)
        steep = np.sqrt(sx * sx + sz * sz)
        crest = np.clip((h - 0.55) * 1.05, 0, 1) * np.clip((steep - 0.085) * 5.5, 0, 1)
        streak = fbm(p * np.array([0.9, 0.0, 0.9], F32), 0.42, 3)
        foam = np.clip(crest * (streak * 1.9 - 0.35), 0, 1) ** 0.8
        # wash and broken water where the sea meets the columns
        for cx, cz, rad in env.get('wash', ()):
            dr = np.sqrt((p[:, 0] - cx) ** 2 + (p[:, 2] - cz) ** 2)
            ring = np.clip((rad - dr) / (rad * 0.5), 0.0, 1.0) ** 0.7
            ring *= np.clip(0.35 + 1.5 * streak, 0.0, 1.0)
            foam = np.maximum(foam, ring * 0.9)
        foam = foam * np.exp(-t / F32(env['detail_fade'] * 2.5))
        foam_col = np.array([0.60, 0.63, 0.65], F32)
        out = out * (1 - foam)[:, None] + foam_col[None, :] * foam[:, None]
    return out


# ------------------------------------------------------------------ tonemap
def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0)


def finish(rgb, w, h, exposure=1.22, grain=0.0055, vignette=0.16, seed=5):
    c = np.clip(rgb, 0.0, None) * exposure
    c = aces(c)
    # gentle industrial grade: cool shadows, slight desaturation, small lift
    lum = (c * np.array([0.2126, 0.7152, 0.0722], F32)).sum(axis=-1, keepdims=True)
    c = lum + (c - lum) * 0.90
    c = c + np.array([0.004, 0.006, 0.010], F32) * (1.0 - lum)
    c = np.clip(c, 0.0, 1.0) ** (1.0 / 2.2)
    c = np.clip(c + 0.16 * (c - 0.5) * (1.0 - np.abs(c - 0.5) * 2.0), 0.0, 1.0)

    yy, xx = np.mgrid[0:h, 0:w].astype(F32)
    nx = (xx / w - 0.5) * 2.0
    ny = (yy / h - 0.5) * 2.0
    r2 = nx * nx + ny * ny
    c *= (1.0 - vignette * np.clip(r2 * 0.55, 0, 1))[..., None]

    rng = np.random.default_rng(seed)
    g = rng.normal(0.0, grain, size=(h, w, 1)).astype(F32)
    c = np.clip(c + g * (0.35 + 0.65 * (1.0 - c)), 0.0, 1.0)
    return c


# ------------------------------------------------------------------ cameras
CAMERAS = {
    'quay': dict(eye=(102.6, 162.7, -230.9), target=(0.0, 109.0, 0.0), focal=35.0),
    'station': dict(eye=(256.7, 47.0, -411.1), target=(0.0, 118.0, 0.0), focal=35.0),
}


def render(scene_name, width, height, ao_samples, ao_stride, ao_dist,
           supersample, out_path, quiet=False):
    t_start = time.time()
    if scene_name == 'quay':
        scene, env = S.scene_quay_loaded()
    elif scene_name == 'station':
        scene, env = S.scene_on_station()
    else:
        raise SystemExit('unknown scene: %s' % scene_name)

    rw, rh = int(width * supersample), int(height * supersample)
    spec = CAMERAS[scene_name]
    cam = Camera(spec['eye'], spec['target'], focal_mm=spec['focal'])
    terms = _wave_terms(env['water'])

    def log(msg):
        if not quiet:
            print('[%6.1fs] %s' % (time.time() - t_start, msg), flush=True)

    log('scene: %d boxes, %d cones, %d clusters'
        % (scene.nb, len(scene.CH), len(scene.clusters)))
    log('primary pass %dx%d' % (rw, rh))

    pos = np.zeros((rh * rw, 3), F32)
    nrm = np.zeros((rh * rw, 3), F32)
    alb = np.zeros((rh * rw, 3), F32)
    rgh = np.zeros(rh * rw, F32)
    tdist = np.zeros(rh * rw, F32)
    kind = np.zeros(rh * rw, np.int8)          # 0 sky, 1 solid, 2 water
    ray_d = np.zeros((rh * rw, 3), F32)

    tile = max(1, int(2_400_000 // rw))
    eye = cam.eye[None, :].astype(F32)
    for y0 in range(0, rh, tile):
        y1 = min(y0 + tile, rh)
        yy, xx = np.mgrid[y0:y1, 0:rw]
        xs = (xx.ravel() + 0.5).astype(np.float64)
        ys = (yy.ravel() + 0.5).astype(np.float64)
        d = cam.rays(xs, ys, rw, rh)
        o = np.broadcast_to(eye, d.shape).copy()
        t, pid = scene.intersect(o, d, F32(20000.0))
        tw = water_intersect(o, d, F32(env['water_y']), terms)
        # a ray that hits nothing but points below the horizon still lands on
        # the sea, however far away -- otherwise a black band appears there
        is_w = (tw < t) | ((pid < 0) & np.isfinite(tw))
        tt = np.where(is_w, tw, t)
        sl = slice(y0 * rw, y1 * rw)
        ray_d[sl] = d
        tdist[sl] = tt
        k = np.where(pid >= 0, 1, 0).astype(np.int8)
        k = np.where(is_w, np.int8(2), k)
        kind[sl] = k
        solid = (k == 1)
        if solid.any():
            idx = np.nonzero(solid)[0]
            p = o[idx] + t[idx][:, None] * d[idx]
            n, loc, mat, tint = scene.surface(p, pid[idx])
            a = S.MAT_ALB[mat] * tint
            r = S.MAT_ROUGH[mat].copy()
            a, r = apply_textures(p, loc, n, mat, a, r)
            g0 = y0 * rw
            pos[g0 + idx] = p
            nrm[g0 + idx] = n
            alb[g0 + idx] = a
            rgh[g0 + idx] = r
        if not quiet and (y0 // tile) % 4 == 0:
            log('  rows %d/%d' % (y1, rh))

    log('skylight pass (%d samples, stride %d)' % (ao_samples, ao_stride))
    sw = (rw + ao_stride - 1) // ao_stride
    sh = (rh + ao_stride - 1) // ao_stride
    ys = np.minimum(np.arange(sh) * ao_stride, rh - 1)
    xs = np.minimum(np.arange(sw) * ao_stride, rw - 1)
    gidx = (ys[:, None] * rw + xs[None, :]).ravel()
    sk = kind[gidx]
    irr_small = np.tile(np.array([0.42, 0.45, 0.50], F32), (gidx.size, 1))
    sel = np.nonzero(sk == 1)[0]
    if sel.size:
        block = 300_000
        for b in range(0, sel.size, block):
            sub = sel[b:b + block]
            g = gidx[sub]
            irr_small[sub] = skylight(scene, pos[g], nrm[g], ao_samples, ao_dist)
            log('  skylight %d/%d' % (min(b + block, sel.size), sel.size))
    irr_small = irr_small.reshape(sh, sw, 3)

    irr = np.empty((rh, rw, 3), F32)
    for c in range(3):
        im = Image.fromarray(irr_small[:, :, c], mode='F').resize((rw, rh), Image.BILINEAR)
        irr[:, :, c] = np.asarray(im, F32)
    irr = irr.reshape(-1, 3)

    log('composite')
    out = np.zeros((rh * rw, 3), F32)
    msky = kind == 0
    out[msky] = sky(ray_d[msky])
    msol = kind == 1
    if msol.any():
        out[msol] = shade_env(scene, pos[msol], nrm[msol], alb[msol], rgh[msol],
                              irr[msol], ray_d[msol], env)
    mwat = kind == 2
    if mwat.any():
        idx = np.nonzero(mwat)[0]
        for b in range(0, idx.size, 600_000):
            sub = idx[b:b + 600_000]
            o = np.broadcast_to(eye, (sub.size, 3)).copy()
            out[sub] = shade_water(scene, o, ray_d[sub], tdist[sub], env, terms,
                                   np.array([0.42, 0.45, 0.50], F32))

    # aerial perspective
    tt = np.where(kind == 0, 0.0, np.minimum(tdist, 20000.0))
    fogt = 1.0 - np.exp(-env['fog_density'] * tt)
    out = out * (1 - fogt)[:, None] + fog_colour(ray_d) * fogt[:, None]

    img = out.reshape(rh, rw, 3)
    if supersample > 1:
        img = img.reshape(height, supersample, width, supersample, 3).mean(axis=(1, 3))

    final = finish(img, width, height)
    arr = (final * 255.0 + 0.5).astype(np.uint8)
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    Image.fromarray(arr).save(out_path, quality=94, subsampling=0)
    log('wrote %s (%dx%d)' % (out_path, width, height))
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--scene', default='quay', choices=['quay', 'station'])
    ap.add_argument('--width', type=int, default=1920)
    ap.add_argument('--height', type=int, default=1080)
    ap.add_argument('--ss', type=int, default=2, help='supersampling factor')
    ap.add_argument('--ao', type=int, default=24, help='sky dome samples')
    ap.add_argument('--ao-stride', type=int, default=2)
    ap.add_argument('--ao-dist', type=float, default=55.0)
    ap.add_argument('--preview', action='store_true')
    ap.add_argument('--out', default=None)
    a = ap.parse_args()

    if a.preview:
        a.width, a.height, a.ss, a.ao, a.ao_stride = 640, 360, 1, 6, 2
    out = a.out or ('preview-%s.jpg' % a.scene if a.preview
                    else '../images/mpss-%s.jpg' % a.scene)
    render(a.scene, a.width, a.height, a.ao, a.ao_stride, a.ao_dist, a.ss, out)


if __name__ == '__main__':
    main()
