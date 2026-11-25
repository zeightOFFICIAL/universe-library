import * as THREE from "three";
import { GALAXY_RADIUS } from "./config.js";
import { smoothstep } from "./util.js";

/*
 * Everything here is additively blended, which means nothing ever hides anything:
 * light from a galaxy behind the Milky Way adds straight through the disk, so the
 * disk looks like glass and the galaxy behind it is unreadable. No amount of extra
 * density fixes that, because addition has no notion of in front or behind.
 *
 * The fix is the real one: dust. A line of sight that crosses the disk passes
 * through its dust layer, and that dust absorbs. Below we integrate a rough column
 * of dust along the segment from the camera to the object and apply Beer's law, so
 * something seen through the disk is dimmed while something off to the side is not.
 */
export const DUST = {
    halfHeight: 0.9, // dust scale height, kly
    radius: GALAXY_RADIUS + 5,
    bulgeSigma: 3.2,
    bulgeWeight: 2.6,
    opticalDepth: 0.5,
    steps: 24,
    clipHeight: 10, // beyond this the disk contributes nothing worth sampling
    // the lane the stars themselves are seen through: thinner and weaker than the
    // column used for background galaxies, because it has to read as a lane rather
    // than as an eclipse. laneDepth is the optical depth per unit of mid-plane column
    laneHeight: 0.34,
    // the lane's strength on the soft layers, relative to the stars
    softLane: 1.0,
    /*
     * Retuned for HDR. These were raised step by step to cut through a band that
     * was clipping at two and a half times white, where a lane that only halved the
     * light did not show at all. Nothing clips now, so a lane that takes four fifths
     * of the mid-plane is already a dark lane.
     */
    laneDepth: 0.1,
    laneFloor: 2.3,
    // the arm lanes: far stronger per unit column, because a lane is dense
    // 6.2 until 2026-11-25, when the owner asked for more dust
    armDepth: 7.6,
    /*
     * How deeply the artwork's own lanes are darkened; this is the one that shows.
     * It is an optical depth now, not a fraction, so the number jumped when the law
     * became exponential: matching the old linear curve at a typical lane (dust 0.3)
     * needs 1.72, and 2.1 is that plus the 20% asked for. At a dense lane it gives
     * transmission 0.12 instead of the old hard zero - darker in practice, and still
     * coloured, which the clipped version could not be.
     */
    backdropDepth: 3.3,
    // and how hard the mid-plane sheet is cut when the disk is seen edge-on
    planeLaneDepth: 1.3,
};
export const DUST_SAMPLE = new THREE.Vector3();
export const DUST_SEGMENT = new THREE.Vector3();

/*
 * Integrate a rough dust column along the segment. The segment is clipped to the
 * disk first: sampling the whole camera-to-Andromeda line would step over a dust
 * layer under 2 kly thick and report no dust at all, which is exactly what the
 * first attempt did.
 */
export function dustColumn(from, to, bulgeWeight = DUST.bulgeWeight) {
    DUST_SEGMENT.copy(to).sub(from);
    const length = DUST_SEGMENT.length();
    if (length < 1e-4) return 0;

    let t0 = 0;
    let t1 = 1;

    // clip against the slab |y| <= clipHeight
    if (Math.abs(DUST_SEGMENT.y) > 1e-6) {
        const ta = (-DUST.clipHeight - from.y) / DUST_SEGMENT.y;
        const tb = (DUST.clipHeight - from.y) / DUST_SEGMENT.y;
        t0 = Math.max(t0, Math.min(ta, tb));
        t1 = Math.min(t1, Math.max(ta, tb));
    } else if (Math.abs(from.y) > DUST.clipHeight) {
        return 0;
    }
    if (t1 <= t0) return 0;

    // clip against the cylinder r <= DUST.radius
    const a = DUST_SEGMENT.x * DUST_SEGMENT.x + DUST_SEGMENT.z * DUST_SEGMENT.z;
    const b = 2 * (from.x * DUST_SEGMENT.x + from.z * DUST_SEGMENT.z);
    const c = from.x * from.x + from.z * from.z - DUST.radius * DUST.radius;
    if (a > 1e-9) {
        const disc = b * b - 4 * a * c;
        if (disc <= 0) return 0;
        const root = Math.sqrt(disc);
        t0 = Math.max(t0, (-b - root) / (2 * a));
        t1 = Math.min(t1, (-b + root) / (2 * a));
    } else if (c > 0) {
        return 0;
    }
    if (t1 <= t0) return 0;

    let weight = 0;
    for (let i = 0; i < DUST.steps; i++) {
        const t = t0 + ((i + 0.5) / DUST.steps) * (t1 - t0);
        DUST_SAMPLE.copy(from).addScaledVector(DUST_SEGMENT, t);
        const radius = Math.hypot(DUST_SAMPLE.x, DUST_SAMPLE.z);
        // the thin dust lane hugging the mid-plane, thinning towards the rim
        const vertical = Math.exp(-(DUST_SAMPLE.y * DUST_SAMPLE.y) / (2 * DUST.halfHeight * DUST.halfHeight));
        const radial = 1 - smoothstep(DUST.radius * 0.55, DUST.radius, radius);
        // plus the bulge, which is why we cannot see the galactic centre in visible light
        const fromCentre = DUST_SAMPLE.length();
        const bulge = bulgeWeight * Math.exp(-(fromCentre * fromCentre) / (2 * DUST.bulgeSigma * DUST.bulgeSigma));
        weight += vertical * radial + bulge;
    }
    return (weight / DUST.steps) * (t1 - t0) * length;
}

/*
 * How much of an object's light survives the trip to the camera. A galaxy behind
 * the disk really is invisible - that is the Zone of Avoidance - but a map that
 * drops it to nothing looks like a missing asset, so a trace is left behind.
 */
export function diskTransmission(from, to) {
    return Math.max(Math.exp(-DUST.opticalDepth * dustColumn(from, to)), 0.06);
}
