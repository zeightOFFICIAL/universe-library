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
 * A photo shows only for the place that is open - flown to from a row or a label,
 * its glass panel up - never on the way past (owner, 2026-11-24). It is large (four
 * fifths of the view's height at the arrival distance), a rounded square with a
 * soft vignette over its outer two fifths, and while it is up the view is held
 * (view.holdView): no turning, only small nudges and a little zoom, so the picture
 * is always seen square on. Textures load when a place opens, so the page itself
 * fetches none of them.
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
        // a rounded square rather than a circle: the corners of the picture stay
        vec2 a4 = p * p * p * p;
        float r = pow(a4.x + a4.y, 0.25);
        if (r > 1.0) discard;
        // a slight turn that grows towards the rim, and a drift that the centre resists
        float turn = uSwirl * r * r;
        vec2 q = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * p + uDrift * r;
        vec2 uv = q * 0.5 + 0.5;
        vec3 c = texture2D(uMap, clamp(uv, 0.0, 1.0), uBias).rgb;
        // the photo's own sky is never quite black: lift it out so only the object adds light
        c = max(c - 0.05, 0.0) * 1.06;
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

// how large the photo hangs, against the distance a flight stops at (where the
// view is 0.93 of it tall): two thirds of the height, and never wider than the view
const SIZE = 0.8;
const MAX_WIDTH = 1.05;
const HALO = 1.5;
const PEAK = 0.78;
const SCRATCH = new THREE.Vector3();

export class SkyPhotos {
    constructor(items, baseUrl) {
        this.group = new THREE.Group();
        this.loader = new THREE.TextureLoader();
        // fiction's pictures are framed in the card instead (see view.renderInfo)
        this.photos = items.filter((item) => item.image && !item.fiction).map((item) => {
            const main = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), photoMaterial({ bias: 0, swirl: 0.04, edge: 0.58 }));
            const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), photoMaterial({ bias: 4.5, swirl: -0.12, edge: 0.2 }));
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
            texture.anisotropy = 8;
            photo.aspect = texture.image.width / Math.max(texture.image.height, 1);
            for (const mesh of [photo.main, photo.halo]) mesh.material.uniforms.uMap.value = texture;
            photo.state = "ready";
        });
    }

    /*
     * Only the place that is open (flown to, its panel showing) shows its photo
     * (owner, 2026-11-24: on a click or a jump, never on the way past). It eases in
     * and out rather than switching. Returns how far in it is, 0..1.
     */
    update(camera, focus) {
        let shown = 0;
        for (const photo of this.photos) {
            const { item } = photo;
            const open = Boolean(focus && focus.name === item.name);
            if (open && photo.state === "idle") this.load(photo);
            const distance = camera.position.distanceTo(item.position);
            const want = open && photo.state === "ready" ? (1 - THREE.MathUtils.smoothstep(distance, item.close * 1.8, item.close * 3)) * THREE.MathUtils.smoothstep(distance, item.close * 0.12, item.close * 0.35) : 0;
            photo.level = (photo.level || 0) + (want - (photo.level || 0)) * 0.12;
            if (photo.level < 0.003 && want === 0) {
                photo.level = 0;
                photo.main.visible = photo.halo.visible = false;
                continue;
            }
            photo.main.visible = photo.halo.visible = true;
            shown = Math.max(shown, photo.level);
            // landscape photos keep their shape; the height is what is set, unless too wide
            const height = Math.min(item.close * SIZE, (item.close * MAX_WIDTH) / photo.aspect);
            const toCamera = SCRATCH.subVectors(camera.position, item.position).normalize();
            // against fixed axes, so the small nudges the panel allows shift it against its halo
            const drift = [toCamera.x * 0.025, toCamera.z * 0.025];
            for (const [mesh, scale, opacity] of [[photo.main, 1, PEAK], [photo.halo, HALO, 0.14]]) {
                const u = mesh.material.uniforms;
                u.uSize.value.set(height * photo.aspect * scale * 0.5, height * scale * 0.5);
                u.uOpacity.value = opacity * photo.level;
                u.uDrift.value.set(scale === 1 ? drift[0] : -drift[0] * 0.5, scale === 1 ? drift[1] : -drift[1] * 0.5);
            }
        }
        return shown;
    }
}
