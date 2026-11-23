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

GALAXY_PLACEMENT = {
    "Solar": {"l": 0.0, "b": 0.0, "d": 0.0},
    "AlphaCentauri": {"l": 315.73, "b": -0.68, "d": 4.37},
    "Sirius": {"l": 227.23, "b": -8.89, "d": 8.6},
    "Trappist": {"l": 69.71, "b": -56.64, "d": 40.7},
    "Mira": {"l": 167.75, "b": -57.98, "d": 300.0},
    "Polaris": {"l": 123.28, "b": 26.46, "d": 433.0},
    # "label" overrides the display name where the URL-safe DB name cannot carry it
    "BarnardsStar": {"l": 31.01, "b": 14.06, "d": 5.96, "label": "Barnard's Star"},
    "Trebia": {"fictional": True, "source": "Mass Effect", "note": "Palaven, the turian homeworld", "x": 21_000, "z": -9_000},
}

# Landmarks drawn at their true positions, as a reference for where our systems sit.
# Additions of 2026-11-23 were converted from J2000 RA/Dec with the same transform,
# checked by reproducing M42, the Pleiades and Omega Centauri to 0.01 degrees.
# kind: nebula | remnant | planetary | open | globular | structure
DEEP_SKY = [
    {"name": "Orion Nebula", "alias": "M42", "kind": "nebula", "l": 209.01, "b": -19.38, "d": 1_344},
    {"name": "Horsehead Nebula", "alias": "Barnard 33", "kind": "nebula", "l": 206.96, "b": -16.78, "d": 1_375},
    {"name": "Rosette Nebula", "alias": "NGC 2237", "kind": "nebula", "l": 206.47, "b": -1.64, "d": 5_200},
    {"name": "Cone Nebula", "alias": "NGC 2264", "kind": "nebula", "l": 202.98, "b": 2.25, "d": 2_700},
    {"name": "Eagle Nebula", "alias": "M16", "kind": "nebula", "l": 16.95, "b": 0.79, "d": 7_000},
    {"name": "Lagoon Nebula", "alias": "M8", "kind": "nebula", "l": 5.96, "b": -1.17, "d": 4_100},
    {"name": "Trifid Nebula", "alias": "M20", "kind": "nebula", "l": 7.00, "b": -0.25, "d": 4_100},
    {"name": "Omega Nebula", "alias": "M17", "kind": "nebula", "l": 15.05, "b": -0.67, "d": 5_500},
    {"name": "Carina Nebula", "alias": "NGC 3372", "kind": "nebula", "l": 287.69, "b": -0.79, "d": 8_500},
    {"name": "NGC 3603", "alias": "NGC 3603", "kind": "nebula", "l": 291.62, "b": -0.52, "d": 20_000},
    {"name": "W51 Complex", "alias": "W51", "kind": "nebula", "l": 49.40, "b": -0.32, "d": 17_000},
    {"name": "Bubble Nebula", "alias": "NGC 7635", "kind": "nebula", "l": 112.24, "b": 2.80, "d": 11_000},
    {"name": "North America Nebula", "alias": "NGC 7000", "kind": "nebula", "l": 84.66, "b": -3.52, "d": 2_590},
    {"name": "Heart Nebula", "alias": "IC 1805", "kind": "nebula", "l": 134.80, "b": 0.94, "d": 7_500},
    {"name": "Soul Nebula", "alias": "IC 1848", "kind": "nebula", "l": 137.23, "b": 0.96, "d": 6_500},
    {"name": "California Nebula", "alias": "NGC 1499", "kind": "nebula", "l": 160.60, "b": -12.05, "d": 1_000},
    {"name": "Flaming Star Nebula", "alias": "IC 405", "kind": "nebula", "l": 172.11, "b": -2.30, "d": 1_500},
    {"name": "Iris Nebula", "alias": "NGC 7023", "kind": "nebula", "l": 104.06, "b": 14.19, "d": 1_300},
    {"name": "Elephant's Trunk", "alias": "IC 1396", "kind": "nebula", "l": 99.31, "b": 3.73, "d": 2_400},
    {"name": "Pac-Man Nebula", "alias": "NGC 281", "kind": "nebula", "l": 123.15, "b": -6.25, "d": 9_500},
    {"name": "Rho Ophiuchi Clouds", "alias": "Rho Oph", "kind": "nebula", "l": 353.69, "b": 17.69, "d": 460},
    {"name": "Cat's Paw Nebula", "alias": "NGC 6334", "kind": "nebula", "l": 351.27, "b": 0.56, "d": 5_500},
    {"name": "Running Chicken Nebula", "alias": "IC 2944", "kind": "nebula", "l": 294.85, "b": -1.65, "d": 6_000},
    {"name": "Tarantula Nebula", "alias": "NGC 2070", "kind": "nebula", "l": 279.46, "b": -31.67, "d": 160_000},
    {"name": "Crab Nebula", "alias": "M1", "kind": "remnant", "l": 184.56, "b": -5.78, "d": 6_500},
    {"name": "Veil Nebula", "alias": "NGC 6960", "kind": "remnant", "l": 74.23, "b": -8.61, "d": 2_400},
    {"name": "Vela Supernova Remnant", "alias": "Vela SNR", "kind": "remnant", "l": 263.52, "b": -2.84, "d": 800},
    {"name": "Cassiopeia A", "alias": "Cas A", "kind": "remnant", "l": 111.73, "b": -2.13, "d": 11_000},
    {"name": "Tycho's Supernova", "alias": "SN 1572", "kind": "remnant", "l": 120.08, "b": 1.42, "d": 8_000},
    {"name": "Kepler's Supernova", "alias": "SN 1604", "kind": "remnant", "l": 4.53, "b": 6.82, "d": 20_000},
    {"name": "Helix Nebula", "alias": "NGC 7293", "kind": "planetary", "l": 36.16, "b": -57.12, "d": 655},
    {"name": "Ring Nebula", "alias": "M57", "kind": "planetary", "l": 63.17, "b": 13.98, "d": 2_570},
    {"name": "Dumbbell Nebula", "alias": "M27", "kind": "planetary", "l": 60.84, "b": -3.70, "d": 1_360},
    {"name": "Cat's Eye Nebula", "alias": "NGC 6543", "kind": "planetary", "l": 96.47, "b": 29.95, "d": 3_300},
    {"name": "Butterfly Nebula", "alias": "NGC 6302", "kind": "planetary", "l": 349.51, "b": 1.06, "d": 3_400},
    {"name": "Owl Nebula", "alias": "M97", "kind": "planetary", "l": 148.49, "b": 57.05, "d": 2_030},
    {"name": "Ghost of Jupiter", "alias": "NGC 3242", "kind": "planetary", "l": 261.05, "b": 32.05, "d": 1_400},
    {"name": "Pleiades", "alias": "M45", "kind": "open", "l": 166.64, "b": -23.46, "d": 444},
    {"name": "Hyades", "alias": "Mel 25", "kind": "open", "l": 180.08, "b": -22.32, "d": 153},
    {"name": "Beehive Cluster", "alias": "M44", "kind": "open", "l": 205.92, "b": 32.48, "d": 577},
    {"name": "Coma Star Cluster", "alias": "Mel 111", "kind": "open", "l": 221.33, "b": 84.07, "d": 280},
    {"name": "Butterfly Cluster", "alias": "M6", "kind": "open", "l": 356.58, "b": -0.78, "d": 1_600},
    {"name": "Ptolemy Cluster", "alias": "M7", "kind": "open", "l": 355.79, "b": -4.50, "d": 980},
    {"name": "NGC 3532", "alias": "NGC 3532", "kind": "open", "l": 289.57, "b": 1.35, "d": 1_321},
    {"name": "Jewel Box", "alias": "NGC 4755", "kind": "open", "l": 303.20, "b": 2.50, "d": 6_400},
    {"name": "Wild Duck Cluster", "alias": "M11", "kind": "open", "l": 27.30, "b": -2.78, "d": 6_200},
    {"name": "Double Cluster", "alias": "NGC 869", "kind": "open", "l": 136.30, "b": -3.57, "d": 7_500},
    {"name": "Southern Pleiades", "alias": "IC 2602", "kind": "open", "l": 289.60, "b": -4.90, "d": 479},
    {"name": "Westerlund 1", "alias": "Wd 1", "kind": "open", "l": 339.55, "b": -0.40, "d": 12_000},
    {"name": "M35", "alias": "NGC 2168", "kind": "open", "l": 186.59, "b": 2.19, "d": 2_800},
    {"name": "Omega Centauri", "alias": "NGC 5139", "kind": "globular", "l": 309.10, "b": 14.97, "d": 17_090},
    {"name": "Great Cluster", "alias": "M13", "kind": "globular", "l": 59.01, "b": 40.91, "d": 22_200},
    {"name": "47 Tucanae", "alias": "NGC 104", "kind": "globular", "l": 305.89, "b": -44.89, "d": 13_000},
    {"name": "M4", "alias": "NGC 6121", "kind": "globular", "l": 350.97, "b": 15.97, "d": 7_200},
    {"name": "M22", "alias": "NGC 6656", "kind": "globular", "l": 9.89, "b": -7.55, "d": 10_600},
    {"name": "NGC 6397", "alias": "NGC 6397", "kind": "globular", "l": 338.17, "b": -11.96, "d": 7_800},
    {"name": "M5", "alias": "NGC 5904", "kind": "globular", "l": 3.86, "b": 46.80, "d": 24_500},
    {"name": "M15", "alias": "NGC 7078", "kind": "globular", "l": 65.01, "b": -27.31, "d": 33_600},
    {"name": "M2", "alias": "NGC 7089", "kind": "globular", "l": 53.37, "b": -35.77, "d": 37_500},
    {"name": "M79", "alias": "NGC 1904", "kind": "globular", "l": 227.23, "b": -29.35, "d": 41_000},
    {"name": "Intergalactic Wanderer", "alias": "NGC 2419", "kind": "globular", "l": 180.37, "b": 25.24, "d": 300_000},
    # Our own neighbourhood. The Sun is not in a star cluster: it sits inside the
    # Local Bubble, a low-density cavity blown by ancient supernovae, and the
    # nearest clusters are the Hyades and the Pleiades.
    {"name": "Local Bubble", "alias": "Local cavity", "kind": "structure", "l": 0.0, "b": 0.0, "d": 0.0, "radius": 500},
]

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

# Direction of the celestial north pole in galactic coordinates, which is what the
# position angles above are measured from.
# Real planetary systems beyond the Solar Neighbourhood. They have no page yet, so
# they are map-only: drawn and named, and the camera can fly to them. l/b computed
# from J2000 RA/Dec with the same transform as everything else (it reproduces Sgr A*,
# the Pleiades and Barnard's Star to 0.01 degrees); d in light-years.
PLANETARY_SYSTEMS = [
    {"name": "Kepler-186", "note": "First Earth-sized planet found in a habitable zone", "l": 78.52, "b": 8.17, "d": 579},
    {"name": "Kepler-22", "note": "First Kepler planet in a habitable zone", "l": 79.09, "b": 15.79, "d": 640},
    {"name": "KELT-9", "note": "Hottest known planet, 4,300 °C by day", "l": 78.91, "b": 0.25, "d": 667},
    {"name": "WASP-12", "note": "A planet being torn apart by its star", "l": 184.08, "b": 8.94, "d": 1_400},
    {"name": "Kepler-452", "note": "Earth's 'older cousin', a year of 385 days", "l": 77.86, "b": 9.99, "d": 1_800},
    {"name": "PSR B1257+12", "note": "The first planets ever found, around a pulsar", "l": 311.31, "b": 75.41, "d": 2_300},
    {"name": "Kepler-90", "note": "Eight planets, as many as the Solar System", "l": 79.27, "b": 19.26, "d": 2_840},
    {"name": "OGLE-2005-BLG-390L", "note": "A cold super-Earth found by microlensing, near the bulge", "l": 359.73, "b": -2.36, "d": 21_500},
]

# Fiction set in the Milky Way, kept apart from the real places and drawn differently
# (dashed, violet, its own layer). "type" sorts each into the Star systems or the
# Objects panel. Where the story names a real star the place sits at it ("anchor",
# l/b/d computed from J2000 RA/Dec like everything else); otherwise x/z (ly,
# galactocentric) are placed by eye from the source's own galaxy map, and say so.
# Trebia, which has a page, lives in GALAXY_PLACEMENT instead.
FICTIONAL_PLACES = [
    {"type": "system", "name": "Widow", "source": "Mass Effect", "note": "The Citadel, in the Serpent Nebula", "x": 8_000, "z": 14_000},
    {"type": "system", "name": "Sahrabarik", "source": "Mass Effect", "note": "Omega station, Terminus Systems", "x": -14_000, "z": 12_000},
    {"type": "system", "name": "Aralakh", "source": "Mass Effect", "note": "Tuchanka, the krogan homeworld", "x": 16_000, "z": 2_000},
    {"type": "system", "name": "40 Eridani", "source": "Star Trek", "note": "Vulcan", "anchor": "40 Eridani A", "l": 200.75, "b": -38.05, "d": 16.3},
    {"type": "system", "name": "Epsilon Eridani", "source": "Halo", "note": "Reach", "anchor": "Epsilon Eridani", "l": 195.84, "b": -48.05, "d": 10.5},
    {"type": "system", "name": "Canopus", "source": "Dune", "note": "Arrakis", "anchor": "Canopus", "l": 261.21, "b": -25.29, "d": 310},
    {"type": "object", "name": "Arcturus Station", "source": "Mass Effect", "note": "Alliance capital station", "anchor": "Arcturus", "l": 15.05, "b": 69.11, "d": 36.7},
    {"type": "object", "name": "Collector Base", "source": "Mass Effect", "note": "Beyond the Omega-4 Relay, near the core", "x": 1_500, "z": 2_500},
    {"type": "object", "name": "Gargantua's wormhole", "source": "Interstellar", "note": "By Saturn; Gargantua lies beyond it", "anchor": "Saturn", "l": 0.0, "b": 0.0, "d": 0.00015},
]

# Real objects that are not star systems. The Voyagers' directions are where they
# are heading as seen from the Sun (RA/Dec converted as above); distances in AU for
# late 2026, when Voyager 1 passes one light-day.
SPACECRAFT = [
    {"name": "Voyager 1", "note": "Farthest human-made object, about one light-day out", "l": 33.13, "b": 26.78, "au": 173},
    {"name": "Voyager 2", "note": "Left the heliosphere in 2018", "l": 337.63, "b": -32.75, "au": 142},
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
    "optical, submillimetre and X-ray data, so its jets are not a visible-light view."
)
