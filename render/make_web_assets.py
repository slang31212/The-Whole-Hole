#!/usr/bin/env python3
"""Emit web-sized derivatives of the plates into images/web/.

The masters in images/ are sized for inspection and print -- 330-750 KB each.
Putting one straight into a landing page costs most of a megabyte above the
fold, and the hero band alone would be more weight than the entire rest of the
site. So the masters stay as masters and this writes delivery copies.

Each plate gets a 1x and a 2x variant at the width it is actually displayed at,
in WebP with a JPEG fallback, which is what the <picture> elements in the site
reference. Sizes are printed so the budget is checkable rather than asserted.

    python3 make_web_assets.py
"""
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'images')
OUT = os.path.join(SRC, 'web')

# name -> the CSS width the plate is displayed at. 2x is generated from it.
# The full-width hero band is the only one that gets near the master's width.
PLATES = {
    'mpss-on-station': 1400,            # hero band, full-bleed
    'mpss-hulls-in-series': 1000,       # in-section, index #about
    'mpss-deck-loadout-labelled': 900,  # in-section portrait, index #specs
    'mpss-turbine-erection-labelled': 1000,   # in-section, memo #solution
    'mpss-four-missions': 1200,         # the strip, index #leasing + invest
}

QUALITY_JPEG = 82
QUALITY_WEBP = 80


def derive(stem, width):
    src = Image.open(os.path.join(SRC, stem + '.jpg')).convert('RGB')
    out = []
    for scale in (1, 2):
        w = min(width * scale, src.width)         # never upscale past the master
        h = round(src.height * w / src.width)
        im = src.resize((w, h), Image.LANCZOS)
        suffix = '' if scale == 1 else '@2x'
        for ext, kw in (('jpg', dict(quality=QUALITY_JPEG, optimize=True,
                                     progressive=True)),
                        ('webp', dict(quality=QUALITY_WEBP, method=6))):
            path = os.path.join(OUT, '%s-%d%s.%s' % (stem, width, suffix, ext))
            im.save(path, **kw)
            out.append((path, w, h))
        if w == src.width:
            break                                  # 2x would be a duplicate
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for stem, width in PLATES.items():
        for path, w, h in derive(stem, width):
            kb = os.path.getsize(path) / 1024
            total += kb
            print('%-52s %5dx%-5d %6.0f KB' % (os.path.basename(path), w, h, kb))
    print('-' * 78)
    print('%-52s %17.0f KB' % ('total in images/web/', total))


if __name__ == '__main__':
    main()
