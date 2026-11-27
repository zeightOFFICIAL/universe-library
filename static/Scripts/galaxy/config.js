import * as THREE from "three";

/*
 * Galaxy view of the main page.
 *
 * Scene units are kilo-light-years (1 unit = 1000 ly). The galactic centre is the
 * origin, the disk lies in the XZ plane and +Y points to the north galactic pole.
 * The Sun sits on +Z; galactic longitude 0 points from the Sun to the centre (-Z)
 * and longitude 90 (the direction of galactic rotation) points to -X.
 *
 * The star field is sampled from the backdrop artwork: each star takes its position
 * and colour from a pixel, so the 3D galaxy and the backdrop show the same arms in
 * the same colours. The backdrop is a stack of five sheets (BACKDROP.slices): a sharp
 * mid-plane sheet that carries the structure, and off-plane sheets that are blurred,
 * twisted, warped and torn by noise. Plain copies ghosted face-on and formed a
 * venetian blind edge-on; it takes all four of those treatments together to read as
 * volume. Most of the disk's body still comes from the sampled stars and haze.
 *
 * Two levels of detail:
 *   galaxy - the whole Milky Way, arm names, landmarks, one marker for the Sun
 *   local  - camera close to the Sun; real systems at their true positions and true
 *            distances. The nearest are a few light-years out, so this level zooms
 *            far deeper than the galaxy does (see LOCAL_MIN_DISTANCE)
 */

/*
 * Every colour in this file is authored display-referred - the number written is
 * the number meant - and the only transform between the scene and the screen is the
 * tone curve in the composite pass. three's colour management would otherwise
 * linearise hex colours and then, because the scene now renders into an offscreen
 * target rather than the canvas, never encode them back.
 */

export const DATA = JSON.parse(document.getElementById("GALAXY_DATA").textContent);
export const SUN = new THREE.Vector3(0, (DATA.sunHeight || 0) / 1000, DATA.sunDistance / 1000);

// how far right of centre the galactic centre sits, as a fraction of the width
export const VIEW_SHIFT = 0.11;
// below this width the dock starts collapsed and the view is not shifted
export const NARROW_WIDTH = 760;
// vertical field of view in landscape; portrait screens widen it (see resize())
export const FOV = 50;
export const GALAXY_RADIUS = 50;
export const ARM_PITCH = THREE.MathUtils.degToRad(12);
export const ARM_K = Math.tan(ARM_PITCH);

/*
 * Radius (kly) at which each arm crosses the Sun-centre line, fitted to the backdrop
 * rather than spaced evenly. The old crossings (10.8, 15, 21, 29.3) were a symmetric
 * four-arm pattern, and two of them ran down the artwork's gaps: the mean brightness
 * along Perseus was 0.87 of the disk average at that radius, Scutum's 0.96. These
 * come from sweeping every phase at a 12 degree pitch over the artwork (contrast-
 * normalised by radius, as the backdrop is mapped into the scene) and taking the
 * ridges: 1.17, 1.01, 1.08 and 0.97 - each now on an arm. A free pitch per arm fits
 * slightly better but lets arms alias onto each other a turn apart, so the pitch
 * stays shared. Labels sit where each arm is brightest in the painting, and rMax
 * stops a line where its arm fades out. Re-fit if the backdrop or its rotation
 * changes.
 */
export const ARMS = [
    { name: "Norma Arm", kind: "Minor arm", crossing: 10.9, label: 21, outerLabel: "Outer Arm", outerAt: 42, rMax: 48 },
    { name: "Scutum–Centaurus Arm", kind: "Major arm", crossing: 17.9, label: 25, rMax: 40 },
    { name: "Sagittarius–Carina Arm", kind: "Minor arm, inside the Sun", crossing: 21.8, label: 38, rMax: 49 },
    { name: "Perseus Arm", kind: "Major arm, outside the Sun", crossing: 32.7, label: 31, rMax: 46 },
];
/*
 * The Near and Far 3 kpc Arms run along either side of the bar, about 10,000 ly
 * from the centre. The artwork does not resolve them, so they get names but no
 * outline, set across the bar's flanks: the near one on the Sun's side. x and z in
 * kly, angle is the direction along the arm (the bar's own axis, BAR_ANGLE).
 */
export const THREE_KPC_ARMS = [
    { name: "Near 3 kpc Arm", x: 9.6, z: 4.9, angle: THREE.MathUtils.degToRad(117) },
    { name: "Far 3 kpc Arm", x: -9.6, z: -4.9, angle: THREE.MathUtils.degToRad(117) },
];
export const ORION_SPUR = { name: "Orion Spur", crossing: 26.3, rMin: 23, rMax: 30.5 };

/*
 * The bar's axis, and it has to agree with the backdrop: the artwork's bar sits at
 * 47 degrees in image coordinates and the plane is rotated 16 degrees, which puts
 * it here. The core's boxy bulge is built along this axis, so if BACKDROP.rotation
 * changes, this moves with it.
 */
export const BAR_ANGLE = THREE.MathUtils.degToRad(117);

/*
 * The backdrop is R. Hurt's face-on artist's concept (NASA/JPL-Caltech, public
 * domain). Its bar sits at 47 degrees in image coordinates; rotating the plane by
 * 16 degrees lines that up with the bar direction we use for the arm skeleton. It
 * is an artist's impression, not a survey, so treat it as a backdrop and not as
 * ground truth.
 */
export const BACKDROP = {
    rotation: THREE.MathUtils.degToRad(16),
    size: GALAXY_RADIUS * 2.3,
    opacity: 0.62,
    /*
     * Five sheets, not the eleven that failed twice: blurred harder the further from
     * the mid-plane, spun and tilted apart, and torn into patches by noise. The
     * mid-plane sheet is left sharp and whole and carries the structure.
     */
    slices: 5,
    halfThickness: 2.1,
    blur: 4.5,
    tear: 0.62,
    warp: THREE.MathUtils.degToRad(2.6),
    twist: THREE.MathUtils.degToRad(3.2),
    sampleSize: 448,
    stars: 2100000, // before flocculent thinning, which removes roughly a fifth
    thickDisk: 260000,
    cirrus: 2000,
    interArm: 3800,
    halo: 110000,
    gas: 10000,
    knots: 3600,
    // the named catalogue in DEEP_SKY carries the real, known objects; this is the
    // anonymous filler that keeps the rest of the disk from looking empty, so it
    // stays sparse - enough to say "these are everywhere", not enough to crowd
    scatteredDeepSky: 2000,
    blackHoles: 70,
};

/*
 * Quality tier. The full scene is ~2.6M points and a six-level bloom, which a phone
 * or a four-core laptop on battery cannot hold at 60fps and takes several seconds to
 * build. "lite" draws fewer stars and less haze - with each one brighter, because
 * count x alpha is what sets the exposure (see the density note in
 * buildGalaxyFromImage) - caps the pixel ratio and drops a bloom level. The arms,
 * the dust, the labels and every landmark are untouched: it is the same map, grainier.
 *
 * Picked automatically from the device; ?quality=lite or ?quality=full overrides it
 * and is remembered, ?quality=auto forgets the override.
 *
 * "extreme" is never picked automatically, only by hand (Settings, or
 * ?quality=extreme): two and a half times the stars, each fainter so the exposure
 * holds, and half again the haze. About 6 million points, for a strong GPU.
 */
export function detectQuality() {
    let override = null;
    try {
        const asked = new URLSearchParams(window.location.search).get("quality");
        if (asked === "auto") localStorage.removeItem("galaxyQuality");
        else if (asked === "lite" || asked === "full" || asked === "extreme") localStorage.setItem("galaxyQuality", asked);
        override = localStorage.getItem("galaxyQuality");
    } catch (e) {}
    if (override === "lite" || override === "full" || override === "extreme") return { tier: override, auto: false };
    const phone = window.matchMedia("(pointer: coarse)").matches && Math.min(window.screen.width, window.screen.height) < 600;
    const fewCores = (navigator.hardwareConcurrency || 8) <= 4;
    const littleMemory = (navigator.deviceMemory || 8) <= 4;
    return { tier: phone || fewCores || littleMemory ? "lite" : "full", auto: true };
}
export const QUALITY = detectQuality();
export const LITE = QUALITY.tier === "lite";
export const EXTREME = QUALITY.tier === "extreme";
// fraction of the stars and of the haze kept per tier; alphas move the other way to match
export const STAR_DENSITY = LITE ? 0.45 : EXTREME ? 3 : 1;
export const HAZE_DENSITY = LITE ? 0.6 : EXTREME ? 2.5 : 1;
for (const key of ["stars", "thickDisk", "halo"]) BACKDROP[key] = Math.round(BACKDROP[key] * STAR_DENSITY);
for (const key of ["gas", "cirrus", "interArm"]) BACKDROP[key] = Math.round(BACKDROP[key] * HAZE_DENSITY);
export const STAR_ALPHA = 1 / STAR_DENSITY;
export const HAZE_ALPHA = 1 / HAZE_DENSITY;
/*
 * Full is capped at 1.5 (owner, 2026-11-26: it held an Arc laptop at full load). On a
 * 2x screen that is 44% fewer pixels for the post-processing and the soft layers, and
 * points are drawn at a size in pixels anyway, so the stars barely change.
 */
export const MAX_PIXEL_RATIO = LITE ? 1.25 : EXTREME ? 3 : 1.5;
/*
 * Extreme is the best picture this page can make, at any cost (owner, 2026-11-24):
 *   - supersampled: it renders at twice the screen's own pixel ratio (up to 3), so a
 *     star is a resolved point rather than a pixel, and the browser scales it down
 *   - three times the stars, 2.5 times the haze, twice the star-forming knots and
 *     twice the shell stars and galaxy dots round the disk, each fainter to match
 *   - the haze, the bulge glow and the off-plane sheets render at full resolution
 *     instead of half (SOFT_SCALE)
 *   - nine backdrop slices instead of five, for a smooth disk from the side
 *   - one more bloom level, for a wider, softer glow round the core and bright knots
 *   - the sharpest texture filtering the GPU has, on the backdrop and the photos
 */
export const PIXEL_RATIO = EXTREME ? Math.min(Math.max(window.devicePixelRatio || 1, 1) * 2, MAX_PIXEL_RATIO) : Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
export const SURROUNDINGS_DENSITY = EXTREME ? 2 : 1;
if (EXTREME) {
    BACKDROP.slices = 9;
    BACKDROP.knots = Math.round(BACKDROP.knots * 2);
}

/*
 * The bulge as a volume. The point cloud in buildCore() gives it grain, but grain is
 * not glow: seen from any distance a bulge is the smooth light of billions of stars
 * that do not resolve, and that is what was missing - close in, the centre of the
 * galaxy rendered as a dark hole with ring glyphs floating in it.
 *
 * So the glow is built from a few hundred soft sprites laid out in the bulge's real
 * shape - the boxy bar, the four lobes of the X, a tight nucleus - which, unlike one
 * camera-facing sprite, has that shape from every direction: round from above,
 * a peanut from the side. Sizes are world diameters in kly.
 */
export const BULGE = {
    body: 300,
    lobes: 96,
    nucleus: 44,
    half: { along: 8.4, across: 3.6, height: 2.5 },
    exponent: 2.6,
    // sprite size units per kly of diameter: 900px tall, 50 degree lens, 80 units out
    unit: 12.06,
};

/*
 * The backdrop is a blue-white photograph, but the 3D star field leans violet on
 * purpose: it is the house look, and it separates our stars from the artwork behind
 * them. STAR_TINTS are blended into each sampled pixel colour.
 */
export const INTER_ARM_TINT = new THREE.Color(1.0, 0.72, 0.5);
// young blue stars just outside an arm's dust lane, older warmer light inside it
export const ARM_OUTER_EDGE = new THREE.Color(0.58, 0.76, 1.0);
export const ARM_INNER_EDGE = new THREE.Color(1.0, 0.74, 0.56);
export const THICK_DISK_TINT = new THREE.Color(1.0, 0.78, 0.6);
export const CIRRUS_VIOLET = new THREE.Color(0.46, 0.4, 1.0);
export const CIRRUS_BLUE = new THREE.Color(0.3, 0.56, 1.0);
export const HALO_TINT = new THREE.Color(1.0, 0.87, 0.72);
export const WHITE = new THREE.Color(1, 1, 1);

export const STAR_TINTS = [
    { color: new THREE.Color(0.56, 0.5, 1.0), weight: 0.36, amount: 0.5 },
    { color: new THREE.Color(0.95, 0.52, 0.98), weight: 0.16, amount: 0.42 },
    { color: new THREE.Color(0.5, 0.74, 1.0), weight: 0.3, amount: 0.36 },
    { color: new THREE.Color(1.0, 0.97, 0.93), weight: 0.18, amount: 0.2 },
];

/*
 * A slight violet cast over the whole galaxy - the painting, the stars and the haze
 * sampled from it. Nobody has seen the Milky Way from outside, so its colour is an
 * expectation, not a measurement, and the house look leans violet. Channel gains,
 * balanced so luminance stays where it was (0.2126 R + 0.7152 G + 0.0722 B = 1.00).
 * Warmer since 2026-11-24 (was 1.07, 0.955, 1.13): more pink and red, still violet.
 * Not applied to the nebulae, the core points or the photographs of other galaxies.
 */
export const GALAXY_TINT = new THREE.Color(1.15, 0.94, 1.12);
/*
 * What dust takes out of the light, per channel, as multiples of the green optical
 * depth. Real dust reddens strongly (about 0.75 : 1 : 1.32), which made every lane
 * rust-brown; the owner asked for black dust (2026-11-24), so it is nearly neutral
 * now - a lane is dark first and only faintly warm. Used by the stars, the haze and
 * the backdrop alike.
 */
export const DUST_COLOR = [0.88, 1.0, 1.14];
export const DUST_COLOR_GLSL = `vec3(${DUST_COLOR.map((v) => v.toFixed(2)).join(", ")})`;

export const LOCAL_RINGS_LY = [10, 100, 1000];
/*
 * The local view is at true scale now, so it begins much closer in: our farthest
 * system, Polaris, is 0.43 units from the Sun. It fades in between these camera
 * distances from the Sun, in kly.
 */
export const LOCAL_ENTER = 2.6;
export const LOCAL_FULL = 1.5;
// how close the camera may come near the Sun: about 130 AU, enough to see the two
// Voyagers apart from the Sun. Elsewhere the old limit holds (see frame()).
export const LOCAL_MIN_DISTANCE = 0.000002;
export const GALAXY_MIN_DISTANCE = 0.8;
// where the Sun button lands: every one of our systems in frame
export const SUN_VIEW = { distance: 0.95, polar: 1.0 };
// nebula and cluster names come in from this far away (camera to object, scene units)
export const DEEP_SKY_LABEL_DISTANCE = 80;
// a system's or an object's name comes in once the camera is this close to it (its dot is always drawn)
export const LABEL_TEXT_DISTANCE = 9;
// the territories layer (territories.js) is off for now (owner, 2026-11-26); its code and table stay
export const SHOW_TERRITORIES = false;

export const OVERVIEW = { target: new THREE.Vector3(0, 0, 0), distance: 85, polar: 0.9, azimuth: 0.45 };
/*
 * The opening shot, which is not the overview: the pivot sits out in the Orion Spur
 * so the view looks outward along our own arm, the Milky Way filling the right of
 * the frame with its core at the edge, and Andromeda hanging in open sky above the
 * outer arm. (A screenshot's readout is enough to recover the pivot it was taken
 * from: the two figures - distance from the core and from Sol - intersect at one
 * point.)
 *
 * Composed on the golden divisions, 0.382 and 0.618. Andromeda sits on the
 * upper-left golden intersection, at (0.42, 0.37), and the Milky Way's core holds
 * the right of the frame, so the Local Group reads as a diagonal running down to
 * Triangulum rather than as a row.
 *
 * **Clear sky means a dark background, not a clear dust column.** An earlier solve
 * placed Andromeda at a better golden fit with `diskTransmission` at 0.98 - no dust
 * in the way at all - and it still read badly, because it landed on the bright outer
 * disk. Transmission only measures dust; it says nothing about the starlight already
 * there. Candidates are now scored by rendering with Andromeda hidden and sampling
 * the sky where it would sit: this one sits on a background of 21 out of 765.
 *
 * Nothing about that arrangement is invented. M31's direction is fixed data
 * (l=121.17, b=-21.57, so it genuinely lies 21.6 degrees *below* the galactic
 * plane, 459 units under it at the distance we draw it) and it is not touched here.
 * Whether it appears above or below the disk is a property of where the camera
 * stands, not of the sky: a sweep of 8,782 legal cameras put M31 above the galactic
 * centre in 4,705 of them. This is one of those viewpoints.
 *
 * The numbers were solved for rather than eyeballed: a weighted search over the
 * pivot, distance, elevation and azimuth, minimising where the core, the Sun, M31
 * and M33 land on screen. Andromeda carries the most weight, which is what pulls it
 * into the lower-left third - a diagonal rather than the row the first solution gave
 * (M31 0.46, Sun 0.45, core 0.43, with M33's label falling off the left edge).
 *
 * **Composition is not the only constraint: Andromeda has to be in clear sky.** The
 * best-composed camera of all put it behind the disk, where `diskTransmission()`
 * cut it to 0.22 and the label suppression (below 0.3) removed its name entirely -
 * so the prettiest frame on paper was the one where Andromeda was barely there. The
 * search is therefore run in two passes: compose first, then place the camera for
 * each of the best candidates, run a real frame and keep only those where M31's
 * transmission stays above 0.85. This one sits at 0.98. If the field of view or
 * VIEW_SHIFT changes, re-solve it the same way rather than nudging it.
 */
export const START = {
    target: new THREE.Vector3(6, 0, 28),
    distance: 66,
    polar: THREE.MathUtils.degToRad(60),
    azimuth: 1.82,
};
/*
 * The same idea for a portrait screen, where START crops Andromeda off the left and
 * the core off the right. A tall frame suits the Local Group better anyway: the
 * camera's up is galactic north, so M31 and M33 stack above the disk. Solved the
 * same way, on a 375x812 phone: a sweep of 63,000 cameras scored on the disk
 * filling the width, the core and the Sun in the lower half, and M31 in open sky
 * above the disk's projected rim (never inside it). This one puts M31 at
 * (0.61, 0.22), M33 at (0.32, 0.34), the Sun at (0.38, 0.50) and the core at
 * (0.73, 0.58), and both galaxies keep a disk transmission of 1.0.
 */
export const START_PORTRAIT = {
    target: new THREE.Vector3(-4, 0, 20),
    distance: 105,
    polar: THREE.MathUtils.degToRad(45),
    azimuth: 2.198,
};
/*
 * The camera orbits the Milky Way and stays there: panning moves the pivot only
 * within the disk, and the distance is capped. Besides keeping the view oriented,
 * this is what lets the galaxy photographs be flat planes - from anywhere inside
 * this box, a plane facing the Sun is within a few degrees of facing the camera.
 */
/*
 * How far the pivot may wander, and it depends on the zoom.
 *
 * A fixed small limit reads well in the wide view - the galaxy stays centred and
 * you cannot drift off into empty space - but it makes the outer arms unreachable:
 * they sit 40-50 units out, so with the pivot pinned near the centre there is no
 * way to put one in the middle of the screen and zoom into it. So the limit opens
 * up to the rim as the camera comes in and closes again as it pulls back, which
 * also means zooming out gently recomposes the view on the galaxy.
 */
export const PIVOT = {
    nearRadius: GALAXY_RADIUS + 2, // the disk's rim, reachable when zoomed in
    farRadius: 12,
    nearHeight: 8,
    farHeight: 3.6,
    nearDistance: 22,
    maxDistance: GALAXY_RADIUS * 2 * 1.5, // 1.5 Milky Way diameters
};

/*
 * Soft things - haze, the bulge's glow, the blurred off-plane sheets of the painting
 * - hold no detail finer than a few pixels, and they are where the fill goes: a
 * haze sprite is hundreds of pixels wide and there are sixteen thousand of them. So
 * they live on their own layer and render into a half-resolution target, a quarter
 * of the pixels for a result the eye cannot tell apart, and are added back before
 * the bloom. Measured, haze alone was 5-12ms of the frame at full resolution.
 */
export const SOFT_LAYER = 1;
/*
 * The drawn object of an open place (hero.js) renders last, after the soft layers are
 * added back, so the haze and the painting's glow never wash over it: a star's disc
 * is solid, not seen through a veil (owner, 2026-11-27).
 */
export const HERO_LAYER = 2;
export const SOFT_SCALE = EXTREME ? 1 : 0.5;

export const SCRATCH_VECTOR = new THREE.Vector3();
export const ORIGIN = new THREE.Vector3(0, 0, 0);
// what starlight turns into behind a long column of dust: dimmer and much redder
export const EXTINCTION_RED = new THREE.Color(1.0, 0.42, 0.16);
export const RAYCASTER = new THREE.Raycaster();
export const GALACTIC_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export const DEEP_SKY_STYLE = {
    nebula: { color: "#ff6b8a", size: 12, label: "Nebula" },
    remnant: { color: "#ff9d6b", size: 11, label: "Supernova remnant" },
    planetary: { color: "#7de2c3", size: 9, label: "Planetary nebula" },
    open: { color: "#bcd8ff", size: 10, label: "Open cluster" },
    globular: { color: "#ffd9a0", size: 12, label: "Globular cluster" },
    structure: { color: "#9ecbff", size: 10, label: "Structure" },
};
