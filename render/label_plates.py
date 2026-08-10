#!/usr/bin/env python3
"""Add the brief's callouts to the two plates that carry an argument.

The brief is firm that letting the renderer draw text is the fastest way to
make a technical visual look amateurish, and that labels belong in post as flat
vector type with thin leader lines. So nothing is baked at trace time: this
draws type and leaders over the finished JPEG.

Anchors are given in *world* coordinates and projected through the same camera
that rendered the plate, so a leader line points at the thing it names rather
than at a pixel someone guessed. Move a camera and the labels follow.

    python3 label_plates.py
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mpss_raytracer import Camera, F32          # noqa: E402
import mpss_scene as S                          # noqa: E402
from render_mpss import CAMERAS                 # noqa: E402

FONT_DIR = '/usr/share/fonts/truetype/liberation'
IMAGES = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'images')

INK = (255, 255, 255, 255)
ACCENT = (216, 176, 36, 255)          # the safety yellow already in the renders
SCRIM = (10, 16, 22, 165)
LEADER = (255, 255, 255, 205)


def font(size, bold=True):
    name = 'LiberationSans-%s.ttf' % ('Bold' if bold else 'Regular')
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def project(cam, pt, w, h):
    """World point -> pixel coordinates in the rendered plate."""
    p = np.asarray(pt, F32) - cam.eye
    z = float(p @ cam.f)
    half_w = (cam.sensor * 0.5) / cam.focal
    u = float(p @ cam.r) / z / half_w
    v = float(p @ cam.u) / z / (half_w * (h / w))
    return (u + 1.0) / 2.0 * w, (1.0 - v) / 2.0 * h


def tracked(draw, xy, text, fnt, fill, spacing):
    """Draw letterspaced text -- PIL has no tracking of its own."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + spacing
    return x - xy[0] - spacing


def measure(draw, text, fnt, spacing):
    return sum(draw.textlength(c, font=fnt) + spacing for c in text) - spacing


MARGIN = 28.0


def label(img, cam, anchor, text, offset, size=21, side='left', rule=True):
    """One callout: a dot on the feature, a hairline leader, flat type.

    The box is clamped into the frame. An offset that would push type off the
    edge slides back in rather than being silently cropped -- which is exactly
    what happened the first time these plates were run.
    """
    w, h = img.size
    ax, ay = project(cam, anchor, w, h)
    tx, ty = ax + offset[0], ay + offset[1]
    fnt = font(size)
    spacing = max(size * 0.055, 0.8)

    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    tw = measure(d, text, fnt, spacing)
    th = size * 1.35
    pad_x, pad_y = size * 0.62, size * 0.42

    bx = tx if side == 'left' else tx - tw
    x0, y0 = bx - pad_x, ty - pad_y
    bw, bh = tw + pad_x * 2, th + pad_y * 1.4

    # slide the whole box back inside the frame, keeping text and scrim together
    x0 = min(max(x0, MARGIN), max(MARGIN, w - MARGIN - bw))
    y0 = min(max(y0, MARGIN), max(MARGIN, h - MARGIN - bh))
    bx, ty = x0 + pad_x, y0 + pad_y

    box = (x0, y0, x0 + bw, y0 + bh)
    d.rounded_rectangle(box, radius=2, fill=SCRIM)
    if rule:
        d.rectangle((box[0], box[1], box[0] + 3, box[3]), fill=ACCENT)
    tracked(d, (bx, ty), text, fnt, INK, spacing)

    # leader from the nearest box edge to the anchor, plus a dot on the feature
    join_x = box[2] if ax > box[2] else (box[0] if ax < box[0] else (box[0] + box[2]) / 2)
    join_y = (box[1] + box[3]) / 2
    d.line((join_x, join_y, ax, ay), fill=LEADER, width=2)
    d.ellipse((ax - 5, ay - 5, ax + 5, ay + 5), outline=LEADER, width=2)
    d.ellipse((ax - 1.5, ay - 1.5, ax + 1.5, ay + 1.5), fill=ACCENT)

    img.alpha_composite(layer)
    return box


def check_in_frame(img, boxes):
    """A camera move that pushes a callout off the plate should fail loudly."""
    w, h = img.size
    for box, text in boxes:
        assert box[0] >= 0 and box[1] >= 0 and box[2] <= w and box[3] <= h, (
            'callout %r fell outside the %dx%d frame: %s' % (text, w, h, box))


def footer(img, text, size=26):
    """The series footer line, set quietly along the bottom."""
    w, h = img.size
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    fnt = font(size, bold=False)
    spacing = size * 0.03
    tw = measure(d, text, fnt, spacing)
    x, y = (w - tw) / 2, h - size * 3.0
    d.rounded_rectangle((x - size, y - size * 0.5, x + tw + size, y + size * 1.5),
                        radius=2, fill=SCRIM)
    tracked(d, (x, y), text, fnt, INK, spacing)
    img.alpha_composite(layer)


def open_plate(name):
    im = Image.open(os.path.join(IMAGES, name)).convert('RGBA')
    return im


def save(img, name):
    out = os.path.join(IMAGES, name)
    img.convert('RGB').save(out, quality=92, subsampling=0)
    print('wrote %s (%dx%d)' % (os.path.relpath(out), img.width, img.height))


def scene4():
    """Scene 4 -- the 7.5 m offset, which is the whole point of the frame."""
    img = open_plate('mpss-turbine-erection.jpg')
    spec = CAMERAS['erect']
    cam = Camera(spec['eye'], spec['target'], focal_mm=spec['focal'])
    deck = 7.35
    boxes = [
        (label(img, cam, (-S.COL_C, deck + 1.0, S.COL_C),
               'TOWER MOUNTED 7.5 m INBOARD — DEAD CENTRE ON THE CORNER COLUMN',
               offset=(-790, -140), size=23, side='left'), 'offset'),
        (label(img, cam, (S.COL_C, deck + 0.1, -S.COL_C),
               'COLUMN HARD POINTS MARKED ON THE DECK',
               offset=(-470, 120), size=19, side='left'), 'hard points'),
        (label(img, cam, (-S.COL_C, deck + 55.0, S.COL_C),
               'SECOND TOWER SECTION ON THE HOOK',
               offset=(150, -60), size=19, side='left'), 'hook'),
    ]
    check_in_frame(img, boxes)
    save(img, 'mpss-turbine-erection-labelled.jpg')


def scene5():
    """Scene 5 -- the four zones, the money shot's callout set."""
    img = open_plate('mpss-deck-loadout.jpg')
    spec = CAMERAS['quay']
    cam = Camera(spec['eye'], spec['target'], focal_mm=spec['focal'])
    deck = 7.35
    boxes = [
        (label(img, cam, (-S.COL_C, deck + 40.0, S.COL_C),
               '15 MW WIND TURBINE — ON THE CORNER COLUMN',
               offset=(120, -40), size=22, side='left'), 'turbine'),
        (label(img, cam, (25.0, deck + 9.0, 23.0),
               'DATA CENTRE — CONTAINERS STACKED 3 HIGH',
               offset=(90, -150), size=20, side='left'), 'data centre'),
        (label(img, cam, (-27.0, deck + 16.0, -30.0),
               'CCS — CO₂ COMPRESSION AND COOLING',
               offset=(-560, -120), size=20, side='left'), 'ccs'),
        (label(img, cam, (21.0, deck + 3.0, -26.0),
               'BESS AND POWER CONVERSION',
               offset=(150, 130), size=20, side='left'), 'bess'),
        (label(img, cam, (0.0, deck, -S.DECK_HALF - 2.0),
               'DECK AT QUAY LEVEL — MODULES ROLL ON',
               offset=(-520, 150), size=20, side='left'), 'deck'),
    ]
    check_in_frame(img, boxes)
    footer(img, 'DECK 90 × 90 m  ·  COLUMNS 15 m SQ  ·  '
                'SINGLE 27 m OPERATING DRAFT', size=24)
    save(img, 'mpss-deck-loadout-labelled.jpg')


if __name__ == '__main__':
    scene4()
    scene5()
