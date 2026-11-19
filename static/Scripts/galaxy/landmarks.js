import * as THREE from "three";
import { DEEP_SKY_STYLE } from "./config.js";
import { pointsMaterial, glowSprite } from "./shaders.js";
import { rand, gauss, directionFromSun, truePosition, Layer } from "./util.js";

export function buildDeepSky(objects) {
    const layer = new Layer(objects.length);
    // named landmarks are a touch quieter now that the whole disk is populated
    for (const o of objects) layer.add(o.position, new THREE.Color(DEEP_SKY_STYLE[o.kind].color).convertSRGBToLinear(), DEEP_SKY_STYLE[o.kind].size * 0.5, 0.58);
    /*
      * Attenuated, so a nebula shrinks with distance like the galaxy around it
      * instead of taking over the picture when you pull away - but with a floor on
      * screen size, or it shrinks below a pixel and disappears entirely.
      */
    const material = pointsMaterial({ maxSize: 14, minSize: 2.9, nearFade: 0.3, sharpness: 6 });
    const points = new THREE.Points(layer.geometry(), material);
    points.renderOrder = 8;
    points.frustumCulled = false;
    return { points, material };
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
