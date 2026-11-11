#!/usr/bin/env python3
"""Render ikon My Daily dari master buku-sakura-asli.png.
Contoh: python3 render_ikon.py 512 100   -> mydaily-512.png (isi 100%)
Warna latar: ungu pekat (150,102,232) -> (84,38,176).
"""
import sys
from PIL import Image, ImageDraw
from pathlib import Path

BASE = Path(__file__).parent
ART = Image.open(BASE / "buku-sakura-asli.png").convert("RGBA")
C1, C2 = (150, 102, 232), (84, 38, 176)

def grad(size):
    g = Image.new("RGB", (1, size)); d = ImageDraw.Draw(g)
    for y in range(size):
        t = y / (size - 1)
        d.point((0, y), tuple(int(C1[i] + (C2[i] - C1[i]) * t) for i in range(3)))
    return g.resize((size, size)).convert("RGBA")

def icon(size, fill=100, rounded=True, radius=0.235):
    c = grad(size)
    tw = max(1, int(size * fill / 100)); th = int(tw * ART.size[1] / ART.size[0])
    c.alpha_composite(ART.resize((tw, th), Image.LANCZOS), ((size - tw) // 2, (size - th) // 2))
    if rounded:
        m = Image.new("L", (size, size), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius), fill=255)
        c.putalpha(m)
    return c

if __name__ == "__main__":
    size = int(sys.argv[1]) if len(sys.argv) > 1 else 512
    fill = float(sys.argv[2]) if len(sys.argv) > 2 else 100
    out = BASE / f"mydaily-{size}-{int(fill)}.png"
    icon(size, fill).save(out, optimize=True)
    print(out)
