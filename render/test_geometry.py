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
    # IEA-15-240-RWT (NREL/DTU 15 MW reference turbine)
    r.append(check('rotor diameter (m)', S.ROTOR_R * 2, 240.0))
    r.append(check('blade length (m)', S.BLADE_LEN, 117.0))
    r.append(check('tower top OD (m)', S.tower_radius_at(S.HUB_HEIGHT) * 2, 6.5))
    r.append(check('hub diameter (m)', S.HUB_D, 7.94))
    r.append(check('shaft tilt (deg)', S.SHAFT_TILT, 6.0))
    r.append(check('precone (deg)', S.PRECONE, 4.0))
    r.append(check('rotor / deck width ratio', S.ROTOR_R * 2 / S.DECK, 2.67, tol=0.01))
    r.append(check('40 ft container length (m)', S.CTR_L, 12.192))

    # the load path: tower centreline must land on the NW column centreline
    tower = (-S.COL_C, S.COL_C)
    r.append(check('tower centreline x == NW column centre x', tower[0], -37.5))
    r.append(check('tower centreline z == NW column centre z', tower[1], 37.5))
    r.append(check('tower base fits inside the column footprint',
                   S.COL - S.TOWER_BASE_D, 5.0))

    # every scene must build
    for name, fn in (('series', S.scene_hulls_in_series),
                     ('quay', S.scene_quay_loaded),
                     ('deckbox', S.scene_deck_on_quay),
                     ('loading', S.scene_loading_begins),
                     ('erect', S.scene_turbine_erection),
                     ('station', S.scene_on_station)):
        sc, env = fn()
        print('%-46s %d boxes, %d cones, %d clusters'
              % ('scene %r builds' % name, sc.nb, len(sc.CH), len(sc.clusters)))
        r.append(sc.nb > 0)

    # the multi-panel scenes: every panel and every mission must build
    for panel in ('A', 'B', 'C'):
        sc, env = S.scene_wet_mating(panel)
        print('%-46s %d boxes, %d cones'
              % ("mating panel %r builds" % panel, sc.nb, len(sc.CH)))
        r.append(sc.nb > 0)
    for mission in S.MISSIONS:
        sc, env = S.scene_single_mission(mission)
        print('%-46s %d boxes, %d cones'
              % ("mission %r builds" % mission, sc.nb, len(sc.CH)))
        r.append(sc.nb > 0)

    # mating has to be geometrically possible: the floating deck must clear
    # the ballasted hull's column tops on the way in
    col_top = (S.PONT_H + S.HULL_COL_H) - S.MATE_DRAFT
    r.append(check('mating column tops proud of water (m)', col_top, 2.5))
    r.append(check('deck clears the cone tips by (m)',
                   S.MATE_DECK_BOTTOM - (col_top + 0.8), 0.2, tol=0.01))

    bad = r.count(False)
    print('\n%d checks, %d failed' % (len(r), bad))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
