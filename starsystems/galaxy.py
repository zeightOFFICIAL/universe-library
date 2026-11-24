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
    # Apien Crest, read off the Mass Effect 3 galaxy map like the places in FICTIONAL_PLACES
    "Trebia": {"fictional": True, "source": "Mass Effect", "note": "Palaven, the turian homeworld · Apien Crest", "x": -26_500, "z": 21_500},
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

# A line or two on each landmark for the card that opens when you fly up to one.
# "size" is the real extent in light-years, roughly, where it is known; the map
# draws everything bigger than life, and the card says the true figure. An image
# is shown when static/Images/DeepSky/<alias as a slug>.jpg exists (see views.py).
DEEP_SKY_ABOUT = {
    "Orion Nebula": ("The nearest big star nursery, visible to the naked eye as the middle 'star' of Orion's sword. Its young Trapezium stars light the gas from inside.", 24),
    "Horsehead Nebula": ("A dark cloud of dust shaped like a horse's head, seen against glowing hydrogen behind it.", 3.5),
    "Rosette Nebula": ("A flower of glowing gas around a hollow carved out by the winds of the young cluster at its heart.", 130),
    "Cone Nebula": ("A tall, dark pillar of gas and dust in a region full of newborn stars, next to the Christmas Tree Cluster.", 7),
    "Eagle Nebula": ("Home of the 'Pillars of Creation', columns of gas where new stars are still forming.", 70),
    "Lagoon Nebula": ("A huge glowing cloud in Sagittarius, crossed by a dark lane of dust that gives it its name.", 110),
    "Trifid Nebula": ("A rare mix of three kinds of nebula in one: glowing red gas, blue reflected light and dark dust lanes.", 42),
    "Omega Nebula": ("Also called the Swan Nebula, one of the brightest and most massive star-forming regions in the galaxy.", 15),
    "Carina Nebula": ("One of the largest nebulae in the sky, four times the size of Orion's. It hides Eta Carinae, a star that may explode soon.", 460),
    "NGC 3603": ("The densest concentration of massive stars in the visible Milky Way, a young cluster blowing out a giant cavity.", 50),
    "W51 Complex": ("A giant molecular cloud on the far side of the galaxy, among the most active star factories we know of.", 300),
    "Bubble Nebula": ("A shell blown by the wind of a single hot, massive star, 40 times heavier than the Sun.", 7),
    "North America Nebula": ("A glowing cloud whose dark lanes trace the outline of the North American continent.", 90),
    "Heart Nebula": ("A heart-shaped cloud of glowing hydrogen shaped by the young stars of the cluster Melotte 15.", 200),
    "Soul Nebula": ("The Heart Nebula's neighbour, a star-forming region with several young clusters inside.", 150),
    "California Nebula": ("A long ribbon of glowing gas, lit by a single fierce star, Xi Persei.", 100),
    "Flaming Star Nebula": ("Lit by a runaway star, AE Aurigae, flung out of the Orion region millions of years ago.", 5),
    "Iris Nebula": ("A reflection nebula: dust that does not glow by itself but scatters the blue light of a nearby star.", 6),
    "Elephant's Trunk": ("A long dark pillar of gas and dust inside a large glowing region in Cepheus, with stars forming at its tip.", 20),
    "Pac-Man Nebula": ("A glowing cloud with a dark wedge cut out of it, lit by the young cluster IC 1590.", 48),
    "Rho Ophiuchi Clouds": ("One of the nearest star-forming regions, a colourful mix of dark, glowing and reflecting clouds.", 15),
    "Cat's Paw Nebula": ("A star-forming region whose glowing bubbles look like a paw print.", 50),
    "Running Chicken Nebula": ("A large glowing cloud in Centaurus, with small dark globules where stars may still form.", 75),
    "Tarantula Nebula": ("In the Large Magellanic Cloud, outside our galaxy: the most active star-forming region in the Local Group.", 1_000),
    "Crab Nebula": ("The wreck of a star whose explosion was recorded by astronomers in 1054. A spinning neutron star powers it from the centre.", 11),
    "Veil Nebula": ("Delicate filaments from a supernova that exploded about 10,000 to 20,000 years ago.", 110),
    "Vela Supernova Remnant": ("One of the closest supernova remnants, about 11,000 years old, with the Vela pulsar inside.", 100),
    "Cassiopeia A": ("The youngest known remnant of a supernova in our galaxy, whose light reached Earth around 1680.", 10),
    "Tycho's Supernova": ("The remains of the star Tycho Brahe saw explode in 1572, which showed that the heavens do change.", 20),
    "Kepler's Supernova": ("The last supernova seen in our galaxy with the naked eye, in 1604.", 14),
    "Helix Nebula": ("One of the closest planetary nebulae: the outer layers of a dying Sun-like star, nicknamed the Eye of God.", 2.5),
    "Ring Nebula": ("A glowing ring of gas puffed off by a dying star, now a white dwarf at its centre.", 2.6),
    "Dumbbell Nebula": ("The first planetary nebula ever found, in 1764, shaped like an apple core.", 2.8),
    "Cat's Eye Nebula": ("One of the most intricate planetary nebulae, with shells, jets and knots from a dying star.", 0.4),
    "Butterfly Nebula": ("Two wings of gas thrown out by one of the hottest stars known, hidden behind a dusty belt.", 3),
    "Owl Nebula": ("A round planetary nebula with two dark patches that look like an owl's eyes.", 1.8),
    "Ghost of Jupiter": ("A planetary nebula about the size Jupiter appears in a small telescope, hence its name.", 1.3),
    "Pleiades": ("The Seven Sisters: a young cluster of hot blue stars, still passing through a cloud of dust that reflects their light.", 43),
    "Hyades": ("The nearest open cluster to the Sun, forming the V-shaped face of Taurus the bull.", 20),
    "Beehive Cluster": ("A swarm of about a thousand stars in Cancer, visible to the naked eye as a faint cloud.", 23),
    "Coma Star Cluster": ("A large, loose cluster that makes up most of the constellation Coma Berenices.", 22),
    "Butterfly Cluster": ("An open cluster in Scorpius whose brightest stars trace a butterfly's wings.", 12),
    "Ptolemy Cluster": ("A bright open cluster recorded by Ptolemy around the year 130.", 25),
    "NGC 3532": ("One of the richest open clusters in the southern sky, nicknamed the Wishing Well Cluster.", 20),
    "Jewel Box": ("A young cluster of brilliant blue and red supergiants, described by John Herschel as a casket of gems.", 20),
    "Wild Duck Cluster": ("One of the richest and most compact open clusters, whose bright stars form a V like a flight of ducks.", 25),
    "Double Cluster": ("Two young clusters side by side in Perseus, visible together with the naked eye.", 70),
    "Southern Pleiades": ("A bright, young southern cluster, sometimes called the Theta Carinae Cluster.", 9),
    "Westerlund 1": ("The most massive young cluster in the galaxy, packed with supergiants and hypergiants.", 6),
    "M35": ("A rich open cluster in Gemini, with an older, more distant cluster, NGC 2158, seen beside it.", 23),
    "Omega Centauri": ("The largest globular cluster in the galaxy, with about ten million stars. It may be the core of a swallowed dwarf galaxy.", 150),
    "Great Cluster": ("The finest globular cluster in the northern sky, target of a radio message sent from Arecibo in 1974.", 145),
    "47 Tucanae": ("The second brightest globular cluster, a dense ball of old stars beside the Small Magellanic Cloud.", 120),
    "M4": ("One of the nearest globular clusters, where very old white dwarfs have been used to date the galaxy.", 75),
    "M22": ("One of the brightest globular clusters, among the first ever discovered, in 1665.", 100),
    "NGC 6397": ("One of the two nearest globular clusters, about 13.4 billion years old.", 70),
    "M5": ("One of the oldest globular clusters in the galaxy, about 13 billion years old.", 165),
    "M15": ("One of the densest globular clusters, whose core may have collapsed.", 175),
    "M2": ("A large, rich globular cluster in Aquarius with about 150,000 stars.", 175),
    "M79": ("An unusual globular cluster that may have come from another galaxy that the Milky Way absorbed.", 118),
    "Intergalactic Wanderer": ("One of the most distant globular clusters of the Milky Way, so far out it was once thought to be free of it.", 500),
    "Local Bubble": ("The cavity of thin, hot gas the Sun sits in, blown by supernovae over the last 15 million years.", 1_000),
}
for _entry in DEEP_SKY:
    _about = DEEP_SKY_ABOUT.get(_entry["name"])
    if _about:
        _entry["about"], _entry["size"] = _about

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
# galactocentric) are placed by eye, and say so.
#
# Mass Effect: read off the Mass Effect 3 galaxy map (core at the top, the Arcturus
# Stream below it), deprojected for its tilt and scaled so the Arcturus Stream lands
# on the Sun. That map is drawn from galactic north like ours. The Omega Nebula is
# not on the ME3 map, so Omega comes from the Mass Effect 2 map, beside the
# Hourglass Nebula towards the core. Trebia, which has a page, lives in
# GALAXY_PLACEMENT instead.
FICTIONAL_PLACES = [
    {"type": "system", "name": "Widow", "source": "Mass Effect", "note": "The Citadel, in the Serpent Nebula", "x": -14_000, "z": 5_000},
    {"type": "system", "name": "Sahrabarik", "source": "Mass Effect", "note": "Omega station, Omega Nebula, Terminus Systems", "x": -6_000, "z": -11_000},
    {"type": "system", "name": "Aralakh", "source": "Mass Effect", "note": "Tuchanka, the krogan homeworld · Krogan DMZ", "x": -15_500, "z": 10_000},
    {"type": "system", "name": "Hercules", "source": "Mass Effect", "note": "Feros · Attican Beta, Attican Traverse", "x": 28_000, "z": 18_000},
    {"type": "system", "name": "Utopia", "source": "Mass Effect", "note": "Eden Prime · Exodus Cluster", "x": 7_000, "z": 25_500},
    {"type": "system", "name": "40 Eridani", "source": "Star Trek", "note": "Vulcan", "anchor": "40 Eridani A", "l": 200.75, "b": -38.05, "d": 16.3},
    {"type": "system", "name": "Epsilon Indi", "source": "Halo", "note": "Harvest, where the Covenant war began", "anchor": "Epsilon Indi", "l": 336.19, "b": -48.04, "d": 11.9},
    {"type": "system", "name": "Epsilon Eridani", "source": "Halo", "note": "Reach", "anchor": "Epsilon Eridani", "l": 195.84, "b": -48.05, "d": 10.5},
    {"type": "system", "name": "Zeta Reticuli", "source": "Alien", "note": "LV-426, where the derelict ship was found", "anchor": "Zeta² Reticuli", "l": 278.97, "b": -47.22, "d": 39.3},
    {"type": "system", "name": "Delta Pavonis", "source": "Dune", "note": "Caladan, the Atreides homeworld", "anchor": "Delta Pavonis", "l": 329.77, "b": -32.42, "d": 19.9},
    {"type": "system", "name": "36 Ophiuchi", "source": "Dune", "note": "Giedi Prime, the Harkonnen homeworld", "anchor": "36 Ophiuchi", "l": 358.28, "b": 6.88, "d": 19.5},
    {"type": "system", "name": "Canopus", "source": "Dune", "note": "Arrakis", "anchor": "Canopus", "l": 261.21, "b": -25.29, "d": 310},
    {"type": "system", "name": "Vega", "source": "Contact", "note": "Source of the Message", "anchor": "Vega", "l": 67.45, "b": 19.24, "d": 25},
    {"type": "system", "name": "Trantor", "source": "Foundation", "note": "Capital of the Galactic Empire, near the core", "x": 0, "z": 3_000},
    {"type": "system", "name": "Terminus", "source": "Foundation", "note": "The Foundation's world, at the galaxy's rim", "x": -38_000, "z": 24_000},
    {"type": "system", "name": "Cadia", "source": "Warhammer 40,000", "note": "Fortress world at the Eye of Terror", "x": -16_000, "z": 32_000},
    {"type": "system", "name": "Macragge", "source": "Warhammer 40,000", "note": "Ultramar, on the Eastern Fringe", "x": 34_000, "z": 14_000},
    {"type": "object", "name": "Arcturus Station", "source": "Mass Effect", "note": "Alliance capital station", "anchor": "Arcturus", "l": 15.05, "b": 69.11, "d": 36.7},
    {"type": "object", "name": "Collector Base", "source": "Mass Effect", "note": "Beyond the Omega-4 Relay, near the core", "x": -1_500, "z": -2_500},
    {"type": "object", "name": "Charon Relay", "source": "Mass Effect", "note": "The mass relay hidden in Pluto's moon Charon", "anchor": "Pluto", "l": 21.11, "b": -29.9, "d": 0.00055},
    {"type": "object", "name": "Gargantua's wormhole", "source": "Interstellar", "note": "By Saturn; Gargantua lies beyond it", "anchor": "Saturn", "l": 106.62, "b": -60.87, "d": 0.00015},
    {"type": "object", "name": "The monolith at Jupiter", "source": "2001: A Space Odyssey", "note": "Big Brother, waiting in orbit", "anchor": "Jupiter", "l": 199.76, "b": 21.93, "d": 0.000082},
    {"type": "object", "name": "Babylon 5", "source": "Babylon 5", "note": "The last of the Babylon stations, orbiting Epsilon III", "anchor": "Epsilon Eridani", "l": 195.84, "b": -48.05, "d": 10.5},
    {"type": "object", "name": "Battle of Wolf 359", "source": "Star Trek", "note": "Where the Borg destroyed 39 starships", "anchor": "Wolf 359", "l": 244.06, "b": 56.12, "d": 7.86},
]

# Real objects that are not star systems. The Voyagers' directions are where they
# are heading as seen from the Sun (RA/Dec converted as above); distances in AU for
# late 2026, when Voyager 1 passes one light-day.
SPACECRAFT = [
    {"name": "Voyager 1", "note": "Farthest human-made object, about one light-day out", "about": "Launched in 1977, it flew past Jupiter and Saturn and crossed into interstellar space in 2012. It still sends data home.", "l": 33.13, "b": 26.78, "au": 173},
    {"name": "Voyager 2", "note": "Left the heliosphere in 2018", "about": "The only spacecraft to have visited Uranus and Neptune. It left the Sun's bubble of wind in 2018.", "l": 337.63, "b": -32.75, "au": 142},
    {"name": "Pioneer 10", "note": "Silent since 2003, heading for Aldebaran", "about": "The first spacecraft to cross the asteroid belt and fly past Jupiter. It carries a plaque for anyone who finds it.", "l": 177.81, "b": -9.13, "au": 143},
    {"name": "Pioneer 11", "note": "Silent since 1995, heading towards Aquila", "about": "The first spacecraft to fly past Saturn, in 1979. Its position is now estimated, not measured.", "l": 25.33, "b": -4.03, "au": 122},
    {"name": "New Horizons", "note": "Flew past Pluto in 2015 and Arrokoth in 2019", "about": "Gave us the first close look at Pluto, with its heart-shaped glacier, then the most distant object ever visited.", "l": 20.55, "b": -22.14, "au": 64},
]

# Real things in the galaxy that are not star systems we have pages for: black holes,
# neutron stars and remarkable single stars. l/b computed from J2000 RA/Dec with the
# same transform (it reproduces Sgr A* and the Pleiades); d in light-years. Masses in
# Suns, radii in Suns, temperatures in kelvin, luminosities in Suns - the card prints
# them in the units chosen in Settings.
STELLAR_OBJECTS = [
    {"name": "Sagittarius A*", "kind": "blackhole", "note": "The black hole at the centre of the galaxy", "l": 0.0, "b": 0.0, "d": 26_700, "mass": 4.3e6,
     "about": "A supermassive black hole four million times the mass of the Sun. Stars orbiting it proved it is there; the Event Horizon Telescope imaged its shadow in 2022."},
    {"name": "Cygnus X-1", "kind": "blackhole", "note": "The first black hole ever identified", "l": 71.34, "b": 3.07, "d": 7_200, "mass": 21,
     "about": "Found in 1964 as a strong X-ray source: gas pulled off a blue supergiant heats up as it spirals into an unseen companion of 21 Suns."},
    {"name": "V404 Cygni", "kind": "blackhole", "note": "A black hole that flares up every few decades", "l": 73.12, "b": -2.09, "d": 7_800, "mass": 9,
     "about": "Feeds on a companion star in bursts; its 2015 outburst made it briefly the brightest X-ray source in the sky."},
    {"name": "A0620-00", "kind": "blackhole", "note": "One of the nearest known black holes", "l": 209.96, "b": -6.54, "d": 3_300, "mass": 6.6,
     "about": "Revealed by an X-ray outburst in 1975, it orbits a small orange star every 7.75 hours."},
    {"name": "Gaia BH1", "kind": "blackhole", "note": "The nearest known black hole", "l": 22.63, "b": 18.05, "d": 1_560, "mass": 9.6,
     "about": "A dormant black hole found in 2022 only by the wobble it gives a Sun-like star, measured by the Gaia spacecraft."},
    {"name": "Gaia BH2", "kind": "blackhole", "note": "A quiet black hole with a red giant partner", "l": 310.4, "b": 2.78, "d": 3_800, "mass": 8.9,
     "about": "Like Gaia BH1, it gives off no X-rays at all and was found only from its companion's motion."},
    {"name": "Gaia BH3", "kind": "blackhole", "note": "The most massive stellar black hole in the galaxy", "l": 51.67, "b": -3.49, "d": 1_926, "mass": 33,
     "about": "Found in 2024 in Gaia data: 33 Suns, probably left by a metal-poor star from the galaxy's early days."},
    {"name": "GRS 1915+105", "kind": "blackhole", "note": "A microquasar with jets near light speed", "l": 45.37, "b": -0.22, "d": 28_000, "mass": 12,
     "about": "Fires jets that appeared to move faster than light, an illusion of their near-light speed towards us."},
    {"name": "Vela Pulsar", "kind": "neutron", "note": "Spins 11 times a second", "l": 263.55, "b": -2.79, "d": 950, "mass": 1.4, "radiusKm": 12,
     "about": "The collapsed core of the star that made the Vela supernova remnant, a city-sized ball of neutrons."},
    {"name": "Crab Pulsar", "kind": "neutron", "note": "Spins 30 times a second", "l": 184.56, "b": -5.78, "d": 6_500, "mass": 1.4, "radiusKm": 12,
     "about": "Left by the supernova of 1054, it powers the whole Crab Nebula with its wind of particles."},
    {"name": "SGR 1806-20", "kind": "neutron", "note": "A magnetar, the strongest magnet known", "l": 10.0, "b": -0.24, "d": 28_000, "mass": 1.4, "radiusKm": 10,
     "about": "Its giant flare in 2004 lit up Earth's upper atmosphere from across the galaxy, in a tenth of a second."},
    {"name": "RX J1856.5-3754", "kind": "neutron", "note": "One of the nearest neutron stars", "l": 358.6, "b": -17.21, "d": 400, "mass": 1.5, "radiusKm": 14, "temperature": 700_000,
     "about": "One of the 'Magnificent Seven', lone neutron stars seen only by their heat."},
    {"name": "Hulse–Taylor Pulsar", "kind": "neutron", "note": "First proof of gravitational waves", "l": 49.97, "b": 2.12, "d": 21_000, "mass": 1.44, "radiusKm": 12,
     "about": "Two neutron stars spiralling together exactly as gravitational waves predict; a Nobel prize in 1993."},
    {"name": "Betelgeuse", "kind": "star", "note": "Red supergiant, Orion's shoulder", "l": 199.79, "b": -8.96, "d": 548, "mass": 18, "radius": 760, "temperature": 3_600, "luminosity": 120_000,
     "about": "So large that it would swallow Jupiter's orbit. It will end as a supernova within the next hundred thousand years."},
    {"name": "Rigel", "kind": "star", "note": "Blue supergiant, Orion's foot", "l": 209.24, "b": -25.25, "d": 860, "mass": 21, "radius": 79, "temperature": 12_100, "luminosity": 120_000,
     "about": "The brightest star in Orion, a young giant burning through its fuel in a few million years."},
    {"name": "Deneb", "kind": "star", "note": "One of the most luminous stars we can see", "l": 84.28, "b": 2.0, "d": 2_600, "mass": 19, "radius": 200, "temperature": 8_500, "luminosity": 196_000,
     "about": "A white supergiant so bright that it is among the 20 brightest stars in our sky from over 2,000 light-years away."},
    {"name": "Eta Carinae", "kind": "star", "note": "A pair of giant stars on the edge of exploding", "l": 287.6, "b": -0.63, "d": 7_500, "mass": 100, "radius": 240, "temperature": 35_000, "luminosity": 5_000_000,
     "about": "Its 1843 'Great Eruption' threw out the Homunculus Nebula and briefly made it the second brightest star in the sky."},
    {"name": "VY Canis Majoris", "kind": "star", "note": "One of the largest stars known", "l": 239.35, "b": -5.07, "d": 3_900, "mass": 17, "radius": 1_420, "temperature": 3_490, "luminosity": 270_000,
     "about": "A red hypergiant losing its outer layers in huge arcs and clumps of gas."},
    {"name": "UY Scuti", "kind": "star", "note": "A red supergiant of uncertain, enormous size", "l": 19.14, "b": -0.47, "d": 5_900, "mass": 8, "radius": 909, "temperature": 3_550, "luminosity": 86_000,
     "about": "Once listed as the largest star known; its distance, and so its size, are still debated."},
    {"name": "WR 104", "kind": "star", "note": "A pinwheel of dust around two hot stars", "l": 6.44, "b": -0.49, "d": 8_000, "temperature": 45_000,
     "about": "Two massive stars whose colliding winds make dust in a spiral that turns every eight months."},
    {"name": "Tabby's Star", "kind": "star", "note": "The star that dims for no clear reason", "l": 80.04, "b": 6.64, "d": 1_470, "mass": 1.43, "radius": 1.58, "temperature": 6_750, "luminosity": 4.7,
     "about": "Its light dropped by up to 22% at irregular times. Dust is the likeliest answer; it once prompted talk of alien megastructures."},
    {"name": "Methuselah Star", "kind": "star", "note": "One of the oldest stars known", "l": 356.31, "b": 33.61, "d": 200, "mass": 0.8, "radius": 2.0, "temperature": 5_780, "luminosity": 4.6,
     "about": "HD 140283 is around 12 billion years old, nearly as old as the universe itself."},
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
