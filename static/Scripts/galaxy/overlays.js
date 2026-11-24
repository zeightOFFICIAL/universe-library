import * as THREE from "three";
import { ORIGIN } from "./config.js";

/*
 * Two map overlays in the plane of the disk, each on its own layer switch.
 *
 * Bearings: a dot on the pivot - the point the readout measures from, which sits
 * in the middle of the view - and four beams from it in the plane. The first runs
 * all the way to the galactic centre; the other three point 90, 180 and 270
 * degrees round from it, in the sense galactic longitude turns (from the Sun, 90
 * degrees is the way the disk rotates). They are as long as about a third of the
 * view, so they read the same at every zoom.
 *
 * Sectors: a grid of 5,000 ly squares over the disk, letters A-T across and
 * numbers 1-20 from the far side of the core towards the Sun, so the Sun is in K16.
 * The two lines through the centre are drawn bolder: they split the disk into
 * four quadrants. The square under the pivot is lit, and the view puts its name
 * in the readout.
 */
export const SECTOR = { size: 5, count: 20 };
const HALF = (SECTOR.size * SECTOR.count) / 2;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function sectorName(point) {
    const column = Math.floor((point.x + HALF) / SECTOR.size);
    const row = Math.floor((point.z + HALF) / SECTOR.size);
    if (column < 0 || row < 0 || column >= SECTOR.count || row >= SECTOR.count) return null;
    return `${LETTERS[column]}${row + 1}`;
}

// a line material whose per-vertex alpha tapers each beam out towards its end
function lineMaterial(color) {
    return new THREE.LineBasicMaterial({ color, transparent: true, depthWrite: false, depthTest: false, vertexColors: true, opacity: 0 });
}

export function buildBearings() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(8 * 3), 3));
    // the core beam stays bright to the end; the other three fade out
    const alphas = [1, 0.9, 1, 0, 1, 0, 1, 0];
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(alphas.flatMap((a) => [1, 1, 1, a]), 4));
    const material = lineMaterial(0xffd9a0);
    const lines = new THREE.LineSegments(geometry, material);
    lines.frustumCulled = false;
    lines.renderOrder = 9;
    return { lines, material, geometry };
}

/*
 * Moves the beams to the pivot. Returns the four end points (core first), which
 * the view uses to place the tags; length is in scene units.
 */
const DIRECTION = new THREE.Vector3();
const SIDE = new THREE.Vector3();
export function updateBearings(bearings, pivot, length) {
    DIRECTION.set(ORIGIN.x - pivot.x, 0, ORIGIN.z - pivot.z);
    const toCore = DIRECTION.length();
    // on the centre itself there is no way to the core: face away from the Sun instead
    if (toCore < 1e-6) DIRECTION.set(0, 0, -1);
    else DIRECTION.divideScalar(toCore);
    const position = bearings.geometry.attributes.position;
    const ends = [];
    for (let i = 0; i < 4; i++) {
        // 90 degrees on from (x, z) in the longitude sense is (z, -x)
        if (i === 0) SIDE.copy(DIRECTION);
        else SIDE.set(SIDE.z, 0, -SIDE.x);
        const reach = i === 0 ? Math.max(toCore, length) : length;
        const end = pivot.clone().addScaledVector(SIDE, reach);
        position.setXYZ(i * 2, pivot.x, pivot.y, pivot.z);
        position.setXYZ(i * 2 + 1, end.x, end.y, end.z);
        ends.push(pivot.clone().addScaledVector(SIDE, Math.min(reach, length)));
    }
    position.needsUpdate = true;
    return { ends, toCore };
}

export function buildSectors() {
    const points = [];
    const colors = [];
    const line = (x1, z1, x2, z2, alpha) => {
        points.push(x1, 0, z1, x2, 0, z2);
        colors.push(1, 1, 1, alpha, 1, 1, 1, alpha);
    };
    for (let i = 0; i <= SECTOR.count; i++) {
        const at = -HALF + i * SECTOR.size;
        // the quadrant lines through the centre and the border are the strong ones
        const alpha = at === 0 ? 1 : i === 0 || i === SECTOR.count ? 0.7 : 0.38;
        line(at, -HALF, at, HALF, alpha);
        line(-HALF, at, HALF, at, alpha);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));
    const material = lineMaterial(0x9ecbff);
    const grid = new THREE.LineSegments(geometry, material);
    grid.frustumCulled = false;
    grid.renderOrder = 9;

    // the square under the pivot
    const cellMaterial = new THREE.MeshBasicMaterial({ color: 0x9ecbff, transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const cell = new THREE.Mesh(new THREE.PlaneGeometry(SECTOR.size, SECTOR.size).rotateX(-Math.PI / 2), cellMaterial);
    cell.frustumCulled = false;
    cell.renderOrder = 9;

    const group = new THREE.Group();
    group.add(grid, cell);

    // edge labels: letters along both rims across the disk, numbers along the other two
    const labels = [];
    for (let i = 0; i < SECTOR.count; i++) {
        const mid = -HALF + (i + 0.5) * SECTOR.size;
        const edge = HALF + SECTOR.size * 0.3;
        labels.push({ name: LETTERS[i], position: new THREE.Vector3(mid, 0, -edge) });
        labels.push({ name: LETTERS[i], position: new THREE.Vector3(mid, 0, edge) });
        labels.push({ name: String(i + 1), position: new THREE.Vector3(-edge, 0, mid) });
        labels.push({ name: String(i + 1), position: new THREE.Vector3(edge, 0, mid) });
    }
    return { group, material, cell, cellMaterial, labels };
}

// lights the square the pivot is over, or nothing when it is off the grid
export function updateSectors(sectors, pivot) {
    const column = Math.floor((pivot.x + HALF) / SECTOR.size);
    const row = Math.floor((pivot.z + HALF) / SECTOR.size);
    const inside = column >= 0 && row >= 0 && column < SECTOR.count && row < SECTOR.count;
    sectors.cell.visible = inside;
    if (inside) sectors.cell.position.set(-HALF + (column + 0.5) * SECTOR.size, 0, -HALF + (row + 0.5) * SECTOR.size);
}
