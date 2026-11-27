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

/*
 * Frustum culling for the star field (2026-11-27). The field was one object of two
 * million points, so it was always "in view" and every star went through the vertex
 * shader - the per-star dust maths - even with the camera down among the Sun's
 * neighbours, where most of the disk is behind or beside it. Split into chunks with
 * their own bounds, three.js skips each chunk that lies wholly outside the view, as a
 * game does. The disk is cut into columns `cell` kly square; whatever lies more than
 * `disk` kly off the plane (the thick disk's and the halo's outliers) goes into eight
 * octant chunks instead, so a column's bounds stay tight. The blending is additive,
 * so drawing order does not matter and the picture is unchanged. Costs: one draw
 * call per chunk, about 70 for the stars.
 */
export function chunkGeometry(geometry, { cell = 12, disk = 1.6 } = {}) {
    const p = geometry.attributes.position.array;
    const count = geometry.attributes.position.count;
    // a dense grid of chunk ids: columns across +-120 kly, then eight halo octants
    const side = Math.ceil(240 / cell);
    const ids = new Int32Array(side * side + 8).fill(-1);
    const chunkOf = new Uint16Array(count);
    const slot = new Uint32Array(count);
    const fill = [];
    for (let i = 0; i < count; i++) {
        const x = p[i * 3];
        const y = p[i * 3 + 1];
        const z = p[i * 3 + 2];
        let key;
        if (y > disk || y < -disk) key = side * side + (x > 0 ? 1 : 0) + (y > 0 ? 2 : 0) + (z > 0 ? 4 : 0);
        else {
            const cx = Math.min(Math.max(Math.floor(x / cell) + (side >> 1), 0), side - 1);
            const cz = Math.min(Math.max(Math.floor(z / cell) + (side >> 1), 0), side - 1);
            key = cx * side + cz;
        }
        let id = ids[key];
        if (id < 0) {
            id = ids[key] = fill.length;
            fill.push(0);
        }
        chunkOf[i] = id;
        slot[i] = fill[id]++;
    }
    // pass 2: each attribute copied straight across, one typed array at a time
    const geometries = fill.map(() => new THREE.BufferGeometry());
    for (const [name, source] of Object.entries(geometry.attributes)) {
        const n = source.itemSize;
        const from = source.array;
        const into = fill.map((size) => new from.constructor(size * n));
        if (n === 1) {
            for (let i = 0; i < count; i++) into[chunkOf[i]][slot[i]] = from[i];
        } else {
            for (let i = 0; i < count; i++) {
                const to = into[chunkOf[i]];
                const a = slot[i] * 3;
                const b = i * 3;
                to[a] = from[b];
                to[a + 1] = from[b + 1];
                to[a + 2] = from[b + 2];
            }
        }
        into.forEach((array, id) => geometries[id].setAttribute(name, new THREE.BufferAttribute(array, n)));
    }
    for (const g of geometries) g.computeBoundingSphere();
    return geometries;
}

/*
 * Memory (2026-11-27): once a big point cloud is on the GPU, its JavaScript copy is
 * dead weight - about 80 MB for the full star field. This drops each attribute's array
 * after its first upload (three.js's own pattern). Bounds must be computed before, and
 * nothing may read or update these arrays afterwards; a lost WebGL context cannot be
 * restored from them, which the page does not try to do anyway.
 */
export function releaseAfterUpload(geometry) {
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    for (const attribute of Object.values(geometry.attributes)) {
        attribute.onUpload(function () {
            this.array = null;
        });
    }
    return geometry;
}
