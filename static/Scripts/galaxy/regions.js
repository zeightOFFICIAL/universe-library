import * as THREE from "three";
import { ARMS, ORION_SPUR, BAR_ANGLE, BACKDROP } from "./config.js";
import { mulberry32, armPhase, armPoint, smoothstep, Layer } from "./util.js";
import { BACKDROP_MATRIX } from "./backdrop.js";

/*
 * Two pieces of a spiral's anatomy the painting only hints at (owner, 2026-11-26).
 *
 * HII regions: clouds of hydrogen lit pink by the young hot stars inside them,
 * strung along the arms like beads - the most recognisable thing in any photograph
 * of a face-on spiral. They sit on the arm ridges, a little inside them (gas piles
 * up on the inner edge, where the dust lane is), and only where the painting is lit:
 * a bead in an empty gap would be a bead on nothing. Each is a soft glow with a few
 * brighter knots in it.
 *
 * The bar: the long, faint bar of old stars the arms start from, ~13,000 ly each
 * way from the centre along BAR_ANGLE, beyond the boxy bulge (which has its own
 * glow). Soft sprites on the half-resolution layer, warm like the bulge.
 *
 * Both draw from their own seeded generators, never the shared one, so the star
 * field is exactly what it was.
 */
const INVERSE = new THREE.Matrix4().copy(BACKDROP_MATRIX).invert();
const SCRATCH = new THREE.Vector3();

// how lit the painting is at a point in the plane, 0..1
function litAt(sampler, x, z) {
    SCRATCH.set(x, 0, z).applyMatrix4(INVERSE);
    const ix = Math.floor((SCRATCH.x / BACKDROP.size + 0.5) * sampler.n);
    const iy = Math.floor((0.5 - SCRATCH.y / BACKDROP.size) * sampler.n);
    return sampler.lum(ix, iy);
}

export function buildHII(sampler) {
    const random = mulberry32(5512026);
    const gauss = () => {
        let u = 0;
        while (u === 0) u = random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
    };
    const glows = new Layer(900);
    const knots = new Layer(2600);
    const color = new THREE.Color();
    const rose = new THREE.Color(1.0, 0.36, 0.56);
    const magenta = new THREE.Color(1.0, 0.3, 0.72);
    const coral = new THREE.Color(1.0, 0.46, 0.42);
    const p = new THREE.Vector3();
    const arms = [...ARMS.map((a) => ({ crossing: a.crossing, rMax: a.rMax ?? 48, rMin: 8.5 })), { crossing: ORION_SPUR.crossing, rMin: ORION_SPUR.rMin, rMax: ORION_SPUR.rMax }];
    for (const arm of arms) {
        const phase = armPhase(arm.crossing);
        // beads every ~1.1 kly along the arm, more where it is bright
        for (let r = arm.rMin; r < arm.rMax; r += 0.55 + random() * 0.9) {
            const centre = armPoint(phase, r);
            const inward = centre.clone().normalize().multiplyScalar(-0.35 - random() * 0.4);
            const sideways = new THREE.Vector3(-centre.z, 0, centre.x).normalize().multiplyScalar(gauss() * 0.5);
            p.copy(centre).add(inward).add(sideways);
            const lit = litAt(sampler, p.x, p.z);
            // only on painted arm, and thinning out towards the rim
            if (random() > smoothstep(0.08, 0.3, lit) * (1 - 0.6 * smoothstep(36, 48, r))) continue;
            p.y = gauss() * 0.05;
            color.copy(rose).lerp(random() < 0.5 ? magenta : coral, random() * 0.6);
            const scale = 0.5 + random() * 1.1;
            glows.add(p, color, 12 * scale, 0.1 + random() * 0.08);
            const count = 2 + Math.floor(random() * 5);
            for (let i = 0; i < count; i++) {
                const q = p.clone().add(new THREE.Vector3(gauss() * 0.18 * scale, gauss() * 0.03, gauss() * 0.18 * scale));
                knots.add(q, color.clone().lerp(new THREE.Color(1, 0.8, 0.9), random() * 0.35), 2.4 + random() * 2.8, 0.26 + random() * 0.24);
            }
        }
    }
    return { glows, knots };
}

export function buildBar() {
    const random = mulberry32(1172026);
    const gauss = () => {
        let u = 0;
        while (u === 0) u = random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
    };
    const layer = new Layer(900);
    const cos = Math.cos(BAR_ANGLE);
    const sin = Math.sin(BAR_ANGLE);
    const p = new THREE.Vector3();
    const color = new THREE.Color();
    const gold = new THREE.Color(1.0, 0.8, 0.54);
    const ember = new THREE.Color(1.0, 0.64, 0.4);
    for (let i = 0; i < 900; i++) {
        // flat along the bar out to ~13 kly, then a soft end; thin across, thinner up
        const along = (random() * 2 - 1) * 14;
        const end = 1 - smoothstep(9, 14, Math.abs(along));
        if (random() > end) continue;
        const across = gauss() * (1.1 + 0.05 * Math.abs(along));
        const height = gauss() * 0.32;
        p.set(along * cos - across * sin, height, along * sin + across * cos);
        color.copy(gold).lerp(ember, smoothstep(4, 13, Math.abs(along)) * 0.8 + random() * 0.2);
        layer.add(p, color, (2.2 + random() * 2.4) * 12.06, 0.012 + 0.02 * end);
    }
    return layer;
}
