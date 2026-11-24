import * as THREE from "three";
import { EXTREME, GALAXY_TINT, BACKDROP, STAR_ALPHA, HAZE_ALPHA, INTER_ARM_TINT, ARM_OUTER_EDGE, ARM_INNER_EDGE, THICK_DISK_TINT, CIRRUS_VIOLET, CIRRUS_BLUE, HALO_TINT, WHITE, STAR_TINTS, DEEP_SKY_STYLE } from "./config.js";
import { rand, gauss, smoothstep, Layer } from "./util.js";
import { BACKDROP_MATRIX } from "./backdrop.js";

/* ---------- star field sampled from the backdrop ---------- */

/*
 * Cheap 2D value noise. The artwork's arms are smooth and continuous; real arms are
 * flocculent - branched, broken, feathered - so this is used to carve the sampled
 * stars into patches and to drag some of them sideways out of the arm.
 */
export function hash2(x, y) {
    const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return h - Math.floor(h);
}

export function valueNoise2(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash2(ix, iy);
    const b = hash2(ix + 1, iy);
    const c = hash2(ix, iy + 1);
    const d = hash2(ix + 1, iy + 1);
    return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}

// two octaves is enough texture, and this runs two million times per build
export function flocculence(x, z) {
    return 0.62 * valueNoise2(x * 0.4, z * 0.4) + 0.38 * valueNoise2(x * 1.15 + 31.7, z * 1.15 - 12.3);
}

/*
 * A dust map read out of the backdrop painting.
 *
 * Andromeda's arms are threaded with dark lanes and ours were not, because the only
 * dust we had was a smooth slab: structureless, and invisible unless the view was
 * flat enough to look along it. The artwork already paints its lanes, so this finds
 * them - a pixel much darker than its surroundings, inside a part of the image that
 * is lit at all, is a lane - and hands each star a number saying how much dust it
 * sits behind. Nothing is drawn: the number feeds the same per-star extinction the
 * flat-view lane uses, so there is no sprite anywhere that could stain the frame.
 */
/*
 * The same map as a texture, for the backdrop to darken itself with. The rows are
 * flipped because a canvas counts them downwards and a texture coordinate counts
 * them up; get this wrong and the lanes land on the wrong side of the galaxy, which
 * is at least obvious.
 */
export function dustTexture(map, n) {
    const data = new Uint8Array(n * n);
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) data[(n - 1 - y) * n + x] = Math.round(map[y * n + x] * 255);
    }
    const texture = new THREE.DataTexture(data, n, n, THREE.RedFormat);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
}

export function dustMapFrom(sampler, radius = 7) {
    const n = sampler.n;
    const lum = new Float32Array(n * n);
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) lum[y * n + x] = sampler.lum(x, y);
    }
    // separable box blur: the local background a lane is measured against
    const tmp = new Float32Array(n * n);
    const blur = new Float32Array(n * n);
    const span = radius * 2 + 1;
    for (let y = 0; y < n; y++) {
        let acc = 0;
        for (let x = -radius; x <= radius; x++) acc += lum[y * n + Math.min(n - 1, Math.max(0, x))];
        for (let x = 0; x < n; x++) {
            tmp[y * n + x] = acc / span;
            const out = Math.min(n - 1, Math.max(0, x - radius));
            const inn = Math.min(n - 1, Math.max(0, x + radius + 1));
            acc += lum[y * n + inn] - lum[y * n + out];
        }
    }
    for (let x = 0; x < n; x++) {
        let acc = 0;
        for (let y = -radius; y <= radius; y++) acc += tmp[Math.min(n - 1, Math.max(0, y)) * n + x];
        for (let y = 0; y < n; y++) {
            blur[y * n + x] = acc / span;
            const out = Math.min(n - 1, Math.max(0, y - radius));
            const inn = Math.min(n - 1, Math.max(0, y + radius + 1));
            acc += tmp[inn * n + x] - tmp[out * n + x];
        }
    }

    const dust = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) {
        const deficit = (blur[i] - lum[i]) / (blur[i] + 0.05);
        /*
         * Thresholded, and that is the whole difference between lanes and mud. By
         * definition half of all pixels sit below their local mean, so taking the
         * deficit as-is put a little dust on half the galaxy and dimmed the disk
         * into a brown wash. Only a decided deficit is a lane; everything else is
         * just the texture of the painting. The thresholds are not guesses: measured
         * against the backdrop and weighted by where stars actually land, 0.045 is
         * about the 66th percentile of the deficit and 0.17 the 98th, so roughly a
         * sixth of the star field picks up some dust and a small fraction of that
         * is a dense lane - which is how much of a spiral is in shadow.
         */
        dust[i] = smoothstep(0.045, 0.17, deficit) * smoothstep(0.05, 0.16, blur[i]);
    }

    /*
     * Thresholding a painting pixel by pixel finds dust as isolated dots, and once
     * the lanes were deep enough to see, that is what they looked like: strings of
     * black beads along the arms. Real lanes are ribbons. So the map is smoothed
     * along the local grain of the image and not across it - the structure tensor
     * of the brightness says which way an arm runs at each pixel, and the dust is
     * averaged a few pixels up and down that direction only. Beads on the same lane
     * join up; neighbouring lanes stay separate.
     */
    const jxx = new Float32Array(n * n);
    const jxy = new Float32Array(n * n);
    const jyy = new Float32Array(n * n);
    for (let y = 1; y < n - 1; y++) {
        for (let x = 1; x < n - 1; x++) {
            const i = y * n + x;
            const gx = blur[i + 1] - blur[i - 1];
            const gy = blur[i + n] - blur[i - n];
            jxx[i] = gx * gx;
            jxy[i] = gx * gy;
            jyy[i] = gy * gy;
        }
    }
    const boxed = (src) => {
        const out = new Float32Array(n * n);
        const R = 3;
        for (let y = R; y < n - R; y++) {
            for (let x = R; x < n - R; x++) {
                let acc = 0;
                for (let dy = -R; dy <= R; dy += 3) for (let dx = -R; dx <= R; dx += 3) acc += src[(y + dy) * n + x + dx];
                out[y * n + x] = acc;
            }
        }
        return out;
    };
    const sxx = boxed(jxx);
    const sxy = boxed(jxy);
    const syy = boxed(jyy);
    const ribbons = new Float32Array(n * n);
    const REACH = 5;
    for (let y = REACH; y < n - REACH; y++) {
        for (let x = REACH; x < n - REACH; x++) {
            const i = y * n + x;
            // the gradient points across the arm; a quarter turn from it runs along
            const across = 0.5 * Math.atan2(2 * sxy[i], sxx[i] - syy[i]);
            const ax = -Math.sin(across);
            const ay = Math.cos(across);
            let acc = 0;
            let weight = 0;
            for (let t = -REACH; t <= REACH; t++) {
                const w = 1 - Math.abs(t) / (REACH + 1);
                acc += dust[Math.round(y + ay * t) * n + Math.round(x + ax * t)] * w;
                weight += w;
            }
            // a touch of gain: averaging along the lane fills the gaps between the
            // beads but also takes the tops off them
            /*
             * And a floor. Smoothing spreads a trace of dust over every pixel near a
             * lane, and the shader skips the lane maths only for stars that carry
             * none - so without this nearly every star stopped being skipped and
             * the star field's cost tripled for a difference nobody could see.
             */
            const value = (acc / weight) * 1.35;
            ribbons[i] = value < 0.12 ? 0 : Math.min(1, value);
        }
    }
    return ribbons;
}

export function imageSampler(image, n) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = n;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, n, n);
    const pixels = ctx.getImageData(0, 0, n, n).data;

    // cumulative brightness, so a random number picks a pixel in proportion to how
    // bright it is: bright arms get many stars, dust lanes get almost none
    const cdf = new Float64Array(n * n);
    let sum = 0;
    for (let i = 0; i < n * n; i++) {
        const r = pixels[i * 4] / 255;
        const g = pixels[i * 4 + 1] / 255;
        const b = pixels[i * 4 + 2] / 255;
        const lum = 0.25 * r + 0.6 * g + 0.15 * b;
        // a steeper exponent puts proportionally more stars on the arms and
        // strips the gaps between them, which is what makes the arms read
        sum += Math.pow(lum, 2.2);
        cdf[i] = sum;
    }

    const pick = () => {
        const target = rand() * sum;
        let lo = 0;
        let hi = n * n - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (cdf[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    };

    // luminance lookup, clamped at the edges, used to read the slope across an arm
    const lum = (ix, iy) => {
        const x = ix < 0 ? 0 : ix >= n ? n - 1 : ix;
        const y = iy < 0 ? 0 : iy >= n ? n - 1 : iy;
        const i = (y * n + x) * 4;
        return (0.25 * pixels[i] + 0.6 * pixels[i + 1] + 0.15 * pixels[i + 2]) / 255;
    };

    return { pixels, n, pick, lum, total: sum };
}

/*
 * Pixel index -> world position in the galaxy plane, returning the disk radius in
 * kly. The caller passes the vector in: this runs a million times per build, and
 * allocating a fresh Vector3 each time was most of the build's cost.
 */
export function pixelToPlane(index, n, target) {
    const ix = index % n;
    const iy = Math.floor(index / n);
    const x = ((ix + rand()) / n - 0.5) * BACKDROP.size;
    // the texture's v axis runs up the plane, so image row 0 is +Y
    const y = (0.5 - (iy + rand()) / n) * BACKDROP.size;
    target.set(x, y, 0).applyMatrix4(BACKDROP_MATRIX);
    return Math.hypot(x, y);
}

export function pixelColor(sampler, index) {
    const { pixels } = sampler;
    return {
        r: pixels[index * 4] / 255,
        g: pixels[index * 4 + 1] / 255,
        b: pixels[index * 4 + 2] / 255,
    };
}

// weighted pick from STAR_TINTS
export function pickTint() {
    let roll = rand();
    for (const tint of STAR_TINTS) {
        roll -= tint.weight;
        if (roll <= 0) return tint;
    }
    return STAR_TINTS[STAR_TINTS.length - 1];
}

export function buildGalaxyFromImage(image) {
    const sampler = imageSampler(image, BACKDROP.sampleSize);
    const dustMap = dustMapFrom(sampler);
    const scattered = buildScatteredDeepSky(sampler);
    const p = new THREE.Vector3();
    const stars = new Layer(BACKDROP.stars + BACKDROP.thickDisk + BACKDROP.halo, STAR_ALPHA);
    const gas = new Layer(BACKDROP.gas + BACKDROP.cirrus + BACKDROP.interArm, HAZE_ALPHA);
    // extreme draws twice the knots, each fainter, so the arms keep their exposure
    const knots = new Layer(BACKDROP.knots, EXTREME ? 1 / 2 : 1);
    const color = new THREE.Color();

    const centre = (sampler.n - 1) / 2;
    for (let i = 0; i < BACKDROP.stars; i++) {
        const index = sampler.pick();
        const c = pixelColor(sampler, index);
        const peak = Math.max(c.r, c.g, c.b);
        if (peak < 0.04) continue;
        const r = pixelToPlane(index, sampler.n, p);

        /*
         * Flocculence. The artwork's arms are smooth ribbons; real ones are broken
         * and branched. A noise field thins the sample in a spatially correlated way
         * - so it carves patches and gaps rather than random speckle - and drags a
         * few stars sideways out of the arm, which is what reads as a spur.
         */
        const floc = flocculence(p.x, p.z);
        const inDisk = r > 7;
        if (inDisk && rand() > 0.45 + 0.85 * floc) continue;
        if (inDisk && rand() < 0.12) {
            const radial = Math.hypot(p.x, p.z) || 1;
            const push = (floc - 0.5) * 3.6;
            p.x += (-p.z / radial) * push;
            p.z += (p.x / radial) * push;
        }
        // thin disk, thickening into a round bulge towards the centre
        /*
         * Disks flare: the further out you go, the thicker the layer of stars gets.
         * Without it the outer disk reads as a sheet of paper, which is exactly where
         * the flatness showed most.
         */
        // a real disk flares, but gently: too much and the rim reads as a vertical
        // spray rather than a disk that thickens
        const flare = 0.011 * Math.pow(Math.max(r - 26, 0), 1.2);
        const sigma = 0.13 + 0.019 * r + flare + 2.2 * Math.exp(-r / 2.6);
        p.y += gauss() * sigma;
        // keep the pixel's hue, then pull it towards one of the house tints. The
        // bulge keeps the artwork's warm gold: violet over gold mixes to mud.
        const norm = 1 / peak;
        color.setRGB(c.r * norm, c.g * norm, c.b * norm);
        const tint = pickTint();
        color.lerp(tint.color, tint.amount * (0.65 + 0.35 * rand()) * smoothstep(3.5, 11, r));
        // a second cue for telling arm from gap up close: the sparse stars between
        // the arms are the old, redder population, the arms keep the blue-violet
        if (peak < 0.42) color.lerp(INTER_ARM_TINT, (0.42 - peak) * 1.6 * smoothstep(3.5, 11, r));

        /*
         * Arms are not symmetric across their width. Gas piles up on the inner edge,
         * where the dust lane sits, and the young blue stars appear just outside it.
         * Reading the brightness slope along the radius tells us which edge a star
         * landed on - and because it comes from the artwork itself, the colouring
         * lands on the real arms rather than on a skeleton that might not match.
         */
        const ix = index % sampler.n;
        const iy = (index / sampler.n) | 0;
        let rx = ix - centre;
        let ry = iy - centre;
        const rl = Math.hypot(rx, ry) || 1;
        rx /= rl;
        ry /= rl;
        const slope =
            sampler.lum(Math.round(ix + rx * 3), Math.round(iy + ry * 3)) -
            sampler.lum(Math.round(ix - rx * 3), Math.round(iy - ry * 3));
        const armEdge = smoothstep(6, 13, r) * smoothstep(0.12, 0.45, peak);
        if (slope < 0) color.lerp(ARM_OUTER_EDGE, Math.min(-slope * 2.4, 0.5) * armEdge);
        else color.lerp(ARM_INNER_EDGE, Math.min(slope * 1.9, 0.38) * armEdge);
        /*
         * A wide size spread is what sells a star field: mostly small points with a
         * rare bright one among them. A tighter distribution of the same count reads
         * as uniform grain, which is why more stars alone never fixed the look. The
         * fourth power keeps the big ones rare, so the cost barely moves.
         */
        const size = 1.35 + Math.pow(rand(), 4) * 5.0;
        /*
         * Density, not brightness. The star count is more than doubled while each
         * star's alpha drops to roughly 45% of what it was, so the total light in
         * the disk is unchanged but far more of it is covered: the galaxy reads as
         * solid rather than as something you can see through. Raising alpha instead
         * just makes it glow, which is not the same thing.
         */
        /*
         * Out towards the rim the artwork dims, and because star brightness follows
         * the pixel it samples, the stars dim with it and the disk dissolves rather
         * than ending. Lift them back with radius so the outskirts stay a star field:
         * fewer stars out there, but each one still reads as a star.
         */
        const rimLift = 1 + 1.35 * smoothstep(18, 46, r);
        const alpha = (0.008 + Math.pow(rand(), 3) * 0.0725) * (0.35 + 0.65 * peak) * rimLift;
        stars.add(p, color, size, alpha, dustMap[index]);
    }

    for (let i = 0; i < BACKDROP.gas; i++) {
        const index = sampler.pick();
        const c = pixelColor(sampler, index);
        const r = pixelToPlane(index, sampler.n, p);
        if (r < 3.5) continue;
        p.y += gauss() * (0.45 + 0.016 * r + 1.6 * Math.exp(-r / 3));
        color.setRGB(c.r, c.g, c.b).lerp(STAR_TINTS[0].color, (0.3 + rand() * 0.2) * smoothstep(4, 12, r));
        gas.add(p, color, 26 + rand() * 40, 0.008 + rand() * 0.012, dustMap[index]);
    }

    /*
     * Cirrus. The space between the outer arms is not empty and should not render as
     * black: faint dust catching starlight fills it. Sampled from the outer disk and
     * pushed hard towards violet and blue, at a size and opacity that only registers
     * as a wash behind the stars. This is what gives the outskirts a floor to sit on
     * instead of fading into the background.
     */
    /*
     * Clouds come in complexes, not in an even sprinkle. Each sprite is placed near
     * a drifting centre rather than independently, so the rim builds up into a few
     * dozen ragged banks with empty sky between them - which is what the eye reads
     * as cloud. An even distribution of the same sprites reads as film grain.
     */
    const cloud = { pos: new THREE.Vector3(), spread: 1, life: 0 };
    for (let i = 0; i < BACKDROP.cirrus; i++) {
        if (cloud.life <= 0) {
            // start a new bank somewhere in the outer disk
            let tries = 0;
            do {
                const index = sampler.pick();
                const r = pixelToPlane(index, sampler.n, cloud.pos);
                cloud.radius = r;
                tries++;
            } while ((cloud.radius < 16 || cloud.radius > 54) && tries < 40);
            cloud.pos.y += gauss() * (0.5 + 0.03 * cloud.radius);
            cloud.spread = 1.2 + rand() * 4.5;
            cloud.life = 20 + Math.floor(rand() * 60);
            cloud.violet = rand() < 0.35;
        }
        cloud.life--;
        p.copy(cloud.pos);
        p.x += gauss() * cloud.spread;
        p.z += gauss() * cloud.spread;
        p.y += gauss() * cloud.spread * 0.35;
        // denser and bluer at the heart of a bank, wispier at its edges
        const core = Math.exp(-(p.distanceToSquared(cloud.pos)) / (2 * cloud.spread * cloud.spread));
        color.setRGB(0.7, 0.75, 1.0).lerp(cloud.violet ? CIRRUS_VIOLET : CIRRUS_BLUE, 0.55 + rand() * 0.3);
        gas.add(p, color, 30 + rand() * 54, (0.003 + rand() * 0.005) * (0.5 + core));
    }

    /*
     * Backfill for the gaps between the arms, and this is a different sampling
     * problem to everything else here. Stars follow brightness^2.2, so the gaps are
     * deliberately starved of them - that is what makes the arms read - but it also
     * leaves those regions as flat grey with nothing behind the few stars that are
     * there. So instead of drawing from the brightness CDF, which would land on the
     * arms again, pick pixels uniformly and keep only the dim ones: that is exactly
     * the inter-arm space and the dust lanes. It reaches further in than the rim
     * cirrus, because the gaps close to the core need it most.
     */
    let interArmTries = 0;
    while (gas.count < BACKDROP.gas + BACKDROP.cirrus + BACKDROP.interArm && interArmTries < BACKDROP.interArm * 40) {
        interArmTries++;
        const index = Math.floor(rand() * sampler.n * sampler.n);
        const c = pixelColor(sampler, index);
        const peak = Math.max(c.r, c.g, c.b);
        if (peak < 0.02 || peak > 0.3) continue;
        const r = pixelToPlane(index, sampler.n, p);
        if (r < 5 || r > 52) continue;
        p.y += gauss() * (0.4 + 0.02 * r);
        color.setRGB(c.r, c.g, c.b).lerp(rand() < 0.3 ? CIRRUS_VIOLET : CIRRUS_BLUE, 0.6 + rand() * 0.25);
        gas.add(p, color, 27 + rand() * 46, 0.0065 + rand() * 0.009);
    }

    /*
     * The galaxy read flat because only the thin disk was ever built. The real thing
     * has two more components stacked on it: a thick disk of older stars about five
     * times taller, and a rounder stellar halo reaching far above and below. They are
     * faint, they carry almost no structure, and they are what gives the galaxy
     * volume from every angle instead of looking like a decal.
     */
    for (let i = 0; i < BACKDROP.thickDisk; i++) {
        const index = sampler.pick();
        const c = pixelColor(sampler, index);
        const peak = Math.max(c.r, c.g, c.b);
        if (peak < 0.05) continue;
        const r = pixelToPlane(index, sampler.n, p);
        p.y += gauss() * (2.2 + 0.03 * r);
        // an older population: redder and smoother than the arms below it
        color.setRGB(c.r, c.g, c.b).lerp(THICK_DISK_TINT, 0.55 + rand() * 0.3);
        stars.add(p, color, 1.3 + Math.pow(rand(), 3) * 2.4, (0.01 + Math.pow(rand(), 3) * 0.06) * (0.4 + 0.6 * peak));
    }

    for (let i = 0; i < BACKDROP.halo; i++) {
        // a flattened spheroid falling off with radius, out past the disk's rim
        const dir = new THREE.Vector3(gauss(), gauss() * 0.75, gauss()).normalize();
        const radius = 3 + Math.pow(rand(), 2.1) * 46;
        p.copy(dir).multiplyScalar(radius);
        color.copy(HALO_TINT).lerp(WHITE, rand() * 0.5);
        stars.add(p, color, 1.2 + Math.pow(rand(), 3) * 1.8, 0.0075 + Math.pow(rand(), 3) * 0.05);
    }

    // star-forming regions: the artwork paints them pink, so pick the pink pixels
    let tries = 0;
    while (knots.count < BACKDROP.knots && tries < BACKDROP.knots * 60) {
        tries++;
        const index = sampler.pick();
        const c = pixelColor(sampler, index);
        if (!(c.r > 0.22 && c.r > c.b * 1.12 && c.r > c.g * 1.08)) continue;
        const r = pixelToPlane(index, sampler.n, p);
        /*
         * The painting's bulge is warm, so "pick the pink pixels" used to pick most
         * of it and the galactic centre came out in a rash of star-forming regions.
         * A bulge is old stars and very little gas: the knots belong to the arms.
         */
        if (r < 8.5 && rand() > smoothstep(5.5, 8.5, r) * 0.6) continue;
        p.y += gauss() * (0.12 + 0.006 * r);
        color.setRGB(Math.min(c.r * 1.2, 1), c.g * 0.85, c.b * 0.95);
        knots.add(p, color, 1.8 + rand() * 3.0, (0.16 + rand() * 0.26) * (0.3 + 0.7 * smoothstep(6, 15, r)), dustMap[index]);
    }

    // the house violet, over everything sampled from the painting (see GALAXY_TINT)
    for (const layer of [stars, gas, knots]) {
        const c = layer.colors;
        for (let i = 0; i < layer.count * 3; i += 3) {
            c[i] *= GALAXY_TINT.r;
            c[i + 1] *= GALAXY_TINT.g;
            c[i + 2] *= GALAXY_TINT.b;
        }
    }
    return { stars, gas, knots, scattered, dustTexture: dustTexture(dustMap, sampler.n) };
}

/*
 * Named landmarks are only the famous handful. The galaxy is full of nebulae and
 * clusters, so the rest of the disk gets a semi-random population sampled from the
 * artwork: no names, no labels, just enough to show that star-forming regions and
 * clusters are everywhere rather than clumped near the Sun. Globulars go into the
 * halo, where they belong.
 */
export function buildScatteredDeepSky(sampler) {
    const layer = new Layer(BACKDROP.scatteredDeepSky);
    /*
     * Each filler object is also recorded with its kind, so the painted treatment
     * the named landmarks get (see buildDeepSky) can be laid over the whole disk.
     * Recording draws no random numbers: the star field sampled after this is
     * exactly what it was.
     */
    layer.objects = [];
    const color = new THREE.Color();
    const p = new THREE.Vector3();
    const nebula = new THREE.Color(DEEP_SKY_STYLE.nebula.color).convertSRGBToLinear();
    const open = new THREE.Color(DEEP_SKY_STYLE.open.color).convertSRGBToLinear();
    const globular = new THREE.Color(DEEP_SKY_STYLE.globular.color).convertSRGBToLinear();
    const remnant = new THREE.Color(DEEP_SKY_STYLE.remnant.color).convertSRGBToLinear();
    const planetary = new THREE.Color(DEEP_SKY_STYLE.planetary.color).convertSRGBToLinear();
    let tries = 0;
    while (layer.count < BACKDROP.scatteredDeepSky && tries < BACKDROP.scatteredDeepSky * 60) {
        tries++;
        const roll = rand();
        if (roll < 0.12) {
            // halo globulars: a round, thick distribution around the whole galaxy
            p.set(gauss(), gauss(), gauss()).normalize().multiplyScalar(4 + Math.abs(gauss()) * 16);
            color.copy(globular);
            layer.add(p, color, 2.8 + rand() * 2.0, 0.4 + rand() * 0.22);
            layer.objects.push({ position: p.clone(), kind: "globular" });
            continue;
        }
        const index = sampler.pick();
        const c = pixelColor(sampler, index);
        const peak = Math.max(c.r, c.g, c.b);
        if (peak < 0.09) continue;
        const r = pixelToPlane(index, sampler.n, p);
        if (r < 3 || r > 50) continue;
        /*
         * Same lesson as the knots: the painting's bulge is warm, so "red over blue"
         * called most of it a nebula, and the core close-up came out as pink confetti
         * over a region that is old stars and very little gas. Nebulae, remnants and
         * planetaries thin out inside the bar, and pink now means low green as well -
         * the bulge's gold has plenty of it, a nebula's pink does not.
         */
        if (r < 9 && rand() > 0.15 + 0.85 * smoothstep(5, 9, r)) continue;
        p.y += gauss() * (0.1 + 0.01 * r);
        const pink = c.r > c.b * 1.1 && c.r > c.g * 1.18;
        const roll2 = rand();
        // mostly nebulae where the artwork is pink and clusters where it is blue,
        // with a few remnants and planetaries mixed through for variety
        const kind = roll2 < 0.08 ? "remnant" : roll2 < 0.16 ? "planetary" : pink ? "nebula" : "open";
        color.copy({ remnant, planetary, nebula, open }[kind]);
        layer.add(p, color, 2.8 + rand() * 2.6, 0.36 + rand() * 0.26);
        layer.objects.push({ position: p.clone(), kind });
    }
    return layer;
}
