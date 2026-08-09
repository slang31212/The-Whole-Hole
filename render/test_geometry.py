#!/usr/bin/env python3
"""Assert the geometry lock from the brief.

Cameras, blade phase, lighting and dressing are all free to change. These
numbers are not. Run this after touching mpss_scene.py:

    python3 test_geometry.py
"""
import sys

import mpss_scene as S


def check(label, got, want, tol=1e-6):
    ok = abs(got - want) <= tol
    print('%-46s %-10s %s' % (label, round(got, 3), 'ok' if ok else 'FAIL (want %s)' % want))
    return ok


def main():
    r = []
    r.append(check('deck side (m)', S.DECK, 90.0))
    r.append(check('deck girder depth (m)', S.DECK_THK, 7.0))
    r.append(check('deck area (m2)', S.DECK * S.DECK, 8100.0))
    r.append(check('column plan size (m)', S.COL, 15.0))
    r.append(check('column centreline inset from edge (m)', S.COL_INSET, 7.5))
    r.append(check('column centre spacing (m)', 2 * S.COL_C, 75.0))
    r.append(check('column outer face flush with deck edge',
                   S.COL_C + S.COL_HALF, S.DECK_HALF))
    r.append(check('operating draft (m)', S.DRAFT, 27.0))
    r.append(check('pontoon depth (m)', S.PONT_H, 9.0))
    r.append(check('ring pontoon inner edge (m from centre)',
                   S.DECK_HALF - S.COL, 30.0))
    r.append(check('deck underside above waterline at sea (m)', S.AIRGAP, 20.0))
    r.append(check('tower base diameter (m)', S.TOWER_BASE_D, 10.0))
    r.append(check('hub height above deck (m)', S.HUB_HEIGHT, 150.0))
    r.append(check('rotor diameter (m)', S.ROTOR_R * 2, 236.0, tol=1.0))
    r.append(check('rotor / deck width ratio', S.ROTOR_R * 2 / S.DECK, 2.6, tol=0.05))
    r.append(check('40 ft container length (m)', S.CTR_L, 12.192))

    # the load path: tower centreline must land on the NW column centreline
    tower = (-S.COL_C, S.COL_C)
    r.append(check('tower centreline x == NW column centre x', tower[0], -37.5))
    r.append(check('tower centreline z == NW column centre z', tower[1], 37.5))
    r.append(check('tower base fits inside the column footprint',
                   S.COL - S.TOWER_BASE_D, 5.0))

    # every scene must build
    for name, fn in (('quay', S.scene_quay_loaded),
                     ('erect', S.scene_turbine_erection),
                     ('station', S.scene_on_station)):
        sc, env = fn()
        print('%-46s %d boxes, %d cones, %d clusters'
              % ('scene %r builds' % name, sc.nb, len(sc.CH), len(sc.clusters)))
        r.append(sc.nb > 0)

    bad = r.count(False)
    print('\n%d checks, %d failed' % (len(r), bad))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
