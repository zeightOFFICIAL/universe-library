"""Universe Library logo: one geometry, written as SVG and rasterised with Pillow.

The mark is a two-armed spiral galaxy seen face-on: an amber core (old stars),
arms that run amber -> blue -> violet outwards (the brand ramps), two faint
secondary arms, and a small four-point star on one arm - the Sun, "you are here",
which is what the map is for.

Usage: python -I design/logo.py <repo root> <scratch dir>
Writes static/Icons/Universe*; the loader snippet and a contact sheet go to <scratch dir>.
See DESIGN.md section 2.2 for what each part means and section 14 for the workflow.
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(sys.argv[1])
ICONS = ROOT / "static" / "Icons"

AMBER_100, AMBER_200 = "#ffecce", "#ffd9a0"
BLUE_300 = "#9ecbff"
VIOLET_400, VIOLET_600 = "#c7a6ff", "#8f69c7"
ROSE_300, ROSE_400 = "#ffb1c5", "#ff8fb0"
SPACE_950, SPACE_1000 = "#131a29", "#05070d"
# radius (as a fraction of ARM_REACH) -> colour, shared by SVG and raster
ARM_STOPS = [(0.0, AMBER_100), (0.14, AMBER_200), (0.36, BLUE_300), (0.62, VIOLET_400), (0.84, "#aa85e4"), (1.0, VIOLET_600)]
ARM_REACH = 46.0

K = 0.395  # log-spiral growth per radian (pitch ~22 degrees: open, readable at 16px)
R0 = 5.0


def smoothstep(a, b, x):
    t = min(max((x - a) / (b - a), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def arm(phase, sweep, width, start=0.0, n=90, twist=-1):
    """Polygon for one tapered arm of a log spiral, trailing (twist -1 turns clockwise)."""
    left, right = [], []
    for i in range(n + 1):
        t = min(start + (1 - start) * i / n, 1.0)
        th = sweep * t
        r = R0 * math.exp(K * th)
        a = phase + twist * th
        x, y = r * math.cos(a), r * math.sin(a)
        # tangent of the curve, then its normal
        dr = K * r
        tx = dr * math.cos(a) - r * math.sin(a) * twist
        ty = dr * math.sin(a) + r * math.cos(a) * twist
        L = math.hypot(tx, ty)
        nx, ny = -ty / L, tx / L
        # thickest a third of the way out, a fine point at the tip, swelling from the core
        w = width * smoothstep(0.0, 0.2, t) ** 0.5 * (1 - t) ** 0.75 + 0.5
        left.append((x + nx * w / 2, y + ny * w / 2))
        right.append((x - nx * w / 2, y - ny * w / 2))
    return left + right[::-1]


def sparkle(cx, cy, size, waist=0.22):
    pts = []
    for i in range(8):
        a = -math.pi / 2 + i * math.pi / 4
        r = size if i % 2 == 0 else size * waist
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def geometry(bold=False):
    main_w = 15.5 if bold else 12.0
    shapes = {
        "main": [arm(0.0, 5.5, main_w), arm(math.pi, 5.5, main_w)],
        "faint": [] if bold else [arm(math.pi / 2, 4.6, 4.6, start=0.22), arm(-math.pi / 2, 4.6, 4.6, start=0.22)],
    }
    # the Sun sits on the first arm, a little past halfway out (like the Orion Spur)
    th = 5.5 * 0.66
    r = R0 * math.exp(K * th)
    a = -th
    shapes["sun"] = None if bold else (r * math.cos(a), r * math.sin(a))
    # star-forming knots: the rose of hydrogen-alpha, strung along the arms
    knots = []
    for phase, t in ((0.0, 0.44), (0.0, 0.84), (math.pi, 0.52), (math.pi, 0.74)):
        th = 5.5 * t
        r = R0 * math.exp(K * th)
        knots.append((r * math.cos(phase - th), r * math.sin(phase - th), 1.25 if t < 0.6 else 1.0))
    shapes["knots"] = [] if bold else knots
    return shapes


def path(points):
    head = f"M{points[0][0]:.1f} {points[0][1]:.1f}"
    return head + "".join(f"L{x:.1f} {y:.1f}" for x, y in points[1:]) + "Z"


def svg_defs(p):
    stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in ARM_STOPS)
    return (
        f'<defs>'
        f'<radialGradient id="{p}arm" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="{ARM_REACH}">{stops}</radialGradient>'
        f'<radialGradient id="{p}core"><stop offset="0" stop-color="#fffaf0"/>'
        f'<stop offset=".38" stop-color="{AMBER_200}" stop-opacity=".9"/>'
        f'<stop offset="1" stop-color="{AMBER_200}" stop-opacity="0"/></radialGradient>'
        f'</defs>'
    )


def svg_mark(p, bold=False, arms_class=None):
    g = geometry(bold)
    cls = f' class="{arms_class}"' if arms_class else ""
    body = f'<g{cls} fill="url(#{p}arm)">'
    body += "".join(f'<path d="{path(s)}"/>' for s in g["main"])
    body += "".join(f'<path d="{path(s)}" opacity=".42"/>' for s in g["faint"])
    for x, y, kr in g["knots"]:
        body += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{kr * 1.9:.1f}" fill="{ROSE_400}" opacity=".3"/>'
        body += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{kr:.1f}" fill="{ROSE_300}"/>'
    if g["sun"]:
        x, y = g["sun"]
        body += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.2" fill="{AMBER_200}" opacity=".28"/>'
        body += f'<path d="{path(sparkle(x, y, 4.6))}" fill="#fffaf0"/>'
    body += "</g>"
    body += f'<circle r="{12 if bold else 10}" fill="url(#{p}core)"/>'
    return body


def write_svgs():
    mark = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100" role="img" aria-label="Universe Library">'
        "<title>Universe Library</title>" + svg_defs("ul-") + svg_mark("ul-") + "</svg>\n"
    )
    badge = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100">'
        + svg_defs("ulf-")[:-7]
        + f'<linearGradient id="ulf-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SPACE_950}"/><stop offset="1" stop-color="{SPACE_1000}"/></linearGradient></defs>'
        + '<rect x="-50" y="-50" width="100" height="100" rx="22" fill="url(#ulf-bg)"/>'
        + '<g transform="scale(.9)">' + svg_mark("ulf-", bold=True) + "</g></svg>\n"
    )
    (ICONS / "UniverseLogo.svg").write_text(mark, encoding="utf-8")
    (ICONS / "UniverseFavicon.svg").write_text(badge, encoding="utf-8")
    # the loader spins the arms; its copy uses its own ids so it can sit in the page
    loader = (
        '<svg class="LoaderGalaxy" viewBox="-50 -50 100 100" aria-hidden="true">'
        + svg_defs("loader-") + svg_mark("loader-", arms_class="LoaderArms") + "</svg>"
    )
    (Path(sys.argv[2]) / "loader_snippet.svg").write_text(loader, encoding="utf-8")


# ---------- raster ----------

def hex_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32) / 255


def render(size, badge, bold):
    ss = 8
    S = size * ss
    scale = S / 100 * (0.9 if badge else 1.0)
    ys, xs = np.mgrid[0:S, 0:S].astype(np.float32)
    ux, uy = (xs + 0.5 - S / 2) / scale, (ys + 0.5 - S / 2) / scale
    rad = np.hypot(ux, uy)

    out = np.zeros((S, S, 4), dtype=np.float32)  # premultiplied
    if badge:
        bg = Image.new("L", (S, S), 0)
        ImageDraw.Draw(bg).rounded_rectangle([0, 0, S - 1, S - 1], radius=0.22 * S, fill=255)
        m = np.asarray(bg, dtype=np.float32)[..., None] / 255
        t = (ys / S)[..., None]
        col = hex_rgb(SPACE_950) * (1 - t) + hex_rgb(SPACE_1000) * t
        out[..., :3] = col * m
        out[..., 3:] = m

    def over(color, alpha):
        a = alpha[..., None]
        out[..., :3] = color * a + out[..., :3] * (1 - a)
        out[..., 3:] = a + out[..., 3:] * (1 - a)

    # arm colour field: the same radial stops as the SVG
    f = np.clip(rad / ARM_REACH, 0, 1)
    offs = [o for o, _ in ARM_STOPS]
    cols = np.stack([hex_rgb(c) for _, c in ARM_STOPS])
    field = np.stack([np.interp(f, offs, cols[:, ch]) for ch in range(3)], axis=-1)

    def poly_mask(points):
        img = Image.new("L", (S, S), 0)
        ImageDraw.Draw(img).polygon([(S / 2 + x * scale, S / 2 + y * scale) for x, y in points], fill=255)
        return np.asarray(img, dtype=np.float32) / 255

    g = geometry(bold)
    for s in g["faint"]:
        over(field, poly_mask(s) * 0.42)
    for s in g["main"]:
        over(field, poly_mask(s))
    for x, y, kr in g["knots"]:
        d = np.hypot(ux - x, uy - y)
        over(hex_rgb(ROSE_400), (d < kr * 1.9).astype(np.float32) * 0.3)
        over(hex_rgb(ROSE_300), (d < kr).astype(np.float32))
    if g["sun"]:
        x, y = g["sun"]
        halo = np.clip(1 - np.hypot(ux - x, uy - y) / 4.2, 0, 1) > 0
        over(hex_rgb(AMBER_200), halo.astype(np.float32) * 0.28)
        over(hex_rgb("#fffaf0"), poly_mask(sparkle(x, y, 4.6)))
    cr = 12 if bold else 10
    t = np.clip(rad / cr, 0, 1)
    core_a = np.interp(t, [0, 0.38, 1], [1, 0.9, 0])
    core_c = np.stack([np.interp(t, [0, 0.38, 1], [c0, c1, c1]) for c0, c1 in zip(hex_rgb("#fffaf0"), hex_rgb(AMBER_200))], -1)
    over(core_c, core_a)

    a = out[..., 3:]
    rgb = np.where(a > 0, out[..., :3] / np.maximum(a, 1e-6), 0)
    img = Image.fromarray(np.uint8(np.clip(np.concatenate([rgb, a], -1), 0, 1) * 255 + 0.5), "RGBA")
    return img.resize((size, size), Image.LANCZOS)


def write_rasters():
    sizes = [16, 32, 48]
    frames = [render(s, badge=True, bold=True) for s in sizes]
    frames[-1].save(ICONS / "UniverseFavicon.ico", sizes=[(s, s) for s in sizes], append_images=frames[:-1])
    render(180, badge=True, bold=False).save(ICONS / "UniverseLogo-180.png", optimize=True)
    render(512, badge=False, bold=False).save(ICONS / "UniverseLogo-512.png", optimize=True)
    # a contact sheet for checking the small sizes by eye
    sheet = Image.new("RGBA", (16 + 32 + 48 + 180 + 40, 190), (230, 233, 240, 255))
    x = 8
    for im in frames + [render(180, badge=True, bold=False)]:
        sheet.alpha_composite(im, (x, 5))
        x += im.width + 8
    sheet.save(Path(sys.argv[2]) / "logo_sheet.png")


write_svgs()
write_rasters()
print("ok")
