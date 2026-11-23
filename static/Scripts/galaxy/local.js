import * as THREE from "three";
import { SUN, LOCAL_RINGS_LY } from "./config.js";
import { pointsMaterial } from "./shaders.js";
import { Layer } from "./util.js";

/* ---------- local neighbourhood, at true scale ---------- */

export function buildLocal(systems, structures) {
    const group = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x9ecbff, transparent: true, opacity: 0.35, depthWrite: false });
    const structureMaterial = new THREE.LineDashedMaterial({
        color: 0x9ecbff,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        // in units of the ring's own circumference (see ring()), so a dash looks the
        // same on a 10 ly ring and a 500 ly one
        dashSize: 0.012,
        gapSize: 0.009,
    });

    const ring = (radius, material) => {
        const pts = [];
        for (let i = 0; i <= 160; i++) {
            const a = (i / 160) * Math.PI * 2;
            pts.push(new THREE.Vector3(SUN.x + radius * Math.cos(a), SUN.y, SUN.z + radius * Math.sin(a)));
        }
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
        line.computeLineDistances();
        // dash lengths are measured along the line, so normalise them to the ring
        const distances = line.geometry.getAttribute("lineDistance");
        const circumference = 2 * Math.PI * radius;
        for (let i = 0; i < distances.count; i++) distances.setX(i, distances.getX(i) / circumference);
        group.add(line);
    };

    // radii in kly: 1 unit is 1,000 ly, the same scale as the rest of the galaxy
    for (const ly of LOCAL_RINGS_LY) ring(ly / 1000, lineMaterial);
    for (const s of structures) ring(s.radius / 1000, structureMaterial);

    // drop lines from each system to the galactic plane through the Sun
    const drops = [];
    const dots = new Layer(systems.length);
    for (const s of systems) {
        drops.push(s.position, new THREE.Vector3(s.position.x, SUN.y, s.position.z));
        dots.add(s.position, new THREE.Color(s.color).convertSRGBToLinear(), 10, 1);
    }
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(drops), lineMaterial));
    const dotMaterial = pointsMaterial({ maxSize: 14, sharpness: 10, attenuate: 0 });
    group.add(new THREE.Points(dots.geometry(), dotMaterial));

    return { group, materials: [lineMaterial, structureMaterial], dotMaterial };
}
