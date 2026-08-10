#!/usr/bin/env python3
"""Project the scene's extreme points to check framing before a full render.

Usage:
    python3 frame_check.py orbit <az> <el> <dist> <focal> [rotor_az] [spin] [deck_top]
    python3 frame_check.py eye "(x,y,z)" "(tx,ty,tz)" <focal> [rotor_az] [spin] [deck_top]
"""
import ast
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mpss_raytracer import Camera, F32, norm          # noqa: E402
import mpss_scene as S                                # noqa: E402


def rotor_points(deck_top, rotor_az, spin):
    """Hub and blade tips, using the same construction as add_turbine."""
    a = math.radians(rotor_az)
    tilt = math.radians(5.0)
    ax = norm(np.array([math.sin(a) * math.cos(tilt), math.sin(tilt),
                        math.cos(a) * math.cos(tilt)], F32))
    side = norm(np.cross(np.array([0, 1, 0], F32), ax))
    vert = np.cross(ax, side)
    top = np.array([-S.COL_C, deck_top + S.HUB_HEIGHT - 6.0, S.COL_C], F32)
    hub = top + vert * 4.6 - ax * 1.5 + ax * 12.0
    tips = []
    for b in range(3):
        phi = math.radians(spin + b * 120.0)
        span = norm(side * math.cos(phi) + vert * math.sin(phi))
        tips.append(hub + span * S.ROTOR_R)
    return hub, tips


def project(cam, pts, w, h):
    p = np.asarray(pts, F32) - cam.eye[None, :]
    z = p @ cam.f
    x = p @ cam.r
    y = p @ cam.u
    half_w = (cam.sensor * 0.5) / cam.focal
    u = (x / z) / half_w
    v = (y / z) / (half_w * (h / w))
    return np.stack([u, v, z], axis=1)


FC_W = int(os.environ.get('FC_W', 1920))
FC_H = int(os.environ.get('FC_H', 1080))


def report(eye, target, focal, w=None, h=None, deck_top=7.35,
           rotor_az=132.0, spin=35.0, label=''):
    w = w or FC_W
    h = h or FC_H
    cam = Camera(eye, target, focal_mm=focal)
    d = S.DECK_HALF
    pts, names = [], []
    for sx in (-1, 1):
        for sz in (-1, 1):
            pts.append((sx * d, deck_top, sz * d))
            names.append('deck %s%s' % ('N' if sz > 0 else 'S', 'E' if sx > 0 else 'W'))
    hub, tips = rotor_points(deck_top, rotor_az, spin)
    pts.append(hub); names.append('hub')
    for i, t in enumerate(tips):
        pts.append(t); names.append('tip %d' % i)
    pts.append((0.0, 0.0, 0.0)); names.append('waterline centre')

    uv = project(cam, pts, w, h)
    out = ['%s eye=(%.0f,%.0f,%.0f) target=(%.0f,%.0f,%.0f) f=%.0fmm rotor_az=%.0f spin=%.0f'
           % ((label,) + tuple(eye) + tuple(target) + (focal, rotor_az, spin))]
    bad = 0
    for n, (u, v, z) in zip(names, uv):
        ok = -1.0 <= u <= 1.0 and -1.0 <= v <= 1.0
        bad += 0 if ok else 1
        out.append('  %-16s u=%+6.3f v=%+6.3f d=%5.0f%s'
                   % (n, u, v, z, '' if ok else '   <-- OUT'))
    dk = uv[:4]
    deck_w = 100 * (dk[:, 0].max() - dk[:, 0].min()) / 2
    fill_v = 100 * (uv[:, 1].max() - uv[:, 1].min()) / 2
    fill_u = 100 * (uv[:, 0].max() - uv[:, 0].min()) / 2
    out.append('  deck width %.1f%%   content %.0f%% wide x %.0f%% tall   out=%d'
               % (deck_w, fill_u, fill_v, bad))
    print('\n'.join(out))
    return deck_w, bad, fill_u, fill_v


def deck_corners(deck_top):
    return [(sx * S.DECK_HALF, deck_top, sz * S.DECK_HALF)
            for sx in (-1, 1) for sz in (-1, 1)]


def solve(must, w, h, focal=35.0, az=(140, 210, 5), el=(18, 36, 2),
          dist=(140, 400, 10), aimy=(10, 90, 5), aim_xz=(0.0, 0.0),
          margin_u=0.93, margin_v=0.91, centre_tol=0.14, score=None, top=3):
    """Search camera orbits that keep every point in ``must`` inside the frame.

    Returns the best few as (score, az, el, dist, aimy, eye, aim). Default score
    is the on-screen width of the deck, i.e. make the subject as large as the
    constraints allow. Pass ``score(uv)`` to optimise something else -- Scene 4
    maximised the gap between the tower base and the deck corner instead.
    """
    must = np.asarray(must, F32)
    out = []
    for a_deg in range(*az):
        for e_deg in range(*el):
            a, e = math.radians(a_deg), math.radians(e_deg)
            u = np.array([math.sin(a) * math.cos(e), math.sin(e),
                          math.cos(a) * math.cos(e)], F32)
            for d in range(*dist):
                for ay in range(*aimy):
                    aim = np.array([aim_xz[0], float(ay), aim_xz[1]], F32)
                    eye = aim + u * d
                    cam = Camera(tuple(float(v) for v in eye),
                                 tuple(float(v) for v in aim), focal_mm=focal)
                    uv = project(cam, must, w, h)
                    if np.abs(uv[:, 0]).max() > margin_u: continue
                    if np.abs(uv[:, 1]).max() > margin_v: continue
                    if abs((uv[:, 1].min() + uv[:, 1].max()) / 2) > centre_tol:
                        continue
                    s = (score(uv) if score
                         else float(uv[:4, 0].max() - uv[:4, 0].min()))
                    out.append((round(s * 50, 1), a_deg, e_deg, d, ay,
                                tuple(round(float(v), 1) for v in eye),
                                tuple(round(float(v), 1) for v in aim)))
    out.sort(reverse=True)
    return out[:top]


def orbit(az, el, dist, aim=(0.0, 60.0, 0.0)):
    a, e = math.radians(az), math.radians(el)
    aim = np.array(aim, F32)
    eye = aim + dist * np.array([math.sin(a) * math.cos(e), math.sin(e),
                                 math.cos(a) * math.cos(e)], F32)
    return tuple(float(v) for v in eye), tuple(float(v) for v in aim)


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'eye'
    if mode == 'orbit':
        az, el, dist, focal = (float(x) for x in sys.argv[2:6])
        rest = [float(x) for x in sys.argv[6:]]
        raz = rest[0] if len(rest) > 0 else 132.0
        spin = rest[1] if len(rest) > 1 else 35.0
        dt = rest[2] if len(rest) > 2 else 7.35
        aimy = rest[3] if len(rest) > 3 else 60.0
        eye, tgt = orbit(az, el, dist, (0.0, aimy, 0.0))
        report(eye, tgt, focal, deck_top=dt, rotor_az=raz, spin=spin)
    else:
        eye = ast.literal_eval(sys.argv[2])
        tgt = ast.literal_eval(sys.argv[3])
        focal = float(sys.argv[4])
        rest = [float(x) for x in sys.argv[5:]]
        report(eye, tgt, focal,
               rotor_az=rest[0] if len(rest) > 0 else 132.0,
               spin=rest[1] if len(rest) > 1 else 35.0,
               deck_top=rest[2] if len(rest) > 2 else 7.35)
