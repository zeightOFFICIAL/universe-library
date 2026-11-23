import * as THREE from "three";
import { DEEP_SKY_STYLE } from "./config.js";
import { pointsMaterial, glowSprite } from "./shaders.js";
import { rand, gauss, mulberry32, directionFromSun, truePosition, Layer } from "./util.js";

/*
 * The named landmarks, drawn to be looked at rather than measured. Positions are
 * exact; the look is not. Each object gets:
 *
 *   - a bright core point, as before
 *   - a soft coloured halo; nebulae get several offset, differently tinted wisps,
 *     so each reads as a cloud with a shape rather than a round dot
 *   - planetary nebulae and supernova remnants a ring, the shell they are
 *   - clusters a scatter of member stars, spread wider than life so the Pleiades
 *     look like the Pleiades when you fly past them
 *
 * Its own seeded generator, so adding a landmark never reshuffles the star field.
 */
// one dial for how loud the painted layer is against the star field
const ART_BRIGHTNESS = 0.68;

const ARTISTIC = {
    nebula: { wisps: 4, spread: 0.05, size: [14, 26], alpha: [0.045, 0.08], tints: ["#ff6b8a", "#ff9fc0", "#8fb8ff", "#c58cff"] },
    remnant: { wisps: 2, spread: 0.03, size: [12, 18], alpha: [0.045, 0.065], tints: ["#ff9d6b", "#7fd6ff"], ring: 13 },
    planetary: { wisps: 1, spread: 0, size: [10, 12], alpha: [0.05, 0.07], tints: ["#7de2c3"], ring: 9 },
    open: { wisps: 1, spread: 0, size: [16, 22], alpha: [0.03, 0.045], tints: ["#9cc4ff"], members: 18, memberSpread: 0.016 },
    globular: { wisps: 1, spread: 0, size: [11, 15], alpha: [0.06, 0.08], tints: ["#ffd9a0"], members: 36, memberSpread: 0.022 },
};

/*
 * options: seed for the generator; amount (0..1) thins the wisps and member stars
 * and quietens them, for the unnamed filler that covers the rest of the disk;
 * cores false when the caller already draws each object's point; haloFloor is the
 * smallest a wisp may shrink to on screen.
 */
export function buildDeepSky(objects, { seed = 20261123, amount = 1, cores: drawCores = true, haloFloor = 5 } = {}) {
    const random = mulberry32(seed);
    const between = ([lo, hi]) => lo + (hi - lo) * random();
    const normal = () => {
        let u = 0;
        while (u === 0) u = random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
    };

    const cores = new Layer(objects.length);
    const halos = new Layer(objects.length * 5);
    const rings = new Layer(objects.length);
    const members = new Layer(objects.length * 40);
    const color = new THREE.Color();
    const white = new THREE.Color(1, 1, 1);
    const p = new THREE.Vector3();

    for (const o of objects) {
        const style = DEEP_SKY_STYLE[o.kind];
        const art = ARTISTIC[o.kind];
        // named landmarks are a touch quieter now that the whole disk is populated
        if (drawCores) cores.add(o.position, new THREE.Color(style.color).convertSRGBToLinear(), style.size * 0.5, 0.58);
        if (!art) continue;
        const wisps = Math.max(1, Math.round(art.wisps * amount));
        // the first tint of each kind rotates, so the filler is not all one pink
        const offset = Math.floor(random() * art.tints.length);
        for (let i = 0; i < wisps; i++) {
            p.set(normal(), normal() * 0.6, normal()).multiplyScalar(art.spread).add(o.position);
            color.set(art.tints[(i + offset) % art.tints.length]).convertSRGBToLinear();
            halos.add(i === 0 ? o.position : p, color, between(art.size) * (0.7 + 0.3 * amount), between(art.alpha) * (0.5 + 0.5 * amount) * ART_BRIGHTNESS);
        }
        if (art.ring) rings.add(o.position, new THREE.Color(style.color).convertSRGBToLinear(), art.ring * (0.7 + 0.3 * amount), 0.42 * Math.pow(amount, 1.6) * ART_BRIGHTNESS);
        const memberCount = Math.round((art.members || 0) * amount);
        for (let i = 0; i < memberCount; i++) {
            // globulars crowd to the middle, open clusters stay loose
            const r = art.memberSpread * (o.kind === "globular" ? Math.pow(random(), 1.8) : 0.35 + 0.65 * random());
            p.set(normal(), normal(), normal()).normalize().multiplyScalar(r).add(o.position);
            color.set(style.color).convertSRGBToLinear().lerp(white, 0.35 + 0.4 * random());
            members.add(p, color, 2.2 + 2.6 * random(), (0.5 + 0.4 * random()) * ART_BRIGHTNESS);
        }
    }

    /*
     * Attenuated, so a landmark shrinks with distance like the galaxy around it
     * instead of taking over the picture when you pull away - but with a floor on
     * screen size, or it shrinks below a pixel and disappears entirely.
     */
    const material = pointsMaterial({ maxSize: 14, minSize: 2.9, nearFade: 0.3, sharpness: 6 });
    // wisps: soft, broken up by noise, and capped so a close pass never fills the screen
    const haloMaterial = pointsMaterial({ maxSize: 64, minSize: haloFloor, nearFade: 0.04, sharpness: 2.4, soft: true, cloud: 0.7 });
    const ringMaterial = pointsMaterial({ maxSize: 40, minSize: 5, nearFade: 0.02, ring: true });
    // member stars only resolve up close; from afar they fold into the core point
    const memberMaterial = pointsMaterial({ maxSize: 6, minSize: 0, nearFade: 0.002, sharpness: 14 });

    const group = new THREE.Group();
    const points = new THREE.Points(cores.geometry(), material);
    for (const [layer, mat, order] of [[halos, haloMaterial, 7], [rings, ringMaterial, 8], [members, memberMaterial, 8]]) {
        const node = new THREE.Points(layer.geometry(), mat);
        node.renderOrder = order;
        node.frustumCulled = false;
        group.add(node);
    }
    points.renderOrder = 8;
    points.frustumCulled = false;
    if (drawCores) group.add(points);
    return { group, points, material, materials: [material, haloMaterial, ringMaterial, memberMaterial] };
}

/*
 * Galaxies are photographs on fixed planes. Two things make that honest here:
 *
 * - The plane does not turn with the camera. Its normal points at the Sun, which is
 *   where the photograph was taken from, so the image shows the tilt we actually
 *   observe (Andromeda's 77 degrees) instead of a disc that always faces you.
 * - The camera cannot get far enough around it to catch it edge-on: the pivot is
 *   clamped inside the Milky Way (PIVOT.radius = 55) while Andromeda sits 420 out,
 *   so every viewpoint is within about 8 degrees of the Sun's line of sight.
 *
 * Deprojecting a photograph to face-on is the other option and it does not work:
 * at 77 degrees it means stretching the minor axis by 1/cos(77) = 4.4x, which
 * smears a 640px image into mush. The tilt stays in the picture instead.
 */
export function skyNorth(direction, pole) {
    return pole.clone().sub(direction.clone().multiplyScalar(pole.dot(direction))).normalize();
}

export function galaxyPhoto(url, size, opacity, direction, pole, rollDeg = 0, manager) {
    const texture = new THREE.TextureLoader(manager).load(url);
    texture.colorSpace = THREE.NoColorSpace;
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
        })
    );
    // the plane's normal faces back along the line of sight, north-up like the photo
    const normal = direction.clone().negate().normalize();
    const up = skyNorth(direction, pole);
    const right = new THREE.Vector3().crossVectors(up, normal).normalize();
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, normal));
    if (rollDeg) mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(rollDeg));
    return mesh;
}

// far-field galaxies get their own arbitrary orientation, since nothing says where
// they should face, and they fade as they turn edge-on because a plane has no depth
export function orientedGalaxyQuad(url, size, opacity, manager) {
    const texture = new THREE.TextureLoader(manager).load(url);
    texture.colorSpace = THREE.NoColorSpace;
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
        })
    );
    mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    return mesh;
}

export function buildGalaxies(galaxies, backgroundImages, baseUrl, pole, manager) {
    const group = new THREE.Group();
    const members = [];
    for (const g of galaxies) {
        const center = truePosition(g.l, g.b, g.display);
        const direction = directionFromSun(g.l, g.b);
        // the galaxy fills part of its frame, so the plane is wider than the galaxy
        const size = (g.size / 1000) * (g.imageScale || 1.5);
        const node = g.image
            ? galaxyPhoto(`${baseUrl}${g.image}`, size, 0.95 * (g.brightness ?? 1), direction, pole, g.roll || 0, manager)
            : glowSprite(new THREE.Color(g.colors ? g.colors[0] : "#ffe3c0"), size * 0.6, 0.32);
        node.position.copy(center);
        node.renderOrder = 9;
        node.userData.baseOpacity = node.material.opacity;
        node.userData.alias = g.alias;
        group.add(node);
        members.push(node);
    }

    const quads = [];
    // 120 of them, at an opacity that keeps them legible. The first pass dimmed the
    // far-field textures to stop one punching through the disk, and overshot: they
    // went from too bright to barely there. The textures stay dim, the quads carry
    // the strength, and the ceiling is still well under the named galaxies'.
    for (let i = 0; i < 120 && backgroundImages.length; i++) {
        const image = backgroundImages[Math.floor(rand() * backgroundImages.length)];
        const quad = orientedGalaxyQuad(baseUrl + image, 40 + rand() * 150, 0.32 + rand() * 0.42, manager);
        const dir = new THREE.Vector3(gauss(), gauss() * 0.7, gauss()).normalize();
        quad.position.copy(dir.multiplyScalar(560 + rand() * 1800));
        quad.renderOrder = 9;
        quad.userData.baseOpacity = quad.material.opacity;
        group.add(quad);
        quads.push(quad);
    }
    return { group, quads, members };
}
