"""Build the Universe Library tonal ramps in OKLCH and check contrast."""
import json
import math

STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
LIGHT = [0.975, 0.95, 0.90, 0.84, 0.77, 0.69, 0.60, 0.50, 0.40, 0.30, 0.22]


def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lin_to_srgb(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def hex_to_rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def rgb_to_hex(rgb):
    return "#" + "".join(f"{round(min(max(c, 0), 1) * 255):02x}" for c in rgb)


def rgb_to_oklab(rgb):
    r, g, b = (srgb_to_lin(c) for c in rgb)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (math.copysign(abs(x) ** (1 / 3), x) for x in (l, m, s))
    return (
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    )


def oklab_to_rgb(L, a, b):
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return [lin_to_srgb(c) if c >= 0 else -1 for c in (r, g, bb)]


def to_lch(h):
    L, a, b = rgb_to_oklab(hex_to_rgb(h))
    return L, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def from_lch(L, C, H):
    """Largest chroma <= C that stays inside sRGB."""
    lo, hi = 0.0, C
    for _ in range(30):
        mid = (lo + hi) / 2
        rgb = oklab_to_rgb(L, mid * math.cos(math.radians(H)), mid * math.sin(math.radians(H)))
        if all(-1e-4 <= c <= 1 + 1e-4 for c in rgb):
            lo = mid
        else:
            hi = mid
    return rgb_to_hex(oklab_to_rgb(L, lo * math.cos(math.radians(H)), lo * math.sin(math.radians(H))))


def luminance(h):
    return sum(w * srgb_to_lin(c) for w, c in zip((0.2126, 0.7152, 0.0722), hex_to_rgb(h)))


def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def shape(L):
    # chroma envelope: strongest in the middle tones, gentle at both ends
    return (1 - L) ** 0.55 * L ** 0.9


def ramp(anchor, chroma_boost=1.0, hue_shift=0.0):
    La, Ca, Ha = to_lch(anchor)
    out = {}
    nearest = min(range(len(LIGHT)), key=lambda i: abs(LIGHT[i] - La))
    for i, (step, L) in enumerate(zip(STEPS, LIGHT)):
        if i == nearest:
            out[step] = anchor
            continue
        C = Ca * chroma_boost * shape(L) / shape(La)
        # a slight hue walk keeps dark shades from going muddy: warmer for amber/rose
        H = Ha + hue_shift * (La - L)
        out[step] = from_lch(L, C, H)
    return out, STEPS[nearest], (round(La, 3), round(Ca, 3), round(Ha, 1))


palettes = {
    "blue": ramp("#9ecbff"),
    "amber": ramp("#ffd9a0", hue_shift=-25),
    "violet": ramp("#c7a6ff"),
    "rose": ramp("#ff8fb0", hue_shift=-10),
}
# the neutral is the cold, faintly blue grey of the existing ink colours
neutral = {}
for step, L in zip(STEPS, LIGHT):
    neutral[step] = from_lch(L, 0.028 if L > 0.3 else 0.03, 263)
neutral[1000] = "#05070d"
palettes["space"] = (neutral, None, to_lch("#99a3b6"))

base = "#05070d"
glass = "#10141f"  # rgba(16,20,34,.52) over black, roughly
report = {}
for name, (shades, anchor_step, lch) in palettes.items():
    report[name] = {
        "anchor": anchor_step,
        "lch": lch,
        "shades": shades,
        "contrast_on_space": {s: round(contrast(h, base), 2) for s, h in shades.items()},
        "contrast_on_glass": {s: round(contrast(h, glass), 2) for s, h in shades.items()},
    }
print(json.dumps(report, indent=1))
for ink in ["#e6eaf2", "#99a3b6", "#6b7487"]:
    print(ink, "on space", round(contrast(ink, base), 2), "on glass", round(contrast(ink, glass), 2), to_lch(ink))
