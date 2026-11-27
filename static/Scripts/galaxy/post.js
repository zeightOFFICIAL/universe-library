import * as THREE from "three";
import { LITE, EXTREME, SOFT_LAYER, HERO_LAYER, SOFT_SCALE } from "./config.js";
import { smoothstep } from "./util.js";

/* ---------- HDR: float target, bloom, tone curve ---------- */

/*
 * Everything in this scene is additive light, and until now it was added straight
 * into an 8-bit canvas. That clips: the core and the edge-on band are two to three
 * times over the ceiling, so they came out as flat white with no shape inside, the
 * dust lanes had to be cranked absurdly high to cut through light that was already
 * clipped, and at the other end any contribution under half a level - most single
 * stars - rounded to nothing at all.
 *
 * So the scene renders into a half-float target, where a pixel can simply be
 * brighter than white, and one pass at the end decides how that maps to a screen:
 * a shoulder that rolls highlights off instead of clipping them, the way film and
 * every astrophotograph does. Bloom comes from the same buffer - light that is
 * genuinely bright spills a little, which is what makes a core read as a light
 * source rather than as a white shape.
 *
 * It costs less than it sounds. Measured at 2.3 megapixels the scene takes the same
 * time into a half-float target as into the canvas (the frame is bound by its 2.3M
 * vertices, not by fill), and the whole post chain is a handful of small passes.
 */
export const FULLSCREEN_VERTEX = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

export const BLOOM_DOWN_FRAGMENT = /* glsl */ `
    uniform sampler2D tSource;
    uniform vec2 uTexel;
    uniform float uPrefilter;
    uniform float uThreshold;
    uniform float uKnee;
    varying vec2 vUv;

    // soft-knee bright pass: nothing below the threshold, everything above it, and
    // a quadratic ramp between so the cut never shows as an edge
    vec3 bright(vec3 c) {
        float l = max(c.r, max(c.g, c.b));
        float soft = clamp(l - uThreshold + uKnee, 0.0, 2.0 * uKnee);
        soft = soft * soft / (4.0 * uKnee + 0.0001);
        return c * max(soft, l - uThreshold) / max(l, 0.0001);
    }

    void main() {
        vec3 a = texture2D(tSource, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
        vec3 b = texture2D(tSource, vUv + uTexel * vec2(1.0, -1.0)).rgb;
        vec3 c = texture2D(tSource, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
        vec3 d = texture2D(tSource, vUv + uTexel * vec2(1.0, 1.0)).rgb;
        vec3 e = texture2D(tSource, vUv).rgb;
        if (uPrefilter > 0.5) {
            /*
             * The first step is weighted by 1 / (1 + brightness). A star is a
             * pixel or two wide, so without this a single bright one dominates its
             * whole neighbourhood and the bloom flickers as the camera moves and
             * stars cross texel boundaries.
             */
            a = bright(a); b = bright(b); c = bright(c); d = bright(d); e = bright(e);
            float wa = 1.0 / (1.0 + max(a.r, max(a.g, a.b)));
            float wb = 1.0 / (1.0 + max(b.r, max(b.g, b.b)));
            float wc = 1.0 / (1.0 + max(c.r, max(c.g, c.b)));
            float wd = 1.0 / (1.0 + max(d.r, max(d.g, d.b)));
            float we = 4.0 / (1.0 + max(e.r, max(e.g, e.b)));
            gl_FragColor = vec4((a * wa + b * wb + c * wc + d * wd + e * we) / (wa + wb + wc + wd + we), 1.0);
        } else {
            gl_FragColor = vec4((a + b + c + d + e * 4.0) * 0.125, 1.0);
        }
    }
`;

export const BLOOM_UP_FRAGMENT = /* glsl */ `
    uniform sampler2D tSource;
    uniform vec2 uTexel;
    uniform float uWeight;
    varying vec2 vUv;
    void main() {
        // 3x3 tent
        vec3 sum = texture2D(tSource, vUv).rgb * 4.0;
        sum += texture2D(tSource, vUv + uTexel * vec2(-1.0, 0.0)).rgb * 2.0;
        sum += texture2D(tSource, vUv + uTexel * vec2(1.0, 0.0)).rgb * 2.0;
        sum += texture2D(tSource, vUv + uTexel * vec2(0.0, -1.0)).rgb * 2.0;
        sum += texture2D(tSource, vUv + uTexel * vec2(0.0, 1.0)).rgb * 2.0;
        sum += texture2D(tSource, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
        sum += texture2D(tSource, vUv + uTexel * vec2(1.0, -1.0)).rgb;
        sum += texture2D(tSource, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
        sum += texture2D(tSource, vUv + uTexel * vec2(1.0, 1.0)).rgb;
        gl_FragColor = vec4(sum * (uWeight / 16.0), 1.0);
    }
`;

export const COMPOSITE_FRAGMENT = /* glsl */ `
    uniform sampler2D tScene;
    uniform sampler2D tBloom;
    uniform float uBloom;
    uniform float uExposure;
    uniform float uSaturation;
    uniform float uVignette;
    uniform vec3 uShadowTint;
    uniform float uSeed;
    uniform vec2 uFlarePos;
    uniform float uFlareAmount;
    uniform vec3 uFlareTint;
    uniform float uAspect;
    varying vec2 vUv;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    #ifdef FLARE
    /*
     * A lens flare (owner, 2026-11-27), drawn, not sampled: the view finds the one
     * bright source worth it - the galactic core, or a drawn star close up - and says
     * where it is on screen and how strongly (uFlarePos, uFlareAmount). Here a row of
     * soft-edged ghosts runs from it through the middle of the frame and beyond, in
     * the house colours, with a thin halo ring round the source and a faint level
     * streak through it. No texture reads: a few distances per pixel, and nothing at
     * all while the amount is zero. Off in lite.
     */
    vec3 ghost(vec2 uv, vec2 at, float radius, vec3 tint) {
        float d = length((uv - at) * vec2(uAspect, 1.0));
        float disc = 1.0 - smoothstep(radius * 0.7, radius, d);
        float rim = exp(-pow((d - radius * 0.92) / (radius * 0.06), 2.0));
        return tint * (disc * 0.55 + rim * 0.45);
    }
    vec3 lensFlare(vec2 uv) {
        vec2 axis = 0.5 - uFlarePos;
        vec3 sum = vec3(0.0);
        sum += ghost(uv, uFlarePos + axis * 0.55, 0.035, vec3(1.0, 0.7, 0.4)) * 0.5;
        sum += ghost(uv, uFlarePos + axis * 0.9, 0.018, vec3(0.75, 0.55, 1.0)) * 0.7;
        sum += ghost(uv, uFlarePos + axis * 1.3, 0.07, vec3(0.5, 0.72, 1.0)) * 0.18;
        sum += ghost(uv, uFlarePos + axis * 1.65, 0.026, vec3(1.0, 0.85, 0.7)) * 0.55;
        sum += ghost(uv, uFlarePos + axis * 2.1, 0.11, vec3(0.7, 0.5, 1.0)) * 0.07;
        vec2 off = (uv - uFlarePos) * vec2(uAspect, 1.0);
        float d = length(off);
        // the halo, round on screen
        sum += vec3(0.85, 0.75, 1.0) * exp(-pow((d - 0.3) / 0.009, 2.0)) * 0.07;
        // a level streak through the source
        sum += uFlareTint * exp(-abs(off.y) * 260.0) * exp(-abs(off.x) * 7.5) * 0.5;
        return sum * uFlareTint;
    }
    #endif

    void main() {
        vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uBloom;
        #ifdef FLARE
        if (uFlareAmount > 0.001) c += lensFlare(vUv) * uFlareAmount;
        #endif
        c *= uExposure;

        /*
         * The shoulder. 1 - exp(-x) has slope one at black, so the faint end - the
         * arms, the haze, the dark between them - comes through as authored, and it
         * only bends where the 8-bit canvas used to clip. Applied per channel it
         * also bleaches towards white as it saturates, which is right for a core;
         * applied to luminance alone it keeps the hue, which is right for a blue
         * arm or a pink knot. The mix leans on the first and keeps some of the
         * second, so the bulge goes to a warm white rather than to paper.
         */
        vec3 perChannel = 1.0 - exp(-c);
        float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
        vec3 hueKept = c * ((1.0 - exp(-lum)) / max(lum, 0.0001));
        c = mix(perChannel, min(hueKept, vec3(1.0)), 0.3);

        float grey = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(grey), c, uSaturation);

        // a lens falls off towards its corners; so does this, slightly
        vec2 q = vUv - 0.5;
        c *= 1.0 - uVignette * smoothstep(0.25, 0.95, dot(q, q) * 2.0);

        // space is not quite black on any real exposure
        c += uShadowTint * (1.0 - grey);

        // half a level of noise, so faint gradients do not band in 8 bits
        float n = hash(gl_FragCoord.xy + uSeed) + hash(gl_FragCoord.yx * 1.31 + uSeed) - 1.0;
        gl_FragColor = vec4(c + n / 255.0, 1.0);
    }
`;

export const POST = {
    exposure: 1.32,
    bloom: 0.55,
    threshold: 0.62,
    knee: 0.45,
    // the widest bloom level is a few blurry pixels on a phone; lite drops it
    levels: LITE ? 5 : EXTREME ? 7 : 6,
    saturation: 1.16,
    vignette: 0.22,
    shadowTint: new THREE.Color(0.004, 0.005, 0.012),
    // lens flare: the strongest it gets (view.updateFlare sets the amount each frame)
    flare: 1.0,
    flareOn: !LITE,
};

export class PostPipeline {
    constructor(renderer) {
        this.renderer = renderer;
        // sizes on the soft layer are in that target's pixels, which are twice as big
        this.softScale = 1;
        // rendering into a float target needs one of these; without it the scene
        // goes straight to the canvas as it always did
        this.supported =
            renderer.capabilities.isWebGL2 &&
            (renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float"));
        if (!this.supported) return;
        this.softScale = SOFT_SCALE;

        const target = () =>
            new THREE.WebGLRenderTarget(4, 4, {
                type: THREE.HalfFloatType,
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                depthBuffer: false,
                stencilBuffer: false,
                generateMipmaps: false,
            });
        this.scene = target();
        this.soft = target();
        this.mips = [];
        for (let i = 0; i < POST.levels; i++) this.mips.push(target());

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
        geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
        const material = (fragmentShader, uniforms, blending = THREE.NoBlending) =>
            new THREE.ShaderMaterial({
                vertexShader: FULLSCREEN_VERTEX,
                fragmentShader,
                uniforms,
                blending,
                depthTest: false,
                depthWrite: false,
            });
        this.down = material(BLOOM_DOWN_FRAGMENT, {
            tSource: { value: null },
            uTexel: { value: new THREE.Vector2() },
            uPrefilter: { value: 0 },
            uThreshold: { value: POST.threshold },
            uKnee: { value: POST.knee },
        });
        // added onto the level it lands in, which turns the down chain into the up
        // chain in place and saves a second set of targets
        this.up = material(
            BLOOM_UP_FRAGMENT,
            { tSource: { value: null }, uTexel: { value: new THREE.Vector2() }, uWeight: { value: 1 } },
            THREE.AdditiveBlending
        );
        // lays the half-resolution soft layers over the scene, ahead of the bloom
        this.merge = material(
            /* glsl */ `
                uniform sampler2D tSource;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = vec4(texture2D(tSource, vUv).rgb, 1.0);
                }
            `,
            { tSource: { value: this.soft.texture } },
            THREE.AdditiveBlending
        );
        this.composite = material(COMPOSITE_FRAGMENT, {
            tScene: { value: this.scene.texture },
            tBloom: { value: this.mips[0].texture },
            uBloom: { value: POST.bloom },
            uExposure: { value: POST.exposure },
            uSaturation: { value: POST.saturation },
            uVignette: { value: POST.vignette },
            uShadowTint: { value: POST.shadowTint },
            uSeed: { value: 0 },
            // the lens flare: where its source is (0..1 on screen), how strong, its colour
            uFlarePos: { value: new THREE.Vector2(0.5, 0.5) },
            uFlareAmount: { value: 0 },
            uFlareTint: { value: new THREE.Color(1, 0.9, 0.8) },
            uAspect: { value: 1 },
        });
        if (!LITE) {
            this.composite.defines = { FLARE: 1 };
            this.composite.needsUpdate = true;
        }
        this.quad = new THREE.Mesh(geometry, this.down);
        this.quad.frustumCulled = false;
        this.quadScene = new THREE.Scene();
        this.quadScene.add(this.quad);
        this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    setSize(width, height) {
        if (!this.supported) return;
        this.composite.uniforms.uAspect.value = width / Math.max(height, 1);
        this.scene.setSize(width, height);
        this.soft.setSize(Math.max(1, Math.round(width * SOFT_SCALE)), Math.max(1, Math.round(height * SOFT_SCALE)));
        let w = width;
        let h = height;
        for (const mip of this.mips) {
            w = Math.max(1, w >> 1);
            h = Math.max(1, h >> 1);
            mip.setSize(w, h);
        }
    }

    pass(material, target) {
        this.quad.material = material;
        this.renderer.setRenderTarget(target);
        this.renderer.render(this.quadScene, this.quadCamera);
    }

    render(scene, camera) {
        const renderer = this.renderer;
        if (!this.supported) {
            camera.layers.enableAll();
            renderer.render(scene, camera);
            return;
        }
        camera.layers.set(SOFT_LAYER);
        renderer.setRenderTarget(this.soft);
        renderer.render(scene, camera);
        camera.layers.set(0);
        renderer.setRenderTarget(this.scene);
        renderer.render(scene, camera);

        // the post passes cover every pixel or add to what is there, so none clears
        renderer.autoClear = false;
        this.pass(this.merge, this.scene);
        // the open place's drawing, over everything soft, still ahead of the bloom
        camera.layers.set(HERO_LAYER);
        renderer.setRenderTarget(this.scene);
        renderer.render(scene, camera);
        camera.layers.set(0);
        let source = this.scene;
        for (let i = 0; i < this.mips.length; i++) {
            this.down.uniforms.tSource.value = source.texture;
            this.down.uniforms.uTexel.value.set(1 / source.width, 1 / source.height);
            this.down.uniforms.uPrefilter.value = i === 0 ? 1 : 0;
            this.pass(this.down, this.mips[i]);
            source = this.mips[i];
        }
        for (let i = this.mips.length - 2; i >= 0; i--) {
            source = this.mips[i + 1];
            this.up.uniforms.tSource.value = source.texture;
            this.up.uniforms.uTexel.value.set(1 / source.width, 1 / source.height);
            this.pass(this.up, this.mips[i]);
        }
        this.composite.uniforms.uSeed.value = (this.composite.uniforms.uSeed.value + 0.137) % 7;
        this.pass(this.composite, null);
        renderer.autoClear = true;
    }
}
