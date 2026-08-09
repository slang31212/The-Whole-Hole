#!/usr/bin/env python3
"""
Minimal physically-motivated ray tracer used to render the MPSS scenes.

Everything in the MPSS brief is boxes, cylinders and cones, so the tracer only
supports two analytic primitives:

  * oriented boxes   (deck, columns, pontoon, containers, frames, rails, ...)
  * capped cone frusta (tower, KO drums, pipe racks, fan rings, bollards, ...)

plus an analytic water surface.

Lighting is a CIE overcast sky dome sampled with cosine-weighted hemisphere
rays.  There is no sun: the brief asks for "flat even light, no lens flare, no
golden hour, no drama", and an overcast dome plus proper sky occlusion is what
actually makes an industrial photograph read as real.
"""

import math
import numpy as np

F32 = np.float32

# --------------------------------------------------------------------------
# value noise (64^3 lattice, trilinear) -- used for weathering and water
# --------------------------------------------------------------------------
_NOISE = np.random.default_rng(20240607).random((64, 64, 64)).astype(F32)


def vnoise(p, freq):
    """Trilinearly interpolated value noise at world positions ``p`` (...,3)."""
    q = p * F32(freq)
    i = np.floor(q).astype(np.int32)
    f = q - i
    f = f * f * (F32(3.0) - F32(2.0) * f)
    i0 = i & 63
    i1 = (i + 1) & 63
    x0, y0, z0 = i0[..., 0], i0[..., 1], i0[..., 2]
    x1, y1, z1 = i1[..., 0], i1[..., 1], i1[..., 2]
    fx, fy, fz = f[..., 0], f[..., 1], f[..., 2]
    n = _NOISE
    c000 = n[x0, y0, z0]; c100 = n[x1, y0, z0]
    c010 = n[x0, y1, z0]; c110 = n[x1, y1, z0]
    c001 = n[x0, y0, z1]; c101 = n[x1, y0, z1]
    c011 = n[x0, y1, z1]; c111 = n[x1, y1, z1]
    c00 = c000 + (c100 - c000) * fx
    c10 = c010 + (c110 - c010) * fx
    c01 = c001 + (c101 - c001) * fx
    c11 = c011 + (c111 - c011) * fx
    c0 = c00 + (c10 - c00) * fy
    c1 = c01 + (c11 - c01) * fy
    return c0 + (c1 - c0) * fz


def fbm(p, freq, octaves=3):
    out = np.zeros(p.shape[:-1], F32)
    amp = F32(1.0)
    tot = F32(0.0)
    for _ in range(octaves):
        out += amp * vnoise(p, freq)
        tot += amp
        amp *= F32(0.5)
        freq *= 2.07
    return out / tot


# --------------------------------------------------------------------------
# small vector helpers
# --------------------------------------------------------------------------
def norm(v):
    v = np.asarray(v, F32)
    return v / np.linalg.norm(v)


def normalize(v):
    n = np.sqrt(np.einsum('...i,...i->...', v, v))
    return v / np.maximum(n, F32(1e-12))[..., None]


def basis_from_axis(axis):
    """Orthonormal local->world matrix whose +Y column is ``axis``."""
    y = norm(axis)
    ref = np.array([0, 0, 1], F32) if abs(y[1]) > 0.9 else np.array([0, 1, 0], F32)
    x = norm(np.cross(ref, y))
    z = np.cross(x, y)
    return np.stack([x, y, z], axis=1).astype(F32)   # columns are local axes


def yaw_matrix(deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], F32)


def euler_matrix(yaw=0.0, pitch=0.0, roll=0.0):
    """local->world; applied roll (Z), then pitch (X), then yaw (Y)."""
    cy, sy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    cp, sp = math.cos(math.radians(pitch)), math.sin(math.radians(pitch))
    cr, sr = math.cos(math.radians(roll)), math.sin(math.radians(roll))
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], F32)
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]], F32)
    Rz = np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]], F32)
    return (Ry @ Rx @ Rz).astype(F32)


# --------------------------------------------------------------------------
# scene
# --------------------------------------------------------------------------
class Cluster:
    __slots__ = ('lo', 'hi', 'box_idx', 'cyl_idx')

    def __init__(self, lo, hi, box_idx, cyl_idx):
        self.lo, self.hi = lo, hi
        self.box_idx, self.cyl_idx = box_idx, cyl_idx


class Scene:
    """Primitive soup with a flat two-level (cluster -> primitive) accelerator."""

    MAX_CLUSTER = 40

    def __init__(self):
        self._b = []          # (centre, half, M, mat, tint, group)
        self._c = []          # (base, M, height, r0, r1, mat, tint, group)
        self.built = False

    # -- authoring -------------------------------------------------------
    def box(self, centre, half, mat, M=None, yaw=None, tint=(1, 1, 1), group='misc'):
        if M is None:
            M = yaw_matrix(yaw) if yaw else np.eye(3, dtype=F32)
        self._b.append((np.asarray(centre, F32), np.asarray(half, F32),
                        np.asarray(M, F32), mat, np.asarray(tint, F32), group))

    def cyl(self, base, axis, height, r0, r1, mat, tint=(1, 1, 1), group='misc'):
        self._c.append((np.asarray(base, F32), basis_from_axis(axis),
                        F32(height), F32(r0), F32(r1), mat,
                        np.asarray(tint, F32), group))

    # -- build -----------------------------------------------------------
    def build(self):
        nb, nc = len(self._b), len(self._c)
        self.nb = nb
        self.BC = np.array([x[0] for x in self._b], F32) if nb else np.zeros((0, 3), F32)
        self.BH = np.array([x[1] for x in self._b], F32) if nb else np.zeros((0, 3), F32)
        BM = np.array([x[2] for x in self._b], F32) if nb else np.zeros((0, 3, 3), F32)
        self.BM = BM
        self.BMt = np.transpose(BM, (0, 2, 1)).copy()     # world -> local
        self.Bmat = np.array([x[3] for x in self._b], np.int32) if nb else np.zeros(0, np.int32)
        self.Btint = np.array([x[4] for x in self._b], F32) if nb else np.zeros((0, 3), F32)

        self.CP = np.array([x[0] for x in self._c], F32) if nc else np.zeros((0, 3), F32)
        CM = np.array([x[1] for x in self._c], F32) if nc else np.zeros((0, 3, 3), F32)
        self.CM = CM
        self.CMt = np.transpose(CM, (0, 2, 1)).copy()
        self.CH = np.array([x[2] for x in self._c], F32) if nc else np.zeros(0, F32)
        self.CR0 = np.array([x[3] for x in self._c], F32) if nc else np.zeros(0, F32)
        self.CR1 = np.array([x[4] for x in self._c], F32) if nc else np.zeros(0, F32)
        self.Cmat = np.array([x[5] for x in self._c], np.int32) if nc else np.zeros(0, np.int32)
        self.Ctint = np.array([x[6] for x in self._c], F32) if nc else np.zeros((0, 3), F32)

        # conservative world AABBs
        if nb:
            ext = np.einsum('nij,nj->ni', np.abs(BM), self.BH)
            blo, bhi = self.BC - ext, self.BC + ext
        else:
            blo = bhi = np.zeros((0, 3), F32)
        if nc:
            tip = self.CP + self.CM[:, :, 1] * self.CH[:, None]
            rmax = np.maximum(self.CR0, self.CR1)[:, None]
            clo = np.minimum(self.CP, tip) - rmax
            chi = np.maximum(self.CP, tip) + rmax
        else:
            clo = chi = np.zeros((0, 3), F32)
        self._blo, self._bhi, self._clo, self._chi = blo, bhi, clo, chi

        groups = {}
        for i, x in enumerate(self._b):
            groups.setdefault(x[5], ([], []))[0].append(i)
        for i, x in enumerate(self._c):
            groups.setdefault(x[7], ([], []))[1].append(i)

        self.clusters = []
        for _, (bi, ci) in groups.items():
            self._split(np.array(bi, np.int32), np.array(ci, np.int32))
        self.built = True
        return self

    def _split(self, bi, ci):
        n = len(bi) + len(ci)
        if n == 0:
            return
        lo = np.concatenate([self._blo[bi], self._clo[ci]]).min(axis=0)
        hi = np.concatenate([self._bhi[bi], self._chi[ci]]).max(axis=0)
        if n <= self.MAX_CLUSTER:
            self.clusters.append(Cluster(lo, hi, bi, ci))
            return
        ax = int(np.argmax(hi - lo))
        cb = (self._blo[bi][:, ax] + self._bhi[bi][:, ax]) * 0.5
        cc = (self._clo[ci][:, ax] + self._chi[ci][:, ax]) * 0.5
        mid = float(np.median(np.concatenate([cb, cc])))
        lb, rb = bi[cb <= mid], bi[cb > mid]
        lc, rc = ci[cc <= mid], ci[cc > mid]
        if (len(lb) + len(lc) == 0) or (len(rb) + len(rc) == 0):
            self.clusters.append(Cluster(lo, hi, bi, ci))
            return
        self._split(lb, lc)
        self._split(rb, rc)

    # -- traversal -------------------------------------------------------
    @staticmethod
    def _slab(o, inv, lo, hi):
        t0 = (lo - o) * inv
        t1 = (hi - o) * inv
        tn = np.minimum(t0, t1).max(axis=-1)
        tf = np.maximum(t0, t1).min(axis=-1)
        return tn, tf

    def intersect(self, o, d, tmax, any_hit=False, chunk_elems=3_000_000):
        """Return (t, prim_id) or, for ``any_hit``, a boolean occlusion mask."""
        n = o.shape[0]
        t = np.full(n, tmax, F32) if np.isscalar(tmax) else tmax.astype(F32).copy()
        pid = np.full(n, -1, np.int32)
        occ = np.zeros(n, bool)
        inv = F32(1.0) / np.where(np.abs(d) < 1e-9, F32(1e-9), d)

        for cl in self.clusters:
            tn, tf = self._slab(o, inv, cl.lo, cl.hi)
            m = (tf >= np.maximum(tn, F32(0.0))) & (tn < t)
            if any_hit:
                m &= ~occ
            idx = np.nonzero(m)[0]
            if idx.size == 0:
                continue
            nprim = max(len(cl.box_idx) + len(cl.cyl_idx), 1)
            step = max(int(chunk_elems // (nprim * 3)), 4096)
            for s in range(0, idx.size, step):
                sub = idx[s:s + step]
                oo, dd, tt = o[sub], d[sub], t[sub]
                best_t = tt.copy()
                best_id = np.full(sub.size, -1, np.int32)
                if len(cl.box_idx):
                    bt, bid = self._hit_boxes(cl.box_idx, oo, dd, best_t)
                    upd = bt < best_t
                    best_t = np.where(upd, bt, best_t)
                    best_id = np.where(upd, bid, best_id)
                if len(cl.cyl_idx):
                    ct, cid = self._hit_cyls(cl.cyl_idx, oo, dd, best_t)
                    upd = ct < best_t
                    best_t = np.where(upd, ct, best_t)
                    best_id = np.where(upd, cid, best_id)
                got = best_id >= 0
                if not got.any():
                    continue
                if any_hit:
                    occ[sub[got]] = True
                else:
                    g = sub[got]
                    t[g] = best_t[got]
                    pid[g] = best_id[got]
        return occ if any_hit else (t, pid)

    def _hit_boxes(self, bidx, o, d, tcur):
        C = self.BC[bidx]; H = self.BH[bidx]; Rt = self.BMt[bidx]
        diff = o[:, None, :] - C[None, :, :]
        ol = np.einsum('pij,npj->npi', Rt, diff)
        dl = np.einsum('pij,nj->npi', Rt, d)
        inv = F32(1.0) / np.where(np.abs(dl) < 1e-9, F32(1e-9), dl)
        t0 = (-H[None] - ol) * inv
        t1 = (H[None] - ol) * inv
        tn = np.minimum(t0, t1).max(axis=-1)
        tf = np.maximum(t0, t1).min(axis=-1)
        te = np.where(tn > F32(1e-4), tn, tf)
        ok = (tf >= np.maximum(tn, F32(0.0))) & (te > F32(1e-4)) & (te < tcur[:, None])
        te = np.where(ok, te, F32(np.inf))
        j = np.argmin(te, axis=1)
        r = np.arange(o.shape[0])
        return te[r, j], bidx[j].astype(np.int32)

    def _hit_cyls(self, cidx, o, d, tcur):
        P = self.CP[cidx]; Rt = self.CMt[cidx]
        Hh = self.CH[cidx]; R0 = self.CR0[cidx]; R1 = self.CR1[cidx]
        diff = o[:, None, :] - P[None, :, :]
        ol = np.einsum('pij,npj->npi', Rt, diff)
        dl = np.einsum('pij,nj->npi', Rt, d)
        ox, oy, oz = ol[..., 0], ol[..., 1], ol[..., 2]
        dx, dy, dz = dl[..., 0], dl[..., 1], dl[..., 2]
        k = ((R1 - R0) / Hh)[None]
        r0 = R0[None]
        a = dx * dx + dz * dz - k * k * dy * dy
        b = F32(2.0) * (ox * dx + oz * dz - k * dy * (r0 + k * oy))
        c = ox * ox + oz * oz - (r0 + k * oy) ** 2
        a = np.where(np.abs(a) < 1e-12, F32(1e-12), a)
        disc = b * b - F32(4.0) * a * c
        sq = np.sqrt(np.maximum(disc, F32(0.0)))
        inv2a = F32(1.0) / (F32(2.0) * a)
        ta = (-b - sq) * inv2a
        tb = (-b + sq) * inv2a
        tlo = np.minimum(ta, tb)
        thi = np.maximum(ta, tb)
        big = F32(np.inf)
        best = np.full(ol.shape[:2], big, F32)
        for cand in (tlo, thi):
            y = oy + cand * dy
            good = (disc > 0) & (cand > F32(1e-4)) & (y >= F32(0.0)) & (y <= Hh[None])
            best = np.where(good & (cand < best), cand, best)
        # caps
        dyv = np.where(np.abs(dy) < 1e-9, F32(1e-9), dy)
        for ypl, rad in ((F32(0.0), R0[None]), (Hh[None], R1[None])):
            tc = (ypl - oy) / dyv
            xx = ox + tc * dx
            zz = oz + tc * dz
            good = (tc > F32(1e-4)) & (xx * xx + zz * zz <= rad * rad)
            best = np.where(good & (tc < best), tc, best)
        best = np.where(best < tcur[:, None], best, big)
        j = np.argmin(best, axis=1)
        r = np.arange(o.shape[0])
        return best[r, j], (cidx[j] + self.nb).astype(np.int32)

    # -- surface attributes at a hit -------------------------------------
    def surface(self, p, pid):
        """Return (normal, local position, material id, tint) for hit points."""
        n = p.shape[0]
        nrm = np.zeros((n, 3), F32)
        loc = np.zeros((n, 3), F32)
        mat = np.zeros(n, np.int32)
        tint = np.ones((n, 3), F32)

        isb = (pid >= 0) & (pid < self.nb)
        if isb.any():
            i = pid[isb]
            pl = np.einsum('nij,nj->ni', self.BMt[i], p[isb] - self.BC[i])
            a = np.abs(pl) / np.maximum(self.BH[i], F32(1e-6))
            k = np.argmax(a, axis=1)
            nl = np.zeros_like(pl)
            r = np.arange(len(i))
            nl[r, k] = np.sign(pl[r, k])
            nrm[isb] = np.einsum('nij,nj->ni', self.BM[i], nl)
            loc[isb] = pl
            mat[isb] = self.Bmat[i]
            tint[isb] = self.Btint[i]

        isc = pid >= self.nb
        if isc.any():
            i = pid[isc] - self.nb
            pl = np.einsum('nij,nj->ni', self.CMt[i], p[isc] - self.CP[i])
            H = self.CH[i]; R0 = self.CR0[i]; R1 = self.CR1[i]
            k = (R1 - R0) / H
            y = np.clip(pl[:, 1], 0, H)
            rr = R0 + k * y
            cap_lo = pl[:, 1] < F32(1e-3)
            cap_hi = pl[:, 1] > H - F32(1e-3)
            nl = np.stack([pl[:, 0], -rr * k, pl[:, 2]], axis=1)
            nl = normalize(nl)
            nl[cap_lo] = np.array([0, -1, 0], F32)
            nl[cap_hi] = np.array([0, 1, 0], F32)
            nrm[isc] = np.einsum('nij,nj->ni', self.CM[i], nl)
            loc[isc] = pl
            mat[isc] = self.Cmat[i]
            tint[isc] = self.Ctint[i]

        return normalize(nrm), loc, mat, tint


# --------------------------------------------------------------------------
# camera
# --------------------------------------------------------------------------
class Camera:
    def __init__(self, eye, target, focal_mm=35.0, up=(0, 1, 0), roll=0.0,
                 sensor_mm=36.0):
        self.eye = np.asarray(eye, F32)
        f = norm(np.asarray(target, F32) - self.eye)
        u0 = np.asarray(up, F32)
        # right-handed: X east, Y up, Z north -> looking north, screen right is east
        r = norm(np.cross(u0, f))
        u = np.cross(f, r)
        if roll:
            a = math.radians(roll)
            r, u = r * math.cos(a) + u * math.sin(a), u * math.cos(a) - r * math.sin(a)
        self.f, self.r, self.u = f, r.astype(F32), u.astype(F32)
        self.focal = focal_mm
        self.sensor = sensor_mm

    def rays(self, xs, ys, w, h):
        """xs, ys are pixel coordinates (float, pixel centres)."""
        half_w = (self.sensor * 0.5) / self.focal
        half_h = half_w * (h / w)
        sx = (xs / w * 2.0 - 1.0) * half_w
        sy = (1.0 - ys / h * 2.0) * half_h
        d = (self.f[None, :] + self.r[None, :] * sx[:, None].astype(F32)
             + self.u[None, :] * sy[:, None].astype(F32))
        return normalize(d.astype(F32))
