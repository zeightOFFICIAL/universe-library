import * as THREE from "three";
import { pointsMaterial } from "./shaders.js";
import { mulberry32, truePosition, Layer } from "./util.js";

/*
 * The "Known planets" layer (owner, 2026-11-26): where the planets we know of are.
 *
 * It is limited, and that is the point of showing it. About 6,000 planets were
 * confirmed by 2026, and almost all of them are within a few thousand light-years
 * of the Sun - a speck of the disk - because every method needs the star to be
 * near enough, or lined up just so:
 *
 *   radial velocity   a star's wobble: bright, near stars, within ~200 ly, all over the sky
 *   TESS              transits across the whole sky, mostly within ~1,000 ly
 *   ground transits   WASP, HAT, KELT: hot Jupiters a few hundred to ~1,500 ly out
 *   Kepler            one patch of sky in Cygnus and Lyra, 115 square degrees, out to
 *                     ~5,000 ly: a narrow cone, and half of all known planets
 *   K2                Kepler's second life, in fields strung along the ecliptic
 *   microlensing      a star passing in front of a bulge star: a thin line of finds
 *                     towards the galactic centre, 5,000-25,000 ly out
 *   direct imaging    young, wide giants within a few hundred ly
 *
 * This is NOT the catalogue: positions are drawn from each survey's direction and
 * reach, in the right numbers (NASA Exoplanet Archive counts, rounded), so the shape
 * is right and no single dot is a real planet. The legend and the tooltip say so.
 */
export const PLANET_COUNT_NOTE = "about 6,000 confirmed by 2026";

const SURVEYS = [
    // name, count, how to place one
    ["Radial velocity", 1100, (r) => [r.dir(), 12 + Math.abs(r.gauss()) * 90]],
    ["TESS", 750, (r) => [r.dir(), 40 + Math.pow(r.next(), 2) * 950]],
    ["Ground transits", 500, (r) => [r.dir(), 150 + Math.pow(r.next(), 0.9) * 1500]],
    ["Kepler", 3000, (r) => [r.cone(76.3, 13.5, 7), Math.exp(Math.log(2000) + 0.55 * r.gauss())]],
    ["K2", 550, (r) => [r.ecliptic(3), Math.exp(Math.log(520) + 0.6 * r.gauss())]],
    ["Microlensing", 230, (r) => [[r.gauss() * 4, -2.6 + r.gauss() * 1.4], 5000 + r.next() * 20000]],
    ["Direct imaging", 80, (r) => [r.dir(), 30 + r.next() * 450]],
];

// where the eye should go: labelled places on this layer
export const PLANET_LABELS = [
    { name: "Kepler field", sub: "Half of all known planets, in one patch of sky", l: 76.3, b: 13.5, d: 2000 },
    { name: "Microlensing finds", sub: "A thin line of planets towards the bulge", l: 0.5, b: -2.6, d: 12000 },
];

function sampler(seed) {
    const next = mulberry32(seed);
    const gauss = () => {
        let u = 0;
        while (u === 0) u = next();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
    };
    // a direction as galactic [l, b], uniform over the sky
    const dir = () => [next() * 360, THREE.MathUtils.radToDeg(Math.asin(next() * 2 - 1))];
    const cone = (l, b, radius) => {
        const a = next() * Math.PI * 2;
        const d = Math.sqrt(next()) * radius;
        return [l + (Math.cos(a) * d) / Math.cos(THREE.MathUtils.degToRad(b)), b + Math.sin(a) * d];
    };
    // the ecliptic's north pole sits at galactic l 96.38, b 29.81
    const pole = truePosition(96.38, 29.81, 1000).sub(truePosition(0, 0, 0)).normalize();
    const u = new THREE.Vector3(0, 1, 0).cross(pole).normalize();
    const v = pole.clone().cross(u);
    const ecliptic = (spread) => {
        const a = next() * Math.PI * 2;
        const w = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a)).addScaledVector(pole, Math.sin(THREE.MathUtils.degToRad(gauss() * spread)));
        w.normalize();
        // back to l, b in this scene's axes (see util.directionFromSun)
        return [THREE.MathUtils.radToDeg(Math.atan2(-w.x, -w.z)), THREE.MathUtils.radToDeg(Math.asin(w.y))];
    };
    return { next, gauss, dir, cone, ecliptic };
}

export function buildExoplanets() {
    const total = SURVEYS.reduce((sum, s) => sum + s[1], 0);
    const layer = new Layer(total);
    const r = sampler(60611995);
    const color = new THREE.Color();
    const teal = new THREE.Color(0.45, 1.0, 0.78);
    const lime = new THREE.Color(0.7, 1.0, 0.55);
    for (const [, count, place] of SURVEYS) {
        for (let i = 0; i < count; i++) {
            const [[l, b], d] = place(r);
            const p = truePosition(l, b, Math.min(Math.max(d, 4), 26000));
            color.copy(teal).lerp(lime, r.next() * 0.5);
            layer.add(p, color, 2.4 + r.next() * 1.2, 0.5 + r.next() * 0.3);
        }
    }
    const material = pointsMaterial({ maxSize: 3.6, minSize: 1.6, sharpness: 7, attenuate: 0 });
    const points = new THREE.Points(layer.geometry(), material);
    points.frustumCulled = false;
    points.renderOrder = 9;
    return { points, material, count: total };
}

/*
 * The "Planet catalogue" layer (owner, 2026-11-26): the real thing, beside the
 * survey sketch above. One point per host star from the NASA Exoplanet Archive's
 * composite table (static/Data/exoplanets.json, downloaded once, no request
 * leaves the page): l and b to 0.1 degrees and the distance to the light-year,
 * which is all a galaxy-wide map can show - not a precise catalogue. A star with
 * more planets is a little bigger; the colour says how they were found.
 */
export const CATALOGUE_COLORS = [
    [0.45, 1.0, 0.78], // transit
    [1.0, 0.86, 0.5], // radial velocity
    [1.0, 0.55, 0.75], // microlensing
    [0.62, 0.8, 1.0], // imaging
    [0.85, 0.85, 0.9], // other
];

export function buildCatalogue(data) {
    const hosts = data.hosts || [];
    const layer = new Layer(hosts.length);
    const color = new THREE.Color();
    for (const [l, b, ly, planets, method] of hosts) {
        const p = truePosition(l, b, Math.max(ly, 4));
        color.setRGB(...(CATALOGUE_COLORS[method] || CATALOGUE_COLORS[4]));
        layer.add(p, color, 2.6 + Math.min(planets - 1, 5) * 0.45, 0.7);
    }
    const material = pointsMaterial({ maxSize: 4.4, minSize: 1.8, sharpness: 8, attenuate: 0 });
    const points = new THREE.Points(layer.geometry(), material);
    points.frustumCulled = false;
    points.renderOrder = 9;
    const planets = hosts.reduce((sum, h) => sum + h[3], 0);
    return { points, material, hosts: hosts.length, planets };
}
