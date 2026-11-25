"""
Galactic placement of star systems, plus reference landmarks, for the main page's
galaxy view.

Star systems are keyed by href (the system name without spaces). Positions use
galactic coordinates as seen from the Sun:
    l   galactic longitude, degrees (0 = towards the galactic centre)
    b   galactic latitude, degrees (+90 = north galactic pole)
    d   distance from the Sun, light-years
Fictional systems have no real sky position; they carry an explicit galactocentric
position instead (x, z in light-years, galactic centre at 0,0) and a "source" to
credit. "hidden" keeps an entry without drawing it.

A system without an entry here is simply left out of the galaxy view.

Sources: distance to the galactic centre from the GRAVITY collaboration's 2019
measurement of 8.178 kpc; the Sun sits ~65 ly north of the galactic plane. All
l/b values are computed from J2000 RA/Dec and verified against the catalogue
positions (Sgr A* lands on l=0, b=0 by definition, which checks the conversion).
"""

SUN_TO_GALACTIC_CENTRE_LY = 26_700
SUN_HEIGHT_ABOVE_PLANE_LY = 65

# ---------- the places, from db.sqlite3 ----------
#
# Star systems' placements and every named place on the map live in the database
# (tables galaxy_placement, deep_sky, planetary_systems, fiction_places, spacecraft,
# stellar_objects; see AGENTS.md), so adding one is a row, not a code change. The
# galaxies, the arms and the sky constants stay here.
#
# Provenance, unchanged from when these were lists in this file: every real l/b is
# computed from J2000 RA/Dec with one transform, checked by reproducing Sgr A*, M42,
# the Pleiades, Omega Centauri and Barnard's Star to 0.01 degrees; d is light-years
# from the Sun. Fiction set at a real star sits at it ("anchor"); Mass Effect places
# were read off the Mass Effect 3 galaxy map, deprojected for its tilt and scaled so
# the Arcturus Stream lands on the Sun (Omega from the Mass Effect 2 map); other
# fiction is placed by eye (x, z: galactocentric light-years). Spacecraft distances
# are AU for late 2026. Stellar objects: masses and radii in Suns, temperatures in K,
# luminosities in Suns. Empty columns are NULL and are left out, so the page can tell
# "not set" from zero.

from starsystems.models import DeepSky, FictionPlace, GalaxyPlacement, PlanetarySystem, Spacecraft, StellarObject, Territory

# database column -> the key the page has always used
_KEYS = {"radius_km": "radiusKm"}


def _rows(model, order="id", drop=("id",)):
    return [
        {_KEYS.get(key, key): value for key, value in row.items() if value is not None and key not in drop}
        for row in model.objects.order_by(order).values()
    ]


def parse_stars(text):
    """"5790:1.22, 5260:0.86" -> [{"t": 5790, "r": 1.22}, ...]; "pulsar" stays a word.

    The stars drawn when the map flies to a system: temperature in kelvin (it sets
    the colour) and radius in Suns (it sets the drawn size, compressed).
    """
    if not text:
        return None
    if text.strip() == "pulsar":
        return "pulsar"
    stars = []
    for part in text.split(","):
        t, _, r = part.strip().partition(":")
        try:
            stars.append({"t": float(t), "r": float(r or 1)})
        except ValueError:
            continue
    return stars or None


def _with_stars(row):
    stars = parse_stars(row.pop("stars", None))
    if stars:
        row["stars"] = stars
    return row


def galaxy_placement():
    """Placements keyed by href. fictional and hidden appear only when set."""
    placements = {}
    for row in _rows(GalaxyPlacement, order="sort", drop=("sort",)):
        _with_stars(row)
        href = row.pop("href")
        for flag in ("fictional", "hidden"):
            if row.get(flag):
                row[flag] = True
            else:
                row.pop(flag, None)
        placements[href] = row
    return placements


def deep_sky():
    return _rows(DeepSky)


def planetary_systems():
    return [_with_stars(row) for row in _rows(PlanetarySystem)]


def territories():
    """Nations and factions for the territories layer; hidden rows are left out.

    sectors become a list of names, points a list of [X, Y] pairs in galactocentric
    kly (the readout's axes), members a list of place names.
    """
    found = []
    for row in _rows(Territory, order="sort", drop=("id", "sort")):
        if row.pop("hidden", 0):
            continue
        row["fictional"] = bool(row.get("fictional"))
        if "sectors" in row:
            row["sectors"] = row["sectors"].replace(",", " ").split()
        if "points" in row:
            pairs = []
            for pair in row["points"].split(";"):
                try:
                    x, y = (float(v) for v in pair.split(","))
                    pairs.append([x, y])
                except ValueError:
                    continue
            row["points"] = pairs
        if "members" in row:
            row["members"] = [m.strip() for m in row["members"].split(",") if m.strip()]
        found.append(row)
    return found


def fictional_places():
    return _rows(FictionPlace)


def spacecraft():
    return _rows(Spacecraft)


def stellar_objects():
    return _rows(StellarObject)


# Galaxies, built as oriented 3D star discs rather than camera-facing images.
# "display" is the distance we draw them at, in light-years: the satellites sit at
# their true distance, Andromeda and Triangulum are pulled in so they stay in frame,
# and labels always state the true distance. "size" is the real diameter.
# Each one is drawn as its photograph on a plane whose normal points back at the
# Sun, which is where the photograph was taken from, so the picture already carries
# the galaxy's real tilt. "inclination" and "pa" (position angle of the major axis,
# from celestial north) are kept as a record of that tilt; "imageScale" says how
# much wider than the galaxy its frame is, and "roll" spins the plane in place.
# "brightness" scales a photograph's opacity. It exists because these are drawn at
# invented distances: once M101 is pulled in from 20.9 Mly to 2.45, nothing is left
# to say it is further away than Andromeda, and it was rendering brighter than any
# Local Group member. The ladder restores that - satellites and the Local Group at
# full strength, the 10-12 Mly group around half, the 20-30 Mly ones lower still.
GALAXIES = [
    # no photograph reads as itself at this size, so it stays a diffuse glow
    {"name": "Sagittarius Dwarf", "alias": "SagDEG", "kind": "satellite", "type": "blob",
     "l": 5.57, "b": -14.17, "d": 65_000, "display": 65_000, "size": 16_000,
     "image": None, "colors": ["#ffe3c0", "#c9b5ff"]},
    {"name": "Large Magellanic Cloud", "alias": "LMC", "kind": "satellite", "type": "irregular",
     "l": 280.47, "b": -32.89, "d": 163_000, "display": 163_000, "size": 32_000,
     "inclination": 35.0, "pa": 170.0, "image": "lmc.jpg", "imageScale": 1.8,
     "colors": ["#fff0d6", "#9fc4ff"]},
    {"name": "Small Magellanic Cloud", "alias": "SMC", "kind": "satellite", "type": "irregular",
     "l": 302.80, "b": -44.30, "d": 200_000, "display": 200_000, "size": 18_000,
     "inclination": 60.0, "pa": 45.0, "image": "smc.jpg", "imageScale": 1.8,
     "colors": ["#ffeccf", "#a8c8ff"]},
    {"name": "Andromeda Galaxy", "alias": "M31", "kind": "spiral", "type": "spiral",
     "l": 121.17, "b": -21.57, "d": 2_537_000, "display": 1_040_000, "size": 152_000,
     "inclination": 77.0, "pa": 38.0, "image": "m31.jpg", "imageScale": 1.9,
     "colors": ["#ffd9a0", "#a9c7ff"]},
    {"name": "Triangulum Galaxy", "alias": "M33", "kind": "spiral", "type": "spiral",
     "l": 133.61, "b": -31.33, "d": 2_730_000, "display": 1_550_000, "size": 60_000,
     "inclination": 56.0, "pa": 23.0, "image": "m33.jpg", "imageScale": 1.9,
     "colors": ["#ffe6bb", "#93b9ff"]},

    # Beyond the Local Group. Every one of these is where it really is in the sky -
    # l and b were computed from J2000 RA/Dec, same as everything else here - but
    # none of them is at its real distance: at 10 to 30 million light years they
    # would be far outside the scene, so they are drawn between 1.8 and 2.8 Mly,
    # ordered so the nearer ones stay nearer. Their labels say "shown closer" and
    # quote the true distance, which is the only honest way to do this.
    {"name": "IC 342", "alias": "IC 342", "brightness": 0.55, "kind": "spiral", "type": "spiral",
     "l": 138.17, "b": 10.58, "d": 10_700_000, "display": 1_800_000, "size": 75_000,
     "inclination": 31.0, "pa": 37.0, "image": "ic342.jpg", "imageScale": 1.7,
     "colors": ["#ffe7c4", "#9dc0ff"]},
    {"name": "Sculptor Galaxy", "alias": "NGC 253", "brightness": 0.68, "kind": "spiral", "type": "spiral",
     "l": 97.37, "b": -87.96, "d": 11_400_000, "display": 1_900_000, "size": 70_000,
     "inclination": 72.0, "pa": 52.0, "image": "ngc253.jpg", "imageScale": 1.7,
     "colors": ["#ffdca8", "#a6c3ff"]},
    {"name": "Cigar Galaxy", "alias": "M82", "brightness": 0.72, "kind": "spiral", "type": "irregular",
     "l": 141.41, "b": 40.57, "d": 11_500_000, "display": 2_000_000, "size": 37_000,
     "inclination": 80.0, "pa": 65.0, "image": "m82.jpg", "imageScale": 1.8,
     "colors": ["#ffd9b4", "#b7c6ff"]},
    {"name": "Bode's Galaxy", "alias": "M81", "brightness": 0.53, "kind": "spiral", "type": "spiral",
     "l": 142.09, "b": 40.90, "d": 11_700_000, "display": 2_100_000, "size": 90_000,
     "inclination": 59.0, "pa": 157.0, "image": "m81.jpg", "imageScale": 1.8,
     "colors": ["#ffe3bd", "#9fc2ff"]},
    {"name": "Centaurus A", "alias": "NGC 5128", "brightness": 0.55, "kind": "elliptical", "type": "elliptical",
     "l": 309.52, "b": 19.42, "d": 12_400_000, "display": 2_250_000, "size": 60_000,
     "image": "cena.jpg", "imageScale": 1.9,
     "colors": ["#ffdfb0", "#aec4ff"]},
    {"name": "Pinwheel Galaxy", "alias": "M101", "brightness": 0.36, "kind": "spiral", "type": "spiral",
     "l": 102.04, "b": 59.77, "d": 20_900_000, "display": 2_450_000, "size": 170_000,
     "inclination": 18.0, "pa": 38.0, "image": "m101.jpg", "imageScale": 1.7,
     "colors": ["#ffe9cc", "#9cc1ff"]},
    {"name": "Whirlpool Galaxy", "alias": "M51", "brightness": 0.53, "kind": "spiral", "type": "spiral",
     "l": 104.85, "b": 68.56, "d": 23_000_000, "display": 2_600_000, "size": 76_000,
     "inclination": 20.0, "pa": 172.0, "image": "spiral1.jpg", "imageScale": 1.8,
     "colors": ["#ffe4c2", "#a3c4ff"]},
    {"name": "Sombrero Galaxy", "alias": "M104", "brightness": 0.71, "kind": "spiral", "type": "spiral",
     "l": 298.46, "b": 51.15, "d": 29_300_000, "display": 2_800_000, "size": 49_000,
     "inclination": 84.0, "pa": 90.0, "image": "spiral2.jpg", "imageScale": 1.9,
     "colors": ["#ffeed8", "#b3c6ff"]},
]

CELESTIAL_POLE_GALACTIC = {"l": 122.93192, "b": 27.12825}

# Decorative far-field galaxies: real photographs on fixed, randomly oriented
# planes - not billboards - scattered rather than placed, so they carry no names
# and no distances.
# The nameless far field. These are real galaxies too, but they are scenery: no
# labels, no stated distances, arbitrary orientations. They are deliberately *not*
# the images used for the named galaxies above - an anonymous copy of the Sombrero
# floating past undercuts the labelled one.
BACKGROUND_GALAXY_IMAGES = ["far1.jpg", "far2.jpg", "far3.jpg", "far4.jpg"]

IMAGE_CREDITS = (
    "Milky Way backdrop: NASA/JPL-Caltech (R. Hurt). Galaxy images: NASA/ESA Hubble "
    "Heritage (STScI/AURA), NASA/JPL-Caltech (Spitzer, IC 342), SSRO/PROMPT/CTIO "
    "(NGC 253, CC BY 4.0), ESO/MPIfR/NASA-CXC composite (Centaurus A, CC BY 4.0), "
    "ESA/NASA (M101, CC BY 4.0), Adam Evans (M31, CC BY 2.0). Centaurus A combines "
    "optical, submillimetre and X-ray data, so its jets are not a visible-light view. "
    "Photographs on the info cards come from Wikimedia Commons (NASA, ESA, ESO, NOIRLab "
    "and amateur astronomers); each card names its author and licence."
)
