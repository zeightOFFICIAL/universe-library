import * as THREE from "three";
import { SUN, LOCAL_RINGS_LY } from "./config.js";
import { pointsMaterial } from "./shaders.js";
import { localRadius, Layer } from "./util.js";

/* ---------- local neighbourhood ---------- */

export function buildLocal(systems, structures) {
    const group = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x9ecbff, transparent: true, opacity: 0.35, depthWrite: false });
    const structureMaterial = new THREE.LineDashedMaterial({
        color: 0x9ecbff,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        dashSize: 0.05,
        gapSize: 0.04,
    });

    const ring = (radius, material) => {
        const pts = [];
        for (let i = 0; i <= 160; i++) {
            const a = (i / 160) * Math.PI * 2;
            pts.push(new THREE.Vector3(SUN.x + radius * Math.cos(a), SUN.y, SUN.z + radius * Math.sin(a)));
        }
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
        line.computeLineDistances();
        group.add(line);
    };

    for (const ly of LOCAL_RINGS_LY) ring(localRadius(ly), lineMaterial);
    for (const s of structures) ring(localRadius(s.radius), structureMaterial);

    // drop lines from each system to the galactic plane
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
