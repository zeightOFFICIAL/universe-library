import * as THREE from "three";
import { SUN, ARM_K } from "./config.js";
import { formatDistance } from "./units.js";

/* ---------- helpers ---------- */

export function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const rand = mulberry32(19650701);

export function gauss() {
    let u = 0;
    while (u === 0) u = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

export function armPhase(crossing) {
    return Math.PI / 2 + Math.log(crossing) / ARM_K;
}

export function armAngle(phase, r) {
    return phase - Math.log(r) / ARM_K;
}

export function armPoint(phase, r) {
    const theta = armAngle(phase, r);
    return new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta));
}

export function directionFromSun(l, b) {
    const lr = THREE.MathUtils.degToRad(l);
    const br = THREE.MathUtils.degToRad(b);
    return new THREE.Vector3(-Math.sin(lr) * Math.cos(br), Math.sin(br), -Math.cos(lr) * Math.cos(br));
}

// true position, in kly, of something d light-years away in direction (l, b)
export function truePosition(l, b, d) {
    return directionFromSun(l, b).multiplyScalar(d / 1000).add(SUN);
}

// every distance on the map is printed in the unit chosen in the settings
export function formatLy(ly) {
    return formatDistance(ly);
}

export function smoothstep(edge0, edge1, x) {
    const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

/* ---------- particle layers ---------- */

export class Layer {
    // alphaScale lifts every point added, which is how the lite tier keeps its exposure
    constructor(capacity, alphaScale = 1) {
        this.alphaScale = alphaScale;
        this.positions = new Float32Array(capacity * 3);
        this.colors = new Float32Array(capacity * 3);
        this.sizes = new Float32Array(capacity);
        this.alphas = new Float32Array(capacity);
        // how much dust this point sits behind, read from the artwork's own lanes
        this.dust = new Float32Array(capacity);
        this.count = 0;
        this.capacity = capacity;
    }

    add(p, color, size, alpha, dust = 0) {
        if (this.count >= this.capacity) return;
        const i = this.count++;
        // written element by element: .set([...]) allocated two arrays per point, millions per load
        const j = i * 3;
        this.positions[j] = p.x;
        this.positions[j + 1] = p.y;
        this.positions[j + 2] = p.z;
        this.colors[j] = color.r;
        this.colors[j + 1] = color.g;
        this.colors[j + 2] = color.b;
        this.sizes[i] = size;
        this.alphas[i] = Math.min(alpha * this.alphaScale, 1);
        this.dust[i] = dust;
    }

    geometry() {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(this.positions.subarray(0, this.count * 3), 3));
        g.setAttribute("color", new THREE.BufferAttribute(this.colors.subarray(0, this.count * 3), 3));
        g.setAttribute("aSize", new THREE.BufferAttribute(this.sizes.subarray(0, this.count), 1));
        g.setAttribute("aAlpha", new THREE.BufferAttribute(this.alphas.subarray(0, this.count), 1));
        g.setAttribute("aDust", new THREE.BufferAttribute(this.dust.subarray(0, this.count), 1));
        return g;
    }
}
