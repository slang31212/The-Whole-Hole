#!/usr/bin/env python3
"""Composite rendered panels into a strip or triptych.

Scenes 6 and 8 are multi-panel by definition. Rendering each panel separately
and compositing is what "same camera, same lighting" actually requires -- one
wide shot of four platforms would give every panel a different perspective.

    python3 make_strip.py --out ../images/mpss-four-missions.jpg \
        panel-wind.jpg panel-power.jpg panel-carbon.jpg panel-data.jpg
"""
import argparse

from PIL import Image


def build(paths, gutter=6, edge=0, bg=(214, 217, 220)):
    ims = [Image.open(p).convert('RGB') for p in paths]
    w = min(i.width for i in ims)
    h = min(i.height for i in ims)
    ims = [i if i.size == (w, h) else i.resize((w, h), Image.LANCZOS) for i in ims]
    n = len(ims)
    total_w = n * w + (n - 1) * gutter + 2 * edge
    strip = Image.new('RGB', (total_w, h + 2 * edge), bg)
    for i, im in enumerate(ims):
        strip.paste(im, (edge + i * (w + gutter), edge))
    return strip


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('panels', nargs='+')
    ap.add_argument('--out', required=True)
    ap.add_argument('--gutter', type=int, default=6,
                    help='hairline between panels, px (0 for a seamless strip)')
    ap.add_argument('--edge', type=int, default=0)
    a = ap.parse_args()
    strip = build(a.panels, a.gutter, a.edge)
    strip.save(a.out, quality=94, subsampling=0)
    print('wrote %s (%dx%d) from %d panels'
          % (a.out, strip.width, strip.height, len(a.panels)))


if __name__ == '__main__':
    main()
