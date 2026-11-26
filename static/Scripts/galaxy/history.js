import * as THREE from "three";
import { SUN } from "./config.js";
import { truePosition } from "./util.js";

/*
 * The "From Earth" layer (owner, 2026-11-26): how far our history reaches.
 *
 * Light-time rings. Light from a star 57 ly away left it in 1969, so what we see of
 * it now set off while Apollo 11 was on the Moon. Each ring is at the distance light
 * covers between an event and now (2026) and names the event: the further out, the
 * deeper into the past the light we see from there set off. The galactic centre's
 * light left in the last Ice Age.
 *
 * Our own signals going the other way: the radio bubble, as far as our broadcasts
 * have reached since the first strong television signal (the Berlin Olympics, 1936),
 * and the Arecibo message, sent to the globular cluster M13 on 16 November 1974 and
 * 52 ly out now, with about 25,000 years still to go.
 *
 * The rings lie in the plane through the Sun; distances are true.
 */
export const NOW = 2026;

// light-years out, then what was happening on Earth when the light now arriving set
// off, worded to follow "it set off when ..." on the ring's label
export const HISTORY_RINGS = [
    [10, "LIGO first heard two black holes merge"],
    [57, "Apollo 11 landed on the Moon"],
    [81, "the Second World War ended"],
    [123, "the Wright brothers first flew"],
    [167, "Darwin published On the Origin of Species"],
    [257, "Watt's steam engine was new"],
    [339, "Newton published the Principia"],
    [417, "Galileo turned a telescope to the sky"],
    [534, "Columbus crossed the Atlantic"],
    [1005, "Norse settlers reached Newfoundland"],
    [2000, "Tiberius ruled Rome"],
    [4590, "the Great Pyramid of Giza was being built"],
    [11600, "Göbekli Tepe, the oldest known temple, was raised"],
    [26700, "the last Ice Age was at its height"],
    [50000, "modern humans reached Australia"],
    [100000, "our species lived only in Africa and the Levant"],
];

export function yearOf(ly) {
    const year = NOW - ly;
    if (year > 0) return year < 1000 ? `${year} AD` : String(year);
    // there is no year 0: 1 BC is followed by AD 1
    const bc = 1 - year;
    return ly > 3000 ? `about ${(Math.round(bc / 100) * 100).toLocaleString("en-GB")} BC` : `${bc} BC`;
}

export const RADIO_BUBBLE_LY = NOW - 1936;
// M13 from the Sun (J2000 RA 16h41m41s, Dec +36d27m35s): l 59.01, b +40.91, 22,200 ly
export const ARECIBO = { l: 59.01, b: 40.91, sent: 1974.88, target: "M13", targetLy: 22200 };
export const ARECIBO_LY = NOW + 0.9 - ARECIBO.sent;

function circle(radius, segments = 256) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(SUN.x + radius * Math.cos(a), SUN.y, SUN.z + radius * Math.sin(a)));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
}

export function buildHistory() {
    const group = new THREE.Group();
    group.renderOrder = 9;
    const rings = [];
    for (const [ly, event] of HISTORY_RINGS) {
        const material = new THREE.LineDashedMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false, depthTest: false, dashSize: 1, gapSize: 0.6 });
        const line = new THREE.Line(circle(ly / 1000), material);
        line.computeLineDistances();
        // dashes in proportion to the ring, so every ring has the same rhythm
        const distances = line.geometry.getAttribute("lineDistance");
        const step = (2 * Math.PI * (ly / 1000)) / 160;
        for (let i = 0; i < distances.count; i++) distances.setX(i, distances.getX(i) / step);
        line.frustumCulled = false;
        group.add(line);
        rings.push({ line, material, radius: ly / 1000, ly, event });
    }

    // the radio bubble: a solid ring, in the colour of a signal
    const radioMaterial = new THREE.LineBasicMaterial({ color: 0x9ecbff, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
    const radio = new THREE.Line(circle(RADIO_BUBBLE_LY / 1000), radioMaterial);
    radio.frustumCulled = false;
    group.add(radio);
    rings.push({ line: radio, material: radioMaterial, radius: RADIO_BUBBLE_LY / 1000, ly: RADIO_BUBBLE_LY, radio: true });

    // the Arecibo message: solid as far as it has gone, dotted on to M13
    const front = truePosition(ARECIBO.l, ARECIBO.b, ARECIBO_LY);
    const target = truePosition(ARECIBO.l, ARECIBO.b, ARECIBO.targetLy);
    const sentMaterial = new THREE.LineBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
    const sent = new THREE.Line(new THREE.BufferGeometry().setFromPoints([SUN, front]), sentMaterial);
    const aheadMaterial = new THREE.LineDashedMaterial({ color: 0xff8fb0, transparent: true, opacity: 0, depthWrite: false, depthTest: false, dashSize: 0.05, gapSize: 0.12 });
    const ahead = new THREE.Line(new THREE.BufferGeometry().setFromPoints([front, target]), aheadMaterial);
    ahead.computeLineDistances();
    for (const line of [sent, ahead]) {
        line.frustumCulled = false;
        group.add(line);
    }
    return { group, rings, arecibo: { front, target, sentMaterial, aheadMaterial } };
}

/*
 * Each ring shows while it is a readable size on screen: from about a twentieth of
 * the view to three times it, so the rings hand over to one another as you zoom.
 */
export function updateHistory(history, cameraDistance, fade) {
    for (const ring of history.rings) {
        const ratio = ring.radius / cameraDistance;
        const size = THREE.MathUtils.smoothstep(ratio, 0.025, 0.08) * (1 - THREE.MathUtils.smoothstep(ratio, 1.5, 4));
        ring.material.opacity = (ring.radio ? 0.5 : 0.42) * size * fade;
        ring.line.visible = ring.material.opacity > 0.003;
    }
    const near = 1 - THREE.MathUtils.smoothstep(cameraDistance, 2, 40);
    history.arecibo.sentMaterial.opacity = 0.8 * fade * THREE.MathUtils.smoothstep(ARECIBO_LY / 1000 / cameraDistance, 0.01, 0.05);
    history.arecibo.aheadMaterial.opacity = 0.3 * fade * Math.max(near, 0.35);
}
