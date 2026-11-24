import * as THREE from "three";
import { DEEP_SKY_STYLE } from "./config.js";
import { pointsMaterial, glowSprite } from "./shaders.js";
import { rand, gauss, mulberry32, directionFromSun, truePosition, Layer } from "./util.js";

/*
 * The named landmarks, drawn to be looked at rather than measured. Positions are
 * exact; the look is not, and it is deliberately bigger than life so a nebula is
 * something you can fly up to. Each object gets:
 *
 *   - a bright core point
 *   - an envelope: one soft glow that is what you see of it from across the galaxy
 *   - detail: offset, differently tinted wisps and a few bright knots, so up close
 *     it has a shape rather than being a round dot
 *   - planetary nebulae and supernova remnants a ring, the shell they are
 *   - clusters, and the young stars inside nebulae, a scatter of member stars
 *
 * Sizes are in world terms: a sprite of size s spans about s * 83 ly (see
 * vWorldSize in shaders.js) until it reaches its on-screen cap. The caps are high,
 * so a nebula keeps growing as the camera closes in; the old 64px cap was what made
 * them look like stickers.
 *
 * Its own seeded generator, so adding a landmark never reshuffles the star field.
 */
// one dial for how loud the painted layer is against the star field
const ART_BRIGHTNESS = 0.78;

const ARTISTIC = {
    nebula: {
        envelope: [2.6, 3.6], envelopeAlpha: [0.05, 0.07],
        wisps: 7, spread: 0.055, size: [1.1, 2.2], alpha: [0.06, 0.1],
        knots: 3, knotSize: [0.35, 0.6], knotAlpha: [0.12, 0.18],
        tints: ["#ff5f86", "#ff9cc4", "#7fb2ff", "#c487ff", "#ff7a5c"],
        members: 9, memberSpread: 0.03, memberTint: "#cfe2ff",
    },
    remnant: {
        envelope: [1.8, 2.4], envelopeAlpha: [0.045, 0.06],
        wisps: 4, spread: 0.035, size: [0.8, 1.4], alpha: [0.06, 0.09],
        knots: 2, knotSize: [0.25, 0.4], knotAlpha: [0.1, 0.15],
        tints: ["#ff9d6b", "#7fd6ff", "#ff6f9a"], ring: 1.7, ringAlpha: 0.5,
    },
    planetary: {
        envelope: [1.0, 1.3], envelopeAlpha: [0.05, 0.065],
        wisps: 2, spread: 0.01, size: [0.5, 0.7], alpha: [0.08, 0.11],
        tints: ["#7de2c3", "#8fb8ff"], ring: 0.85, ringAlpha: 0.55,
    },
    open: {
        envelope: [2.0, 2.6], envelopeAlpha: [0.04, 0.055],
        wisps: 1, spread: 0.01, size: [0.9, 1.2], alpha: [0.04, 0.055],
        tints: ["#9cc4ff"],
        members: 34, memberSpread: 0.04,
    },
    globular: {
        envelope: [1.4, 1.8], envelopeAlpha: [0.06, 0.08],
        wisps: 1, spread: 0, size: [0.6, 0.8], alpha: [0.09, 0.12],
        tints: ["#ffd9a0"],
        members: 80, memberSpread: 0.035,
    },
};

/*
 * options: seed for the generator; amount (0..1) thins the detail and quietens it,
 * for the unnamed filler that covers the rest of the disk; cores false when the
 * caller already draws each object's point; haloFloor is the smallest an envelope
 * may shrink to on screen; sizeScale enlarges everything (the filler is only seen
 * from afar, so it is drawn larger and capped lower); cap is the envelope's largest
 * size on screen, in pixels.
 */
export function buildDeepSky(objects, { seed = 20261123, amount = 1, cores: drawCores = true, haloFloor = 8, sizeScale = 1, cap = 520 } = {}) {
    const random = mulberry32(seed);
    const between = ([lo, hi]) => lo + (hi - lo) * random();
    const normal = () => {
        let u = 0;
        while (u === 0) u = random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
    };
    // the unnamed filler keeps small, quiet member stars: there are two thousand of them
    const filler = amount < 0.9;
    const quiet = (0.45 + 0.55 * amount) * ART_BRIGHTNESS;

    const cores = new Layer(objects.length);
    const envelopes = new Layer(objects.length);
    const details = new Layer(objects.length * 40);
    const rings = new Layer(objects.length);
    const members = new Layer(objects.length * 82);
    const color = new THREE.Color();
    const white = new THREE.Color(1, 1, 1);
    const p = new THREE.Vector3();
    const size = (range) => between(range) * sizeScale;

    for (const o of objects) {
        const style = DEEP_SKY_STYLE[o.kind];
        const art = ARTISTIC[o.kind];
        if (drawCores) cores.add(o.position, new THREE.Color(style.color).convertSRGBToLinear(), style.size * 0.5, 0.62);
        if (!art) continue;
        // the first tint of each kind rotates, so the filler is not all one pink
        const offset = Math.floor(random() * art.tints.length);
        const tint = (i) => color.set(art.tints[(i + offset) % art.tints.length]).convertSRGBToLinear();
        // a per-object stretch, so the wisps of one nebula lean one way
        const lean = new THREE.Vector3(normal(), normal() * 0.4, normal()).normalize();

        envelopes.add(o.position, tint(0), size(art.envelope), between(art.envelopeAlpha) * quiet);
        const wisps = Math.max(1, Math.round(art.wisps * amount));
        for (let i = 0; i < wisps; i++) {
            const along = normal() * art.spread * 0.8;
            p.set(normal(), normal() * 0.5, normal()).multiplyScalar(art.spread * 0.45).addScaledVector(lean, along).add(o.position);
            details.add(i === 0 ? o.position : p, tint(i), size(art.size), between(art.alpha) * quiet);
        }
        const knots = Math.round((art.knots || 0) * amount);
        for (let i = 0; i < knots; i++) {
            p.set(normal(), normal() * 0.5, normal()).multiplyScalar(art.spread * 0.45).add(o.position);
            tint(i + 1).lerp(white, 0.3);
            details.add(p, color, size(art.knotSize), between(art.knotAlpha) * quiet * 0.8);
        }
        if (art.ring) rings.add(o.position, new THREE.Color(style.color).convertSRGBToLinear(), art.ring * sizeScale * (0.7 + 0.3 * amount), art.ringAlpha * Math.pow(amount, 1.6) * ART_BRIGHTNESS);
        const memberCount = Math.round((art.members || 0) * amount * (filler ? 0.5 : 1));
        for (let i = 0; i < memberCount; i++) {
            // globulars crowd to the middle, open clusters and nebulae stay loose
            const r = art.memberSpread * (o.kind === "globular" ? Math.pow(random(), 1.8) : 0.25 + 0.75 * random());
            p.set(normal(), normal(), normal()).normalize().multiplyScalar(r).add(o.position);
            color.set(art.memberTint || style.color).convertSRGBToLinear().lerp(white, 0.3 + 0.45 * random());
            const bright = !filler && random() < 0.15;
            members.add(p, color, filler ? 2.2 + 2.6 * random() : (bright ? 3 + 1.5 * random() : 1.6 + 1.6 * random()), (bright ? 0.85 : 0.55 + 0.35 * random()) * (filler ? 0.6 : 1) * ART_BRIGHTNESS);
            // the brightest members get a small glow of their own, like a photograph's
            if (bright) details.add(p, color, 0.09 * sizeScale, 0.1 * ART_BRIGHTNESS);
        }
    }

    const material = pointsMaterial({ maxSize: 16, minSize: 3, nearFade: 0.3, sharpness: 6 });
    // the envelope: what you see from afar, with a floor so it never vanishes
    const envelopeMaterial = pointsMaterial({ maxSize: cap, minSize: haloFloor, nearFade: 0.02, sharpness: 2.2, soft: true, cloud: 0.75 });
    // detail has no floor: from across the galaxy it folds into the envelope
    const detailMaterial = pointsMaterial({ maxSize: cap * 0.8, minSize: 0, nearFade: 0.01, sharpness: 2.6, soft: true, cloud: 0.85 });
    const ringMaterial = pointsMaterial({ maxSize: cap * 0.7, minSize: 5, nearFade: 0.01, ring: true });
    /*
     * Member stars only resolve up close; from afar they fold into the core point.
     * Kept as small and sharp as the 0.8.2.7 ones (7px, not 13): at 13px the named
     * clusters added twice the light the whole painted layer used to, and read as
     * brighter than the galaxy around them. The spread and count stay.
     */
    const memberMaterial = pointsMaterial(filler ? { maxSize: 6, minSize: 0, nearFade: 0.002, sharpness: 14 } : { maxSize: 7, minSize: 0, nearFade: 0.002, sharpness: 12 });

    const group = new THREE.Group();
    const points = new THREE.Points(cores.geometry(), material);
    for (const [layer, mat, order] of [[envelopes, envelopeMaterial, 7], [details, detailMaterial, 7], [rings, ringMaterial, 8], [members, memberMaterial, 8]]) {
        const node = new THREE.Points(layer.geometry(), mat);
        node.renderOrder = order;
        node.frustumCulled = false;
        group.add(node);
    }
    points.renderOrder = 8;
    points.frustumCulled = false;
    if (drawCores) group.add(points);
    return { group, points, material, materials: [material, envelopeMaterial, detailMaterial, ringMaterial, memberMaterial] };
}

/*
 * The named objects: a black hole is a warm accretion ring, a neutron star a hard
 * cyan point, a star a glow in its own colour, sized loosely by how bright it is.
 * Schematic, like the core's black holes - the real things are far too small to
 * see at any scale the map can show.
 */
const OBJECT_LOOK = {
    blackhole: { color: "#ffad66", size: 0.5, alpha: 0.9, ring: true },
    neutron: { color: "#8ff0ff", size: 0.22, alpha: 0.95 },
    star: { color: "#ffe9a8", size: 0.35, alpha: 0.8 },
};

export function buildStellarObjects(objects) {
    const rings = new Layer(objects.length);
    const glows = new Layer(objects.length * 2);
    for (const o of objects) {
        const look = OBJECT_LOOK[o.kind];
        if (!look) continue;
        // a star's colour from its temperature, roughly: red below 4,000 K, blue above 10,000 K
        const tint = o.kind === "star" && o.temperature ? (o.temperature < 4000 ? "#ffb27a" : o.temperature > 10000 ? "#a9c8ff" : look.color) : look.color;
        const color = new THREE.Color(tint).convertSRGBToLinear();
        const bright = o.luminosity ? 0.7 + 0.15 * Math.log10(o.luminosity) : 1;
        if (look.ring) {
            rings.add(o.position, color, look.size, look.alpha);
            glows.add(o.position, color, look.size * 1.6, 0.12);
        } else {
            glows.add(o.position, color, look.size * bright, look.alpha * 0.5);
            glows.add(o.position, new THREE.Color(1, 1, 1), look.size * 0.18 * bright, look.alpha);
        }
    }
    const ringMaterial = pointsMaterial({ maxSize: 90, minSize: 3, nearFade: 0.002, ring: true });
    const glowMaterial = pointsMaterial({ maxSize: 70, minSize: 2, nearFade: 0.002, sharpness: 5 });
    const group = new THREE.Group();
    for (const [layer, material] of [[glows, glowMaterial], [rings, ringMaterial]]) {
        const node = new THREE.Points(layer.geometry(), material);
        node.renderOrder = 8;
        node.frustumCulled = false;
        group.add(node);
    }
    return { group, materials: [ringMaterial, glowMaterial] };
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
