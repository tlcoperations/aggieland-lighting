#!/usr/bin/env python3
"""Draws the three SAMPLE placeholder cutouts used by /preview/ (transparent PNGs).

These are simple silhouettes, not real products. Run manually (needs Pillow):
    pip install pillow
    python3 scripts/preview/make_sample_cutouts.py
Output goes to src/images/preview/. Scale is 30 px per inch of the dimensions
listed in src/_data/previewFixtures.json.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[2] / "src" / "images" / "preview"
PX_PER_IN = 30
SS = 3  # supersampling for smooth edges

BRONZE = (59, 42, 34, 255)
BRASS = (184, 147, 90, 255)
GLOW = (255, 236, 190, 255)
CREAM = (248, 239, 230, 255)


def font(size):
    for name in ("DejaVuSans-Bold.ttf", "Arial Bold.ttf", "Arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def canvas(w_in, h_in):
    w, h = w_in * PX_PER_IN * SS, h_in * PX_PER_IN * SS
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img), w, h


def label(d, cx, cy, size, fill=CREAM):
    f = font(size)
    d.text((cx, cy), "SAMPLE", font=f, fill=fill, anchor="mm")


def finish(img, name):
    w, h = img.size[0] // SS, img.size[1] // SS
    img = img.resize((w, h), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / name, optimize=True)
    print(f"wrote {name} ({w}x{h}px)")


def chandelier():
    img, d, w, h = canvas(28, 30)
    cx = w // 2
    d.rounded_rectangle((cx - 70 * SS // 1, 0, cx + 70 * SS // 1, 28 * SS), 10 * SS, fill=BRASS)
    d.rectangle((cx - 4 * SS, 28 * SS, cx + 4 * SS, 300 * SS), fill=BRONZE)
    ring_y, ring_rx, ring_ry = 520 * SS, 390 * SS, 70 * SS
    d.ellipse((cx - ring_rx, ring_y - ring_ry, cx + ring_rx, ring_y + ring_ry), outline=BRONZE, width=14 * SS)
    d.ellipse((cx - 40 * SS, 250 * SS, cx + 40 * SS, 330 * SS), fill=BRASS)
    for side in (-1, 1):
        for tier, (ex, ey) in enumerate(((330, 440), (190, 360))):
            pts = [(cx + side * (10 + (ex - 10) * t / 24) * SS,
                    (330 + (ey - 330) * math.sin(t / 24 * math.pi / 2)) * SS) for t in range(25)]
            d.line(pts, fill=BRONZE, width=11 * SS)
    candles = [(cx + s * x * SS, y * SS) for s in (-1, 1) for x, y in ((330, 440), (190, 360))]
    candles += [(cx, 520 * SS - ring_ry), (cx, 520 * SS + ring_ry)]
    for s in (-1, 1):
        for x in (250, 120):
            ang = math.acos(x / 390)
            candles.append((cx + s * x * SS, ring_y + math.sin(ang) * ring_ry))
    for (x, y) in candles:
        d.rectangle((x - 13 * SS, y - 90 * SS, x + 13 * SS, y), fill=CREAM)
        d.rectangle((x - 20 * SS, y - 8 * SS, x + 20 * SS, y + 14 * SS), fill=BRASS)
        d.polygon([(x, y - 140 * SS), (x - 17 * SS, y - 90 * SS), (x + 17 * SS, y - 90 * SS)], fill=GLOW)
    d.ellipse((cx - 56 * SS, ring_y + ring_ry - 10 * SS, cx + 56 * SS, ring_y + ring_ry + 130 * SS), fill=BRASS)
    d.rectangle((cx - 4 * SS, 700 * SS, cx + 4 * SS, 760 * SS), fill=BRONZE)
    d.polygon([(cx, 830 * SS), (cx - 24 * SS, 750 * SS), (cx + 24 * SS, 750 * SS)], fill=BRONZE)
    label(d, cx, 872 * SS, 44 * SS, fill=BRONZE)
    finish(img, "sample-chandelier.png")


def pendant():
    img, d, w, h = canvas(12, 16)
    cx = w // 2
    d.rounded_rectangle((cx - 30 * SS, 0, cx + 30 * SS, 16 * SS), 6 * SS, fill=BRASS)
    d.rectangle((cx - 3 * SS, 16 * SS, cx + 3 * SS, 150 * SS), fill=BRONZE)
    d.rounded_rectangle((cx - 22 * SS, 150 * SS, cx + 22 * SS, 190 * SS), 8 * SS, fill=BRASS)
    shade = [(cx - 40 * SS, 190 * SS), (cx + 40 * SS, 190 * SS)]
    for t in range(0, 31):
        a = t / 30
        y = (190 + 270 * a) * SS
        half = (40 + 140 * (a ** 1.6)) * SS
        shade.append((cx + half, y))
    shade2 = [(cx - (p[0] - cx), p[1]) for p in shade[2:]][::-1]
    d.polygon(shade[:2] + shade[2:] + shade2, fill=BRONZE)
    d.rectangle((cx - 180 * SS, 450 * SS, cx + 180 * SS, 462 * SS), fill=BRASS)
    d.ellipse((cx - 150 * SS, 440 * SS, cx + 150 * SS, 480 * SS), fill=GLOW)
    d.rectangle((cx - 180 * SS, 455 * SS, cx + 180 * SS, 462 * SS), fill=BRASS)
    label(d, cx, 345 * SS, 38 * SS)
    img = img.crop((0, 0, img.size[0], 480 * SS))
    finish(img, "sample-pendant.png")


def linear():
    img, d, w, h = canvas(48, 8)
    for x in (w * 0.2, w * 0.8):
        d.rounded_rectangle((x - 30 * SS, 0, x + 30 * SS, 14 * SS), 5 * SS, fill=BRASS)
        d.rectangle((x - 3 * SS, 14 * SS, x + 3 * SS, 85 * SS), fill=BRONZE)
    d.rounded_rectangle((20 * SS, 80 * SS, w - 20 * SS, 122 * SS), 20 * SS, fill=BRONZE)
    d.rectangle((20 * SS, 112 * SS, w - 20 * SS, 122 * SS), fill=BRASS)
    for i in range(4):
        x = w * (0.125 + 0.25 * i)
        d.ellipse((x - 62 * SS, 118 * SS, x + 62 * SS, 238 * SS), fill=GLOW, outline=BRASS, width=5 * SS)
    label(d, w // 2, 101 * SS, 30 * SS)
    finish(img, "sample-linear-pendant.png")


if __name__ == "__main__":
    chandelier()
    pendant()
    linear()
