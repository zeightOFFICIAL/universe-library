import * as THREE from "three";
import { mulberry32 } from "./util.js";
import { HERO_LAYER } from "./config.js";

/*
 * The object itself, drawn where it is, for the place you have flown to (owner,
 * 2026-11-26: the photographs were too uneven to carry the close-up, so the map
 * draws the thing instead and the panel points at it).
 *
 * One kind of drawing per kind of place:
 *   star       a limb-darkened disc with moving granulation, a corona and four faint
 *              spikes, coloured by temperature; a system draws each of its stars,
 *              side by side on screen
 *   neutron    a tiny white-blue star with two beams sweeping round, pulsing
 *   blackhole  a shadow, a photon ring, a tilted accretion disk brighter on the side
 *              coming towards us, and the far side of the disk lensed over the top
 *   nebula     a cloud of glowing gas, warped noise, hydrogen-pink with an oxygen-teal
 *              heart and a few young stars
 *   planetary  a glowing ring round a hot white dwarf
 *   remnant    a shell of thin filaments
 *   open / globular   a cluster of stars, as points
 *   cube       a small white cube with a light: a spacecraft, a station, a message
 *
 * Stars, pulsars, black holes and cubes are drawn larger than life (a star's real
 * disc would be a ten-millionth of a pixel), at a size set by how close the camera
 * comes; the panel says so. Nebulae, remnants and clusters are drawn at their real
 * size.
 *
 * Nothing here draws random numbers from the shared generator, so the star field
 * never shifts when a place is opened.
 */

/*
 * The drawn stars' colours (owner, 2026-11-27): a painter's ramp by temperature, not
 * a blackbody's. A real 5,000 K star looks nearly white; here it is plainly amber, so
 * a red supergiant, the Sun and a blue giant can be told apart at a glance. Ember red,
 * amber, gold, cream, ice, blue, violet-blue, interpolated in log temperature.
 */
const ART_RAMP = [
    [2400, [1.0, 0.26, 0.14]],
    [3400, [1.0, 0.42, 0.18]],
    [4500, [1.0, 0.6, 0.24]],
    [5800, [1.0, 0.8, 0.4]],
    [7400, [1.0, 0.94, 0.8]],
    [10000, [0.7, 0.85, 1.0]],
    [20000, [0.46, 0.64, 1.0]],
    [40000, [0.56, 0.48, 1.0]],
];
export function artColor(t) {
    const x = Math.log(THREE.MathUtils.clamp(t || 5800, ART_RAMP[0][0], ART_RAMP[ART_RAMP.length - 1][0]));
    for (let i = 1; i < ART_RAMP.length; i++) {
        const [t1, c1] = ART_RAMP[i];
        if (x > Math.log(t1)) continue;
        const [t0, c0] = ART_RAMP[i - 1];
        const k = (x - Math.log(t0)) / (Math.log(t1) - Math.log(t0));
        return new THREE.Color(c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k);
    }
    return new THREE.Color(...ART_RAMP[ART_RAMP.length - 1][1]);
}

/*
 * How much bigger a star is drawn for its real radius (in Suns). It used to be squeezed
 * into 0.45-1.75 x, so a red supergiant looked like the Sun (owner, 2026-11-27: the
 * big ones must be big - VY Canis Majoris should reach the edges of the view). Dwarfs
 * still shrink gently; above the Sun it grows with the logarithm, a little faster than
 * linearly in it: 10 Suns about 1.8 x, 100 about 2.8 x, 1,400 about 4.2 x, which at the
 * close-up's distance fills most of the screen.
 */
export function starScale(r) {
    const R = Math.max(r || 1, 0.001);
    if (R <= 1) return Math.max(0.5, 1 + 0.25 * Math.log10(R));
    return Math.min(1 + 0.8 * Math.pow(Math.log10(R), 1.2), 4.3);
}

// a blackbody's colour at temperature t (K), scaled so the brightest channel is 1
export function starColor(t) {
    const k = THREE.MathUtils.clamp(t, 1000, 40000) / 100;
    let r;
    let g;
    let b;
    if (k <= 66) {
        r = 255;
        g = 99.47 * Math.log(k) - 161.12;
        b = k <= 19 ? 0 : 138.52 * Math.log(k - 10) - 305.04;
    } else {
        r = 329.7 * Math.pow(k - 60, -0.1332);
        g = 288.12 * Math.pow(k - 60, -0.0755);
        b = 255;
    }
    const c = new THREE.Color(THREE.MathUtils.clamp(r, 0, 255) / 255, THREE.MathUtils.clamp(g, 0, 255) / 255, THREE.MathUtils.clamp(b, 0, 255) / 255);
    const peak = Math.max(c.r, c.g, c.b);
    return c.multiplyScalar(1 / peak);
}

const VERTEX = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

/*
 * A hash with no sin() in it (Dave Hoskins' hash12). The sin-based one lost precision
 * for the large inputs the upper octaves feed it on some GPUs (an Arc laptop among
 * them), and the noise came apart into hard-edged squares across the nebulae
 * (owner's screenshot, 2026-11-26).
 */
const NOISE = /* glsl */ `
    float hash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = p * 2.03 + vec2(1.7, 9.2);
            a *= 0.5;
        }
        return v;
    }
`;

const STAR_FRAGMENT = /* glsl */ `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uDisc;
    // 1 for a star; a spacecraft's small light has no spikes and a short glow
    uniform float uSpikes;
    uniform float uGlow;
    uniform float uOpacity;
    uniform float uSeed;
    varying vec2 vUv;
    ${NOISE}
    void main() {
        float r = length(vUv);
        float d = r / uDisc;
        vec3 col = vec3(0.0);
        if (d < 1.0) {
            float mu = sqrt(1.0 - d * d);
            // limb darkening: the edge of a star is cooler and dimmer than its middle
            float limb = 0.35 + 0.65 * mu;
            vec2 q = vUv / uDisc / (0.4 + 0.6 * mu) * 5.0 + uSeed * 17.0;
            float cells = 0.6 * noise(q + uTime * 0.07) + 0.4 * noise(q * 2.4 - uTime * 0.11);
            // a hot white heart, the star's own colour towards the limb
            col = mix(uColor, vec3(1.0), 0.16 * mu * mu) * limb * (0.74 + 0.5 * cells) * 1.12;
        }
        float out_ = max(d - 1.0, 0.0);
        // the corona and the glow of the light scattered in the eye: stars glow (owner, 2026-11-27)
        float glow = (0.95 * exp(-out_ * 2.4) + 0.26 * exp(-out_ * 0.55)) * uGlow;
        float a = atan(vUv.y, vUv.x) + 0.35;
        float spikes = pow(abs(cos(a * 2.0)), 600.0) * exp(-out_ * 0.6) * 0.4 * uSpikes;
        col += uColor * (glow + spikes) * smoothstep(0.96, 1.04, d);
        col *= 1.0 - smoothstep(0.82, 1.0, r);
        // the disc is solid: nothing behind it shows through (premultiplied, see material())
        float solid = 1.0 - smoothstep(0.97, 1.0, d);
        gl_FragColor = vec4(col * uOpacity, solid * uOpacity);
    }
`;

const NEUTRON_FRAGMENT = /* glsl */ `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uDisc;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
        float r = length(vUv);
        float d = r / uDisc;
        vec3 col = vec3(0.0);
        if (d < 1.0) col = mix(uColor, vec3(1.0), 0.6) * (0.5 + 0.5 * sqrt(1.0 - d * d)) * 4.0;
        float out_ = max(d - 1.0, 0.0);
        col += uColor * (1.2 * exp(-out_ * 1.6) + 0.18 * exp(-out_ * 0.3)) * smoothstep(0.96, 1.04, d);
        // two beams from the magnetic poles, sweeping round as the star spins
        float spin = uTime * 3.2;
        float axis = 1.1 + 0.55 * sin(spin);
        vec2 dir = vec2(cos(axis), sin(axis));
        float along = dot(vUv, dir);
        float across = abs(dot(vUv, vec2(-dir.y, dir.x)));
        float width = 0.015 + 0.16 * abs(along);
        float beam = exp(-pow(across / width, 2.0)) * smoothstep(uDisc, uDisc * 2.0, abs(along)) * (1.0 - smoothstep(0.3, 0.95, abs(along)));
        // a flash each time a beam sweeps across us
        float flash = pow(max(cos(spin), 0.0), 24.0);
        col += mix(uColor, vec3(1.0), 0.3) * beam * (0.55 + 1.4 * flash);
        col += uColor * flash * exp(-out_ * 0.9) * 0.8;
        col *= 1.0 - smoothstep(0.85, 1.0, r);
        float solid = max(1.0 - smoothstep(0.95, 1.0, d), min(beam * 0.7, 0.7));
        gl_FragColor = vec4(col * uOpacity, solid * uOpacity);
    }
`;

const BLACKHOLE_FRAGMENT = /* glsl */ `
    uniform float uTime;
    uniform float uDisc;
    uniform float uOpacity;
    // the disk's tilt as seen now (Hero.update): its axis's angle on screen, how open
    // the disk is (0 edge-on, 1 face-on), and which face is towards us
    uniform float uAngle;
    uniform float uSquash;
    uniform float uFlip;
    varying vec2 vUv;
    ${NOISE}
    void main() {
        float ca = cos(uAngle);
        float sa = sin(uAngle);
        vec2 p = vec2(vUv.x * ca - vUv.y * sa, (vUv.x * sa + vUv.y * ca) * uFlip);
        float s = uDisc;
        float r = length(p);
        // the accretion disk, seen at a slant
        vec2 e = vec2(p.x, p.y / uSquash);
        float re = length(e);
        float inner = 1.9 * s;
        float outer = 4.6 * s;
        float band = smoothstep(inner, inner * 1.12, re) * (1.0 - smoothstep(outer * 0.62, outer, re));
        float swirl = noise(vec2(atan(e.y, e.x) * 4.0 - uTime * 0.9 + re / s * 1.7, re / s * 3.0));
        // the side coming towards us is brighter (Doppler beaming)
        float beaming = 1.0 + 0.75 * p.x / max(re, 0.0001);
        // painted, not measured: a gold-white inner disk, a deep orange rim
        vec3 hot = vec3(1.0, 0.86, 0.62);
        vec3 warm = vec3(1.0, 0.36, 0.1);
        vec3 disk = mix(warm, hot, 1.0 - smoothstep(inner, outer, re)) * band * beaming * (0.55 + 0.75 * swirl) * 2.4;
        // the far side of the disk, bent by gravity over the top and under the bottom
        float lensR = 1.45 * s;
        float lens = exp(-pow((r - lensR) / (0.16 * s), 2.0)) * (0.35 + 0.65 * smoothstep(-0.2, 0.9, p.y / max(r, 0.0001)));
        // the lensed arc leans violet, so it reads apart from the disk in front
        vec3 lensed = mix(mix(warm, hot, 0.6), vec3(0.78, 0.52, 1.0), 0.35) * lens * (0.7 + 0.5 * swirl) * 1.9;
        // the photon ring: light that has gone round the hole
        float ring = exp(-pow((r - 1.08 * s) / (0.035 * s), 2.0)) * 2.2;
        float shadow = 1.0 - smoothstep(s * 0.97, s * 1.03, r);
        // behind the hole: the far half of the disk, the lensed arc and the ring
        vec3 back = (p.y > 0.0 ? disk : vec3(0.0)) + lensed + hot * ring;
        back *= 1.0 - shadow;
        vec3 front = p.y <= 0.0 ? disk : vec3(0.0);
        float glow = 0.12 * exp(-max(r - s, 0.0) / s * 0.9);
        vec3 col = back + front + warm * glow;
        col *= 1.0 - smoothstep(0.85, 1.0, r);
        // premultiplied: light added, and the shadow takes away what is behind it
        // the shadow and the disk both hide what is behind them; the lensed light is added
        float cover = max(shadow, min(band * 1.4, 1.0) * 0.95) * (1.0 - smoothstep(0.85, 1.0, r));
        gl_FragColor = vec4(col * uOpacity, cover * uOpacity);
    }
`;

const NEBULA_FRAGMENT = /* glsl */ `
    uniform float uTime;
    uniform float uOpacity;
    uniform float uSeed;
    uniform float uShape;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying vec2 vUv;
    ${NOISE}
    void main() {
        vec2 p = vUv;
        float r = length(p);
        vec2 o = vec2(uSeed * 31.0, uSeed * 17.0);
        // warped noise: the warp is what turns blobs into wisps
        vec2 w = vec2(fbm(p * 2.2 + o), fbm(p * 2.2 + o + 5.3));
        float n = fbm(p * 3.0 + w * 1.6 + o + uTime * 0.004);
        float body;
        vec3 col;
        if (uShape < 0.5) {
            // an emission nebula: a lumpy cloud, pink hydrogen round a teal oxygen heart
            float edge = 0.78 + 0.28 * (w.x - 0.5);
            body = smoothstep(edge, edge * 0.3, r) * smoothstep(0.32, 0.72, n);
            float heart = smoothstep(0.55, 0.0, r + 0.25 * (n - 0.5));
            col = mix(uColorA, uColorB, heart * 0.75) * body * 1.6;
            // dark lanes of dust across it
            float lanes = smoothstep(0.48, 0.62, fbm(p * 4.5 + o * 1.3 + w));
            col *= 1.0 - 0.75 * lanes * smoothstep(0.9, 0.2, r);
        } else if (uShape < 1.5) {
            // a planetary nebula: a ring of shed gas round the dying star
            float ring = exp(-pow((r - 0.44 - 0.05 * (n - 0.5)) / 0.07, 2.0));
            float inner = smoothstep(0.42, 0.05, r) * 0.28;
            float halo = exp(-pow((r - 0.62) / 0.12, 2.0)) * 0.12;
            body = ring * (0.55 + 0.9 * n) + inner + halo * n;
            col = mix(uColorB, uColorA, smoothstep(0.36, 0.5, r)) * body * 1.5;
        } else {
            // a supernova remnant: a shell of thin, broken filaments
            float shell = exp(-pow((r - 0.62 - 0.1 * (w.y - 0.5)) / 0.16, 2.0));
            float filaments = pow(1.0 - abs(2.0 * fbm(p * 6.0 + w * 2.0 + o) - 1.0), 6.0);
            body = shell * filaments * 2.2 + smoothstep(0.6, 0.0, r) * 0.08;
            col = mix(uColorA, uColorB, smoothstep(0.2, 0.8, n)) * body * 1.4;
        }
        col *= 1.0 - smoothstep(0.86, 1.0, r);
        // bright gas hides the stars behind it; faint wisps stay see-through
        float solid = smoothstep(0.05, 0.6, max(col.r, max(col.g, col.b)));
        gl_FragColor = vec4(col * uOpacity, solid * uOpacity);
    }
`;

/*
 * A photograph of the place, for what is too complex to draw well (owner, 2026-11-26):
 * nebulae, planetary nebulae and remnants with a picture on disk. Cropped to a square
 * and shown as it is, inside a soft round vignette (owner, 2026-11-27: not keyed into
 * the galaxy any more - the dark-sky-to-transparent trick ate the faint gas). The
 * picture is solid; only the vignette lets the galaxy back in at the edge.
 */
const PHOTO_FRAGMENT = /* glsl */ `
    uniform sampler2D uMap;
    uniform float uAspect;
    uniform float uOpacity;
    uniform float uReady;
    varying vec2 vUv;
    void main() {
        vec2 crop = uAspect > 1.0 ? vec2(1.0 / uAspect, 1.0) : vec2(1.0, uAspect);
        vec2 uv = 0.5 + vUv * 0.5 * crop;
        vec3 col = texture2D(uMap, uv).rgb;
        float r = length(vUv);
        float vignette = 1.0 - smoothstep(0.5, 0.98, r);
        float fade = vignette * vignette * uOpacity * uReady;
        // premultiplied: the picture covers what is behind it, as much as the vignette lets it
        gl_FragColor = vec4(col * fade, fade);
    }
`;

const POINT_VERTEX = /* glsl */ `
    attribute float aSize;
    attribute float aPhase;
    uniform float uTime;
    uniform float uPixel;
    varying vec3 vColor;
    void main() {
        vColor = color * (0.85 + 0.15 * sin(uTime * (1.3 + aPhase) + aPhase * 30.0));
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixel;
        gl_Position = projectionMatrix * mv;
    }
`;

const POINT_FRAGMENT = /* glsl */ `
    uniform float uOpacity;
    varying vec3 vColor;
    void main() {
        float r2 = dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5) * 4.0;
        if (r2 >= 1.0) discard;
        float a = exp(-r2 * 6.0) * (1.0 - r2);
        gl_FragColor = vec4(vColor * a * uOpacity * 1.8, min(a * 1.6, 1.0) * uOpacity);
    }
`;

const QUAD = new THREE.PlaneGeometry(2, 2);
const PHOTO_LOADER = new THREE.TextureLoader();
// the kinds drawn from a photograph when there is one (the rest are drawn)
export const PHOTO_KINDS = new Set(["nebula", "planetary", "remnant"]);
const VIEW = new THREE.Vector3();
const UP = new THREE.Vector3();

export class Hero {
    // where the place photographs are served from (the view sets it from the page)
    static imageBase = "";

    constructor() {
        this.group = new THREE.Group();
        this.group.visible = false;
        this.group.renderOrder = 12;
        this.item = null;
        this.billboards = [];
        this.materials = [];
        this.fade = 0;
        this.right = new THREE.Vector3();
    }

    /*
     * Premultiplied alpha for every drawing (owner, 2026-11-26: the drawn objects
     * were see-through). A shader returns its light in rgb and how much of what is
     * behind it it hides in alpha: a star's disc, a black hole's shadow and disk, the
     * bright parts of a cloud hide the sky; glows and coronas, with alpha 0, are
     * still added light.
     */
    material(fragmentShader, uniforms) {
        const m = new THREE.ShaderMaterial({
            vertexShader: VERTEX,
            fragmentShader,
            uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, ...uniforms },
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.CustomBlending,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
        });
        this.materials.push(m);
        return m;
    }

    billboard(material, halfSize, offset = 0) {
        const mesh = new THREE.Mesh(QUAD, material);
        mesh.scale.setScalar(halfSize);
        mesh.frustumCulled = false;
        mesh.renderOrder = 12;
        mesh.userData.offset = offset;
        this.group.add(mesh);
        this.billboards.push(mesh);
        return mesh;
    }

    star(color, disc, offset, seed, { spikes = 1, glow = 1 } = {}) {
        // the quad reaches out to the corona's faint edge: 9 star radii
        const half = disc * 9;
        this.billboard(this.material(STAR_FRAGMENT, { uColor: { value: color }, uDisc: { value: 1 / 9 }, uSeed: { value: seed }, uSpikes: { value: spikes }, uGlow: { value: glow } }), half, offset);
    }

    points(count, place, size) {
        const random = mulberry32(Math.round(size * 1e5) + count);
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const phases = new Float32Array(count);
        const p = new THREE.Vector3();
        const c = new THREE.Color();
        for (let i = 0; i < count; i++) {
            const { brightness } = place(random, p, c);
            positions.set([p.x, p.y, p.z], i * 3);
            colors.set([c.r, c.g, c.b], i * 3);
            sizes[i] = 2.2 + 5.5 * brightness;
            phases[i] = random();
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
        const material = new THREE.ShaderMaterial({
            vertexShader: POINT_VERTEX,
            fragmentShader: POINT_FRAGMENT,
            uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPixel: { value: 1 } },
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.CustomBlending,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
        });
        this.materials.push(material);
        const cloud = new THREE.Points(geometry, material);
        cloud.frustumCulled = false;
        cloud.renderOrder = 12;
        this.group.add(cloud);
    }

    /*
     * item.hero: { type, size (world units: drawn radius for a star, real radius for
     * a cloud or cluster), stars: [{ t, r }], color, seed }
     */
    show(item) {
        this.hide();
        const hero = item.hero;
        if (!hero) return;
        this.item = item;
        this.group.position.copy(item.position);
        const seed = hero.seed ?? 0.37;
        const size = hero.size;
        this.photo = false;
        if (PHOTO_KINDS.has(hero.type) && (item.image || item.warm) && !item.noPhoto) {
            this.photo = true;
            const material = this.material(PHOTO_FRAGMENT, { uMap: { value: null }, uAspect: { value: 1 }, uReady: { value: 0 } });
            this.billboard(material, size * 1.2);
            if (item.warm) return this.finishShow();
            PHOTO_LOADER.load(
                `${Hero.imageBase}${item.image}`,
                (texture) => {
                    if (this.item !== item) return texture.dispose();
                    texture.colorSpace = THREE.SRGBColorSpace;
                    material.uniforms.uMap.value = texture;
                    material.uniforms.uAspect.value = texture.image.width / texture.image.height;
                    material.uniforms.uReady.value = 1;
                    this.fade = 0;
                    this.texture = texture;
                },
                undefined,
                // no picture after all: draw it instead
                () => this.item === item && this.show({ ...item, noPhoto: true })
            );
            return this.finishShow();
        }
        if (hero.type === "star") {
            const stars = hero.stars?.length ? hero.stars : [{ t: hero.t ?? 5600, r: 1 }];
            // drawn bigger for a bigger star: a supergiant fills the view (starScale)
            const discs = stars.map((s) => size * starScale(s.r));
            let x = 0;
            const offsets = discs.map((d, i) => {
                if (i === 0) return 0;
                x += discs[i - 1] * 2.6 + d * 2.6;
                return x;
            });
            const shift = offsets[offsets.length - 1] / 2;
            stars.forEach((s, i) => {
                const color = hero.color ? new THREE.Color(hero.color).lerp(artColor(s.t), 0.5) : artColor(s.t);
                this.star(color, discs[i], offsets[i] - shift, seed + i * 0.31);
            });
        } else if (hero.type === "neutron") {
            this.billboard(this.material(NEUTRON_FRAGMENT, { uColor: { value: new THREE.Color(hero.color || "#7fe7ff") }, uDisc: { value: 0.045 } }), size * 10);
        } else if (hero.type === "blackhole") {
            const mesh = this.billboard(
                this.material(BLACKHOLE_FRAGMENT, { uDisc: { value: 0.18 }, uAngle: { value: 0 }, uSquash: { value: 0.26 }, uFlip: { value: 1 } }),
                size / 0.18
            );
            // the disk's axis: near the galaxy's own, leaning a little by the seed
            const a = seed * Math.PI * 2;
            mesh.userData.axis = new THREE.Vector3(0.35 * Math.sin(a), 1, 0.35 * Math.cos(a)).normalize();
            const m = this.materials[this.materials.length - 1];
            m.blendSrc = THREE.OneFactor;
            m.blendDst = THREE.OneMinusSrcAlphaFactor;
        } else if (hero.type === "nebula" || hero.type === "planetary" || hero.type === "remnant") {
            const shape = { nebula: 0, planetary: 1, remnant: 2 }[hero.type];
            const pink = new THREE.Color(1.0, 0.3, 0.5);
            const teal = new THREE.Color(0.35, 0.9, 0.85);
            const amber = new THREE.Color(1.0, 0.55, 0.3);
            const colorA = hero.type === "remnant" ? amber.clone().lerp(pink, 0.5) : pink;
            const colorB = hero.type === "remnant" ? new THREE.Color(0.55, 0.75, 1.0) : teal;
            this.billboard(this.material(NEBULA_FRAGMENT, { uShape: { value: shape }, uSeed: { value: seed }, uColorA: { value: colorA }, uColorB: { value: colorB } }), size);
            if (hero.type === "planetary") this.star(new THREE.Color(0.85, 0.9, 1.0), size * 0.035, 0, seed);
            if (hero.type === "nebula") {
                // the young stars the gas is lighting up
                this.points(14, (random, p, c) => {
                    const a = random() * Math.PI * 2;
                    const d = Math.pow(random(), 1.5) * size * 0.45;
                    p.set(Math.cos(a) * d, (random() - 0.5) * size * 0.2, Math.sin(a) * d);
                    c.setRGB(0.75, 0.85, 1.0);
                    return { brightness: 0.4 + 0.6 * random() };
                }, size);
            }
        } else if (hero.type === "globular" || hero.type === "open") {
            const globular = hero.type === "globular";
            this.points(globular ? 3400 : 160, (random, p, c) => {
                if (globular) {
                    // a Plummer sphere: dense heart, long thin outskirts
                    const u = Math.max(random(), 1e-3);
                    const radius = (size * 0.3) / Math.sqrt(Math.pow(u, -2 / 3) - 1 + 1e-6);
                    const v = random() * 2 - 1;
                    const a = random() * Math.PI * 2;
                    const s = Math.sqrt(1 - v * v);
                    p.set(Math.cos(a) * s, v, Math.sin(a) * s).multiplyScalar(Math.min(radius, size * 1.4));
                    const giant = random() < 0.06;
                    c.setRGB(1.0, giant ? 0.55 : 0.8, giant ? 0.25 : 0.5);
                    if (random() < 0.03) c.setRGB(0.55, 0.72, 1.0);
                    return { brightness: giant ? 0.6 + 0.4 * random() : 0.12 + 0.2 * random() };
                }
                p.set((random() - 0.5) * 2, (random() - 0.5) * 1.2, (random() - 0.5) * 2).multiplyScalar(size * Math.pow(random(), 0.6));
                const hot = random() < 0.75;
                c.setRGB(hot ? 0.55 : 1.0, hot ? 0.74 : 0.62, hot ? 1.0 : 0.3);
                return { brightness: Math.pow(random(), 2.2) };
            }, size);
        } else {
            // a spacecraft, a station, a message: a small cube with a light on it
            const color = new THREE.Color(hero.color || "#ffffff");
            const cube = new THREE.LineSegments(
                // a unit cube scaled down: EdgesGeometry merges corners to 4 decimals, so a
                // cube built at its real size (a few 1e-7 units) collapsed to nothing
                new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
                new THREE.LineBasicMaterial({ color: color.clone().multiplyScalar(1.6), transparent: true, opacity: 0, depthTest: false, depthWrite: false })
            );
            cube.scale.setScalar(size);
            cube.frustumCulled = false;
            cube.renderOrder = 12;
            cube.userData.spin = true;
            this.materials.push(cube.material);
            this.group.add(cube);
            // a small light on it, not a star: no spikes, a short glow (owner, 2026-11-27:
            // with the stars' spikes the Voyagers looked like pulsars)
            this.star(color, size * 0.08, 0, seed, { spikes: 0, glow: 0.25 });
        }
        this.finishShow();
    }

    finishShow() {
        this.fade = 0;
        this.group.visible = true;
        // drawn in its own pass, after the soft layers (config.HERO_LAYER)
        this.group.traverse((node) => node.layers.set(HERO_LAYER));
    }

    hide() {
        for (const child of [...this.group.children]) {
            this.group.remove(child);
            if (child.geometry !== QUAD) child.geometry?.dispose();
        }
        for (const m of this.materials) m.dispose();
        this.materials = [];
        this.texture?.dispose();
        this.texture = null;
        this.photo = false;
        this.billboards = [];
        this.group.visible = false;
        this.item = null;
    }

    /*
     * Billboards face the camera; stars of one system stand side by side on screen.
     * A black hole's disk keeps its own axis in space, so turning round it (the right
     * button, while it is open) shows the disk open up, close to a line and flip.
     */
    update(camera, now, dt, pixelScale) {
        if (!this.group.visible) return;
        this.fade = Math.min(1, this.fade + dt / 0.7);
        const opacity = this.fade * this.fade * (3 - 2 * this.fade);
        this.right.setFromMatrixColumn(camera.matrixWorld, 0);
        for (const mesh of this.billboards) {
            mesh.quaternion.copy(camera.quaternion);
            mesh.position.copy(this.right).multiplyScalar(mesh.userData.offset);
            const axis = mesh.userData.axis;
            if (axis) {
                const u = mesh.material.uniforms;
                const view = VIEW.copy(camera.position).sub(this.group.position).normalize();
                const c = axis.dot(view);
                UP.setFromMatrixColumn(camera.matrixWorld, 1);
                u.uAngle.value = Math.atan2(axis.dot(this.right), axis.dot(UP));
                u.uSquash.value = 0.1 + 0.8 * Math.pow(Math.abs(c), 1.3);
                u.uFlip.value = c < 0 ? -1 : 1;
            }
        }
        const time = (now / 1000) % 3600;
        for (const m of this.materials) {
            if (m.uniforms) {
                m.uniforms.uTime.value = time;
                m.uniforms.uOpacity.value = opacity;
                if (m.uniforms.uPixel) m.uniforms.uPixel.value = pixelScale;
            } else {
                m.opacity = opacity * 0.85;
            }
        }
        for (const child of this.group.children) {
            if (child.userData.spin) {
                child.rotation.x += dt * 0.35;
                child.rotation.y += dt * 0.5;
            }
        }
    }
}
