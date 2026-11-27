import * as THREE from "three";
import { BACKDROP, SOFT_LAYER, GALAXY_TINT, DUST_COLOR_GLSL } from "./config.js";
import { rand, smoothstep } from "./util.js";

/* ---------- the backdrop, as a stack of slices ---------- */

// the transform that puts the artwork into the galaxy plane; star sampling uses the
// same matrix, so stars land exactly on the features they were sampled from
export const BACKDROP_MATRIX = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(-Math.PI / 2, 0, BACKDROP.rotation, "XYZ")
);

export const BACKDROP_VERTEX = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

/*
 * The artwork sits on black and is blended additively, so its background keys out
 * for free - no alpha channel needed. uEdge trims the plane's corners, uOpacity
 * carries the fades.
 *
 * uBias picks a coarser mip level for the slices away from the mid-plane. Without
 * it the stack is a row of identical sharp copies, and the repeated edges read as
 * colour fringing; blurring them turns the stack into haze around one sharp plane.
 */
// a 1x1 stand-in, so the sampler is always bound even before the map exists
export const EMPTY_DUST = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
EMPTY_DUST.needsUpdate = true;

export const BACKDROP_FRAGMENT = /* glsl */ `
    uniform sampler2D uMap;
    uniform float uOpacity;
    uniform vec3 uTint;
    uniform float uBias;
    uniform float uCoreFade;
    uniform float uTear;
    uniform float uNoiseScale;
    uniform vec2 uNoiseOffset;
    uniform sampler2D uDust;
    uniform float uDustStrength;
    uniform float uPlaneLane;
    varying vec2 vUv;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float valueNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
        vec3 c = texture2D(uMap, vUv, uBias).rgb;
        float radius = length(vUv - 0.5);
        float edge = 1.0 - smoothstep(0.34, 0.5, radius);
        /*
         * The artwork paints a bulge and we build one in 3D, so up close the two
         * stack and blow the centre out. Fade the painted one away as the camera
         * approaches and let the real geometry carry it; the outer disk stays.
         */
        float coreMask = 1.0 - smoothstep(0.04, 0.2, radius);

        /*
         * The tear mask is what makes a stack of copies work. Identical sheets offset
         * in depth ghost against each other and read as colour fringing; breaking each
         * off-plane sheet into patches with its own noise turns the same stack into
         * something the eye accepts as depth. uTear is 0 on the mid-plane, so that one
         * stays whole, and rises for the sheets further out.
         */
        float torn = valueNoise(vUv * uNoiseScale + uNoiseOffset);
        torn = mix(torn, valueNoise(vUv * uNoiseScale * 2.7 + uNoiseOffset.yx), 0.4);
        float tearMask = uTear <= 0.001 ? 1.0 : smoothstep(uTear - 0.22, uTear + 0.22, torn);

        /*
         * The dust lanes, deepened.
         *
         * Extinguishing stars could never draw a lane here, and it took measuring to
         * see why: in a tilted view almost none of the light in a lane comes from the
         * star field. It comes from this painting. The stars are sampled from the
         * same image, so they are already absent where it is dark - dimming the few
         * that remain changed the frame by one and a half percent. Additive light
         * cannot be hidden by anything drawn on top of it either; it can only not be
         * emitted. So the lanes are taken out of the artwork itself, at the same
         * places the star field reads them from, and with the same extinction law:
         * blue goes first, which is why a dust lane is brown and not grey.
         */
        float dustHere = texture2D(uDust, vUv).r;
        float dust = dustHere * uDustStrength;

        /*
         * The edge-on lane, and it has to live here for the same reason the arm
         * lanes do. Seen along the plane, the bright band is mostly this painting,
         * not the star field - so extinguishing stars dimmed the halo above and
         * below while leaving the band itself alone, which is the exact opposite of
         * a dust lane. Measured, the mid-plane came out *less* obscured than the
         * wings at every strength.
         *
         * uPlaneLane is per sheet: full on the mid-plane sheet, which is where the
         * dust is, and almost nothing on the ones a kiloparsec above and below it,
         * which are in front of and behind the lane rather than behind it. The
         * artwork's own lanes modulate it, so the band is eaten unevenly along its
         * length the way a real one is, instead of being crossed by a clean bar.
         */
        float lane = uPlaneLane * (0.52 + 0.78 * dustHere);

        /*
         * Beer's law, not a linear subtraction, and the difference only shows at the
         * dense end. Taking 1 - dust per channel clips: once the strength passes
         * ~0.76 the blue channel hits zero and the lane stops getting redder as it
         * gets darker - it flattens into a colourless hole, and raising the dust
         * further does nothing but spread that hole. An exponential has no floor to
         * hit, so a lane keeps reddening all the way down and the two absorbers -
         * the arm dust and the edge-on lane - simply add their optical depths, which
         * is what two absorbers in series actually do.
         */
        /*
         * Populations by radius, as the stars have them (2026-11-28; starfield.js):
         * the old inner disk yellow-white, the young outer arms bluer. From afar most
         * of the light is this painting, so without it here the shift did not show.
         * Brightness is kept: each pixel leans towards the colour at its own peak.
         */
        float kly = radius * ${BACKDROP.size.toFixed(1)};
        float peak = max(c.r, max(c.g, c.b));
        c = mix(c, vec3(1.0, 0.84, 0.6) * peak, 0.36 * smoothstep(4.0, 7.0, kly) * (1.0 - smoothstep(11.0, 22.0, kly)));
        c = mix(c, vec3(0.58, 0.74, 1.0) * peak, 0.3 * smoothstep(20.0, 38.0, kly));
        c *= uTint;
        float tau = dust + lane;
        c *= exp(-tau * ${DUST_COLOR_GLSL});

        gl_FragColor = vec4(c * uOpacity * edge * tearMask * (1.0 - uCoreFade * coreMask * 0.93), 1.0);
    }
`;

export function buildBackdropVolume(texture) {
    const group = new THREE.Group();
    group.matrixAutoUpdate = false;
    group.matrix.copy(BACKDROP_MATRIX);
    group.matrixWorldNeedsUpdate = true;

    const geometry = new THREE.PlaneGeometry(BACKDROP.size, BACKDROP.size);
    const materials = [];
    const half = (BACKDROP.slices - 1) / 2;
    let total = 0;
    const weights = [];
    for (let i = 0; i < BACKDROP.slices; i++) {
        const t = (i - half) / Math.max(half, 1); // -1 .. 1
        const w = Math.exp(-(t * t) * 2.2);
        weights.push(w);
        total += w;
    }
    for (let i = 0; i < BACKDROP.slices; i++) {
        const t = (i - half) / Math.max(half, 1);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uMap: { value: texture },
                uOpacity: { value: 0 },
                uTint: { value: GALAXY_TINT },
                uCoreFade: { value: 0 },
                // mid-plane stays sharp, outer slices blur out into haze
                uBias: { value: Math.pow(Math.abs(t), 0.75) * BACKDROP.blur },
                // and they are torn into patches, harder the further out they sit
                uTear: { value: Math.pow(Math.abs(t), 0.8) * BACKDROP.tear },
                uNoiseScale: { value: 3.5 + rand() * 4.5 },
                uNoiseOffset: { value: new THREE.Vector2(rand() * 40, rand() * 40) },
                // filled in once the star field has read the lanes out of the image
                uDust: { value: EMPTY_DUST },
                uDustStrength: { value: 0 },
                uPlaneLane: { value: 0 },
            },
            vertexShader: BACKDROP_VERTEX,
            fragmentShader: BACKDROP_FRAGMENT,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
        });
        material.userData.weight = weights[i] / total;
        material.userData.offset = t;
        // the dust lane is thin: the mid-plane sheet is inside it, the others are not
        material.userData.inLane = Math.exp(-(t * t) / (2 * 0.4 * 0.4));
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = t * BACKDROP.halfThickness;
        /*
         * Spin, tilt and scale each sheet a little differently, so no two ever line
         * up edge to edge. The tilt doubles as the disk's warp: the Milky Way's outer
         * disk really does bend up on one side and down on the other.
         */
        mesh.rotation.z = t * BACKDROP.twist;
        mesh.rotation.x = t * BACKDROP.warp;
        const shrink = 1 - 0.08 * Math.pow(Math.abs(t), 1.4);
        mesh.scale.set(shrink, shrink, 1);
        mesh.renderOrder = -1;
        // the mid-plane sheet carries the structure; the others are haze
        if (t !== 0) mesh.layers.set(SOFT_LAYER);
        group.add(mesh);
        materials.push(material);
    }
    return { group, materials };
}
