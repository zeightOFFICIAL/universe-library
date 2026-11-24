import * as THREE from "three";

/*
 * Photographs in the sky. Every place with a card photo (static/Images/DeepSky)
 * also hangs its photograph in space at its true position, the way the other
 * galaxies' photographs hang round the Milky Way: added light, so the photo's
 * black sky disappears into ours, with edges that dissolve rather than end.
 *
 * It is drawn to be flown into, not measured, and it bends the rules a little:
 *   - it always faces the camera, upright on screen, so it is never seen edge-on
 *   - it swirls very slightly towards its rim and drifts against its own halo as
 *     the camera moves round it, which gives a flat picture some depth
 *   - a second, larger and blurred copy behind it is the glow that joins it to
 *     the painted cloud around it
 * It comes in as the camera approaches (from 6 to 2.2 times the place's close-up
 * distance) and steps aside when the camera is almost inside it. Textures load
 * only on approach, so the page itself still fetches none of them.
 */
const VERTEX = /* glsl */ `
    uniform vec2 uSize;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        centre.xy += position.xy * uSize;
        gl_Position = projectionMatrix * centre;
    }
`;

const FRAGMENT = /* glsl */ `
    uniform sampler2D uMap;
    uniform float uOpacity;
    uniform float uBias;
    uniform float uSwirl;
    uniform float uEdge;
    uniform vec2 uDrift;
    varying vec2 vUv;
    void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;
        // a slight turn that grows towards the rim, and a drift that the centre resists
        float a = uSwirl * r * r;
        vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * p + uDrift * r;
        vec2 uv = q * 0.5 + 0.5;
        vec3 c = texture2D(uMap, clamp(uv, 0.0, 1.0), uBias).rgb;
        // the photo's own sky is never quite black: lift it out so only the object adds light
        c = max(c - 0.035, 0.0) * 1.04;
        float mask = 1.0 - smoothstep(uEdge, 1.0, r);
        gl_FragColor = vec4(c * mask * uOpacity, 1.0);
    }
`;

function photoMaterial({ bias, swirl, edge }) {
    return new THREE.ShaderMaterial({
        uniforms: {
            uMap: { value: null },
            uSize: { value: new THREE.Vector2(1, 1) },
            uOpacity: { value: 0 },
            uBias: { value: bias },
            uSwirl: { value: swirl },
            uEdge: { value: edge },
            uDrift: { value: new THREE.Vector2() },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        depthTest: false,
    });
}

// how large the photo hangs, against the distance a flight stops at
const SIZE = 0.5;
const HALO = 1.9;
const PEAK = 0.62;

export class SkyPhotos {
    constructor(items, baseUrl) {
        this.group = new THREE.Group();
        this.loader = new THREE.TextureLoader();
        this.photos = items.filter((item) => item.image).map((item) => {
            const main = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), photoMaterial({ bias: 0, swirl: 0.12, edge: 0.55 }));
            const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), photoMaterial({ bias: 4.5, swirl: -0.2, edge: 0.15 }));
            for (const [mesh, order] of [[halo, 5], [main, 6]]) {
                mesh.position.copy(item.position);
                mesh.frustumCulled = false;
                mesh.renderOrder = order;
                mesh.visible = false;
                this.group.add(mesh);
            }
            return { item, main, halo, url: baseUrl + item.image, state: "idle", aspect: 1 };
        });
    }

    load(photo) {
        photo.state = "loading";
        this.loader.load(photo.url, (texture) => {
            texture.colorSpace = THREE.NoColorSpace;
            texture.anisotropy = 4;
            photo.aspect = texture.image.width / Math.max(texture.image.height, 1);
            for (const mesh of [photo.main, photo.halo]) mesh.material.uniforms.uMap.value = texture;
            photo.state = "ready";
        });
    }

    update(camera) {
        const toCamera = new THREE.Vector3();
        for (const photo of this.photos) {
            const { item } = photo;
            const distance = camera.position.distanceTo(item.position);
            if (photo.state === "idle" && distance < item.close * 9) this.load(photo);
            const fade = photo.state === "ready" ? (1 - THREE.MathUtils.smoothstep(distance, item.close * 2.2, item.close * 6)) * THREE.MathUtils.smoothstep(distance, item.close * 0.1, item.close * 0.35) : 0;
            const visible = fade > 0.003;
            photo.main.visible = photo.halo.visible = visible;
            if (!visible) continue;
            // landscape photos keep their shape; the height is what is set
            const height = item.close * SIZE;
            toCamera.subVectors(camera.position, item.position).normalize();
            // against fixed axes, so going round it moves the picture against its halo
            const drift = [toCamera.x * 0.05, toCamera.z * 0.05];
            for (const [mesh, scale, opacity] of [[photo.main, 1, PEAK], [photo.halo, HALO, 0.16]]) {
                const u = mesh.material.uniforms;
                u.uSize.value.set(height * photo.aspect * scale * 0.5, height * scale * 0.5);
                u.uOpacity.value = opacity * fade;
                u.uDrift.value.set(scale === 1 ? drift[0] : -drift[0] * 0.5, scale === 1 ? drift[1] : -drift[1] * 0.5);
            }
        }
    }
}
