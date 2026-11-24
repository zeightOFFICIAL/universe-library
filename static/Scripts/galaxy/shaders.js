import * as THREE from "three";
import { rand, smoothstep } from "./util.js";
import { DUST } from "./dust.js";
import { DUST_COLOR, DUST_COLOR_GLSL } from "./config.js";

/*
 * A small tiling noise texture for the haze. The wisps used to be computed in the
 * fragment shader - two octaves of value noise, eight sines a pixel - which cost
 * more than the haze itself. Two fetches from this do the same job.
 */
export function noiseTexture(size = 128, cells = 16) {
    const lattice = new Float32Array(cells * cells);
    for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
    const data = new Uint8Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const gx = (x / size) * cells;
            const gy = (y / size) * cells;
            const ix = Math.floor(gx);
            const iy = Math.floor(gy);
            const fx = gx - ix;
            const fy = gy - iy;
            const ux = fx * fx * (3 - 2 * fx);
            const uy = fy * fy * (3 - 2 * fy);
            // wrapped, so the texture tiles without a seam
            const at = (cx, cy) => lattice[(cy % cells) * cells + (cx % cells)];
            const value =
                (at(ix, iy) * (1 - ux) + at(ix + 1, iy) * ux) * (1 - uy) + (at(ix, iy + 1) * (1 - ux) + at(ix + 1, iy + 1) * ux) * uy;
            data[y * size + x] = Math.round(value * 255);
        }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
}

/*
 * The dust lane's maths, shared by the vertex shader (stars, one column each) and the
 * fragment shader (soft sprites, one column per pixel).
 *
 * The dust is a gaussian slab about the plane, inside a cylinder the size of the
 * disk. Two things have to be right for a lane to appear where it should:
 *
 * - The mean density between two heights has a closed form - the difference of two
 *   error functions over the height difference - and it must be written as that
 *   ratio, because along the plane both go to zero together and the ratio keeps the
 *   limit that a clamped direction cosine throws away.
 * - The sight line has to be clipped to the disk. Using the whole camera-to-star
 *   distance with a cutoff at the midpoint, as this did at first, gives a far-side
 *   star far too much dust and a near-side one none at all: seen from outside, the
 *   near half of the disk shone straight through and filled the lane back in.
 */
export const LANE_GLSL = /* glsl */ `
    // erf(x) ~ tanh(1.2x), built from exp because GLSL ES 1.00 - which is what a
    // ShaderMaterial compiles as - has neither, and clamped because exp of a large
    // positive argument is an infinity and infinity over infinity is a NaN, which
    // renders as nothing at all
    float erfB(float x) {
        float e = exp(-2.4 * clamp(x, -8.0, 8.0));
        return (1.0 - e) / (1.0 + e);
    }

    // mean dust density along a sight line that runs from height y0 to height y1
    float laneDensity(float y0, float y1, float h) {
        float k = 0.7071 / h;
        float dyAbs = abs(y1 - y0);
        float midY = 0.5 * (y0 + y1);
        float rhoMid = exp(-midY * midY * k * k);
        float rhoErf = h * 1.2533 * abs(erfB(y0 * k) - erfB(y1 * k)) / max(dyAbs, 0.001);
        return mix(rhoMid, min(rhoErf, 1.0), smoothstep(0.02, 0.12, dyAbs));
    }

    // how much of the way from p to the camera lies inside the dusty disk
    float insideDisk(vec2 p, vec2 eye) {
        const float R = 50.0;
        float c = dot(p, p) - R * R;
        if (c > 0.0) return 0.0;
        vec2 d = eye - p;
        float a = max(dot(d, d), 0.000001);
        float b = dot(p, d);
        return clamp((-b + sqrt(max(b * b - a * c, 0.0))) / a, 0.0, 1.0);
    }
`;

export const VERTEX_SHADER = /* glsl */ `
    ${LANE_GLSL}

    attribute float aSize;
    attribute float aAlpha;
    attribute float aDust;
    uniform float uScale;
    uniform float uMaxSize;
    uniform float uMinSize;
    uniform float uNearFade;
    uniform float uAttenuate;
    uniform float uGain;
    uniform float uExtinction;
    uniform float uLane;
    uniform float uLaneHeight;
    uniform float uArmDust;
    uniform float uLaneFloor;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vExtinction;
    #ifdef SOFT_SPRITE
    varying float vWorldY;
    varying float vWorldSize;
    varying float vLen;
    varying float vInside;
    varying float vSeed;
    #endif
    void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        /*
         * The dust lane is thin and the bulge sticks out well above and below it, so
         * a star's extinction depends on its own height: the lane dims what lies
         * behind it and leaves the rest alone. Dimming the bulge uniformly is what
         * made it disappear edge-on instead of showing the bright bulge split by a
         * dark lane that every edge-on spiral has.
         */
        vExtinction = mix(uExtinction, 1.0, smoothstep(0.55, 2.4, abs(position.y)));
        float dist = -mv.z;

        /*
         * The dust lane, integrated per star instead of drawn.
         *
         * Sprites were tried at every size and strength and they always came out as
         * clouds and stains: a round sprite is a blob, and no number of blobs is a
         * smooth lane. Extinction is not an object anyway - it is what happens to
         * light on its way here - so each star works out for itself how much dust
         * its own sight line crossed and dims accordingly. That is smooth by
         * construction, has nothing to stain with, and costs no fill at all.
         *
         * The dust is a gaussian slab of scale height uLaneHeight about the plane,
         * and the column along the ray from the star to the camera has a closed form
         * (the difference of two error functions, tanh standing in for erf). Near
         * the plane that form blows up as the ray turns parallel to the slab, so it
         * is capped by the straight-line estimate - density at the midpoint times
         * path length - which is the honest bound.
         */
        float lane = 1.0;
        float vTau = 0.0;
        /*
         * Away from the plane only the dusty stars need this, and they are about a
         * tenth of the field - so the test earns its keep there. Near the plane the
         * smooth lane applies to everything and the branch is taken anyway.
         */
        if (uLane > 0.0 || (uArmDust > 0.0 && aDust > 0.1)) {
            float len = max(length(cameraPosition - position), 0.001);
            // only the part of the sight line inside the disk has dust on it
            float inside = uLane > 0.0 ? insideDisk(position.xz, cameraPosition.xz) : 1.0;
            float exitY = position.y + inside * (cameraPosition.y - position.y);
            float column = len * inside * laneDensity(position.y, exitY, uLaneHeight);
            /*
             * Two depths over one column. uLane is the smooth slab, which only bites
             * when the sight line runs along the plane; uArmDust is the structure,
             * scaled by how much dust the artwork puts at this star, which bites
             * from any angle because a lane is locally thick however short the path
             * through it. They are gated in opposite directions - the slab near the
             * plane, the structure away from it. The slab is modulated by the same
             * dust map, so the lane is eaten unevenly along its length rather than
             * being a clean bar.
             */
            vTau = -(uLane * (0.6 + 0.8 * aDust) + uArmDust * aDust) * column;
            // never to black: an opaque hole reads as a fault, not as dust
            vTau = max(vTau, -uLaneFloor);
            lane = exp(vTau);
        }
        float size = mix(aSize, aSize * uScale / dist, uAttenuate);
        float alpha = aAlpha;
        // keep sub-pixel points as dim 1px points instead of losing them
        if (size < 1.0) {
            alpha *= size;
            size = 1.0;
        }
        gl_PointSize = clamp(size, uMinSize, uMaxSize);
        /*
         * Soft sprites - haze, the bulge's glow - are many times wider than the dust
         * lane is thick, so dimming one from its centre either takes the whole
         * sprite or none of it and the lane comes out as a vague grey band. They
         * hand the fragment shader what it needs to work the column out per pixel
         * instead: how long the sight line is, where the sprite sits, and how many
         * kly of height its screen size stands for.
         */
        #ifdef SOFT_SPRITE
        vWorldY = position.y;
        vInside = insideDisk(position.xz, cameraPosition.xz);
        vLen = length(cameraPosition - position) * vInside;
        vWorldSize = gl_PointSize * dist * 0.0829 / uScale;
        vSeed = fract(sin(dot(position.xz, vec2(12.9898, 78.233))) * 43758.5453);
        #endif
        /*
         * Transmission is per channel, and that is the whole point: extinction at
         * A_V = 1 passes about 0.50 of the red and 0.30 of the blue, so starlight
         * behind the lane goes dim *and* warm. Multiplying the colour rather than
         * the alpha gets both at once, and additive light times a transmission is
         * exactly the right arithmetic. Three exponentials rather than one exp and
         * two pows: this runs on every one of 2.3M vertices every frame, and a pow
         * is two transcendentals wearing one name.
         */
        vColor = color * vec3(exp(${DUST_COLOR[0].toFixed(2)} * vTau), lane, exp(${DUST_COLOR[2].toFixed(2)} * vTau));
        vAlpha = min(alpha * uGain, 1.0) * smoothstep(uNearFade * 0.25, uNearFade, dist) * vExtinction;
        gl_Position = projectionMatrix * mv;
    }
`;

export const FRAGMENT_SHADER = /* glsl */ `
    uniform float uSharpness;
    uniform float uOpacity;
    uniform float uRing;
    uniform vec3 uTint;
    uniform float uSoftLane;
    uniform float uLaneHeight;
    uniform float uUpY;
    uniform float uCamY;
    uniform float uCloud;
    uniform sampler2D uNoise;
    uniform float uLaneFloor;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vExtinction;
    #ifdef SOFT_SPRITE
    varying float vWorldY;
    varying float vWorldSize;
    varying float vLen;
    varying float vInside;
    varying float vSeed;
    #endif

    ${LANE_GLSL}

    void main() {
        // r2 is 0 at the centre and 1 at the sprite's edge; the window forces zero there
        float r2 = dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5) * 4.0;
        if (r2 >= 1.0) discard;
        float a;
        if (uRing > 0.5) {
            // a bright ring with nothing inside it: additive light cannot paint
            // black, so the dark centre is simply light that is not there
            float d = sqrt(r2) - 0.66;
            a = exp(-d * d * 34.0) * (1.0 - r2) * vAlpha * uOpacity;
        } else {
            a = exp(-r2 * uSharpness) * (1.0 - r2) * vAlpha * uOpacity;
        }
        /*
         * Haze is not a pile of round balls. Each sprite carries its own patch of
         * noise, fixed to the sprite so it never swims, which breaks its outline
         * into wisps - and a few thousand overlapping wisps read as cloud where the
         * same number of gaussians read as cotton wool.
         */
        #ifdef SOFT_SPRITE
        if (uCloud > 0.0) {
            vec2 q = gl_PointCoord * 0.17 + vSeed * vec2(3.7, 9.1);
            float n = 0.62 * texture2D(uNoise, q).r + 0.38 * texture2D(uNoise, q * 2.7 + 0.37).r;
            a *= mix(1.0, smoothstep(0.26, 0.74, n) * 1.9, uCloud);
        }
        #endif
        if (a < 0.002) discard;
        vec3 color = vColor * mix(uTint, vec3(1.0), vExtinction);
        /*
         * The dust lane, per pixel. The same closed-form column the stars use, but
         * evaluated at the height this fragment stands for rather than at the
         * sprite's centre - which is what lets a lane a third of a kly thick cut
         * cleanly through a glow several kly across.
         */
        #ifdef SOFT_SPRITE
        if (uSoftLane > 0.0) {
            float y = vWorldY + (0.5 - gl_PointCoord.y) * vWorldSize * uUpY;
            float exitY = y + vInside * (uCamY - y);
            float tau = max(-uSoftLane * vLen * laneDensity(y, exitY, uLaneHeight), -uLaneFloor);
            color *= exp(tau * ${DUST_COLOR_GLSL});
        }
        #endif
        gl_FragColor = vec4(color, a);
    }
`;

export const NOISE_TEXTURE = noiseTexture();

export function pointsMaterial({ maxSize, minSize = 1, nearFade = 0.02, sharpness = 16, attenuate = 1, ring = false, lane = false, soft = false, cloud = 0, blending = THREE.AdditiveBlending }) {
    const material = new THREE.ShaderMaterial({
        // the soft variant carries five more varyings and the per-pixel lane; the
        // two million stars compile without any of it
        defines: soft ? { SOFT_SPRITE: 1 } : {},
        uniforms: {
            uScale: { value: 1 },
            uMaxSize: { value: maxSize },
            uMinSize: { value: minSize },
            uNearFade: { value: nearFade },
            uAttenuate: { value: attenuate },
            uSharpness: { value: sharpness },
            uOpacity: { value: 1 },
            uGain: { value: 1 },
            uTint: { value: new THREE.Color(1, 1, 1) },
            uExtinction: { value: 1 },
            uLane: { value: lane ? DUST.laneDepth : 0 },
            uLaneHeight: { value: DUST.laneHeight },
            uArmDust: { value: 0 },
            uLaneFloor: { value: DUST.laneFloor },
            uRing: { value: ring ? 1 : 0 },
            // soft sprites take the lane per fragment instead of per vertex
            uSoftLane: { value: 0 },
            uUpY: { value: 1 },
            uCamY: { value: 0 },
            uCloud: { value: cloud },
            uNoise: { value: NOISE_TEXTURE },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending,
    });
    return material;
}

export function glowSprite(color, size, opacity = 1) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.15, "rgba(255,255,255,.55)");
    gradient.addColorStop(0.45, "rgba(255,255,255,.12)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            color,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity,
        })
    );
    sprite.scale.setScalar(size);
    return sprite;
}
