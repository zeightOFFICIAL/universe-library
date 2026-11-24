import * as THREE from "three";
import { GALAXY_RADIUS, ARMS, ORION_SPUR, BAR_ANGLE, BACKDROP, BULGE, WHITE, SURROUNDINGS_DENSITY } from "./config.js";
import { pointsMaterial, glowSprite } from "./shaders.js";
import { rand, gauss, armPhase, armPoint, smoothstep, Layer } from "./util.js";

export function buildBackdropStars() {
    // extreme draws twice as many, each half as bright
    const count = Math.round(26000 * SURROUNDINGS_DENSITY);
    const layer = new Layer(count, 1 / SURROUNDINGS_DENSITY);
    const white = new THREE.Color(1.0, 0.97, 0.93);
    const blue = new THREE.Color(0.62, 0.74, 1.0);
    const warm = new THREE.Color(1.0, 0.78, 0.58);
    for (let i = 0; i < count; i++) {
        const p = new THREE.Vector3(gauss(), gauss(), gauss()).normalize().multiplyScalar(2500);
        const pick = rand();
        layer.add(p, pick < 0.58 ? white : pick < 0.84 ? blue : warm, 1.0 + Math.pow(rand(), 4) * 2.0, 0.16 + Math.pow(rand(), 3) * 0.7);
    }
    return layer;
}

/*
 * Far galaxies as dots. Most galaxies are far too distant to resolve, so they are
 * points - but not star points: warmer, softer-edged and spread through the volume
 * around us rather than pinned to one shell, which is what fills the space between
 * the Milky Way and the named neighbours.
 */
export function buildGalaxyDots() {
    const count = Math.round(1600 * SURROUNDINGS_DENSITY);
    const layer = new Layer(count, 1 / SURROUNDINGS_DENSITY);
    const color = new THREE.Color();
    const amber = new THREE.Color(1.0, 0.86, 0.66);
    const pale = new THREE.Color(0.86, 0.88, 1.0);
    const red = new THREE.Color(1.0, 0.7, 0.62);
    for (let i = 0; i < count; i++) {
        const dir = new THREE.Vector3(gauss(), gauss() * 0.75, gauss()).normalize();
        const p = dir.multiplyScalar(420 + Math.pow(rand(), 0.6) * 2000);
        const pick = rand();
        color.copy(pick < 0.5 ? amber : pick < 0.8 ? pale : red).lerp(new THREE.Color(1, 1, 1), rand() * 0.2);
        layer.add(p, color, 1.8 + Math.pow(rand(), 2) * 3.0, 0.25 + Math.pow(rand(), 2) * 0.55);
    }
    return layer;
}

/*
 * The centre is the densest place in the galaxy: a nuclear star cluster a few
 * light-years across around Sgr A*, holding millions of stars and, models say,
 * thousands of stellar-mass black holes. At this zoom none of that resolves, so it
 * is drawn as a bright, clearly three-dimensional bulb rather than a flat blob.
 */
/*
 * The core, built for legibility rather than literal scale.
 *
 * The shapes are real ones: the Milky Way's bulge is a boxy, peanut-shaped bar seen
 * end-on from here, not a ball, and at its heart sits a nuclear star cluster a few
 * light-years wide holding millions of stars. Those are the concepts worth getting
 * across. The sizes are not honest and cannot be: Sgr A*'s event horizon is about
 * 0.08 AU, which at 1 unit = 1,000 ly is around 1e-11 units, so anything drawn for
 * it is a pictogram by definition. What the drawing must not do is misrepresent the
 * arrangement - bar, then dense cluster, then the black hole population inside it.
 */
export function buildCore() {
    const group = new THREE.Group();
    const points = new Layer(78000);
    const color = new THREE.Color();
    const gold = new THREE.Color(1.0, 0.82, 0.55);
    const amber = new THREE.Color(1.0, 0.68, 0.4);
    const cream = new THREE.Color(1.0, 0.95, 0.85);
    const p = new THREE.Vector3();

    const barCos = Math.cos(BAR_ANGLE);
    const barSin = Math.sin(BAR_ANGLE);
    // along the bar, across it, and out of the plane
    const place = (along, across, height) => {
        p.set(along * barCos - across * barSin, height, along * barSin + across * barCos);
        return p;
    };

    // the boxy bar-bulge: a superellipsoid, which is what gives it flat sides and
    // square-ish corners instead of the taper of an ellipsoid
    const A = 7.6;
    const B = 2.9;
    const C = 2.2;
    const EXP = 2.9;
    for (let i = 0; i < 52000; i++) {
        let along = 0;
        let across = 0;
        let height = 0;
        for (let tries = 0; tries < 12; tries++) {
            along = (rand() * 2 - 1) * A;
            across = (rand() * 2 - 1) * B;
            height = (rand() * 2 - 1) * C;
            const shape =
                Math.pow(Math.abs(along / A), EXP) + Math.pow(Math.abs(across / B), EXP) + Math.pow(Math.abs(height / C), EXP);
            if (shape <= 1) break;
        }
        // denser towards the middle
        const pull = 0.35 + 0.65 * Math.pow(rand(), 0.45);
        color.copy(rand() < 0.55 ? gold : amber).lerp(cream, Math.pow(rand(), 2) * 0.5);
        points.add(place(along * pull, across * pull, height * pull), color, 1.1 + Math.pow(rand(), 3) * 1.9, 0.03 + Math.pow(rand(), 2) * 0.15);
    }

    // the X: the peanut bulge's four diagonal lobes, a real feature of barred galaxies
    for (let i = 0; i < 12000; i++) {
        const armSign = rand() < 0.5 ? 1 : -1;
        const upSign = rand() < 0.5 ? 1 : -1;
        const t = 0.25 + Math.pow(rand(), 0.8) * 0.95;
        const along = armSign * t * A * 0.85 + gauss() * 0.5;
        const height = upSign * t * C * 0.85 + gauss() * 0.35;
        color.copy(amber).lerp(gold, rand());
        points.add(place(along, gauss() * 0.7, height), color, 1.1 + Math.pow(rand(), 3) * 1.6, 0.03 + Math.pow(rand(), 2) * 0.13);
    }

    // the nuclear star cluster: millions of stars inside a few light-years, drawn as
    // a tight, bright knot so the jump in density is visible rather than implied
    for (let i = 0; i < 14000; i++) {
        const dir = new THREE.Vector3(gauss(), gauss() * 0.9, gauss()).normalize();
        p.copy(dir).multiplyScalar(Math.pow(rand(), 2.2) * 0.85);
        color.copy(cream).lerp(gold, rand() * 0.6);
        points.add(p, color, 1.2 + Math.pow(rand(), 3) * 2.2, 0.05 + Math.pow(rand(), 2) * 0.2);
    }

    const material = pointsMaterial({ maxSize: 3.4, minSize: 1.1, nearFade: 0.06, sharpness: 16 });
    const cloud = new THREE.Points(points.geometry(), material);
    cloud.renderOrder = 5;
    cloud.frustumCulled = false;
    group.add(cloud);

    /*
     * Stellar-mass black holes. Models of the nuclear cluster expect thousands in the
     * central few light-years; these are a token few dozen, drawn as accretion rings
     * because a real one is far below a pixel here. A handful are drawn hotter, since
     * only the accreting ones would show at all.
     */
    const holes = new Layer(BACKDROP.blackHoles);
    const holeColor = new THREE.Color();
    for (let i = 0; i < BACKDROP.blackHoles; i++) {
        const dir = new THREE.Vector3(gauss(), gauss() * 0.8, gauss()).normalize();
        p.copy(dir).multiplyScalar(0.25 + Math.pow(rand(), 0.7) * 1.5);
        const hot = rand() < 0.25;
        holeColor.setRGB(hot ? 0.75 : 0.95, hot ? 0.85 : 0.88, 1.0);
        holes.add(p, holeColor, hot ? 15 + rand() * 9 : 10 + rand() * 6, hot ? 0.95 : 0.5 + rand() * 0.3);
    }
    const holeMaterial = pointsMaterial({ maxSize: 34, sharpness: 1, attenuate: 0, ring: true });
    const holePoints = new THREE.Points(holes.geometry(), holeMaterial);
    holePoints.renderOrder = 8;
    holePoints.frustumCulled = false;
    group.add(holePoints);

    // three dashed circles outlining the dense nuclear region
    const shellMaterial = new THREE.LineDashedMaterial({
        color: 0xffd9a0,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        dashSize: 0.22,
        gapSize: 0.18,
    });
    const CORE_SHELL_RADIUS = 1.6;
    for (const axis of ["x", "y", "z"]) {
        const pts = [];
        for (let i = 0; i <= 128; i++) {
            const a = (i / 128) * Math.PI * 2;
            const c = Math.cos(a) * CORE_SHELL_RADIUS;
            const d = Math.sin(a) * CORE_SHELL_RADIUS;
            pts.push(axis === "x" ? new THREE.Vector3(0, c, d) : axis === "y" ? new THREE.Vector3(c, 0, d) : new THREE.Vector3(c, d, 0));
        }
        const circle = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), shellMaterial);
        circle.computeLineDistances();
        circle.renderOrder = 7;
        group.add(circle);
    }

    const shells = [
        glowSprite(new THREE.Color(1.0, 0.88, 0.7), 3.0, 0.3),
        glowSprite(new THREE.Color(0.95, 0.72, 0.45), 8.5, 0.17),
        glowSprite(new THREE.Color(0.55, 0.42, 0.62), 16, 0.06),
    ];
    for (const shell of shells) {
        shell.renderOrder = 6;
        shell.userData.baseOpacity = shell.material.opacity;
        shell.userData.baseColor = shell.material.color.clone();
        group.add(shell);
    }
    return { group, material, shells, shellMaterial, shellRadius: CORE_SHELL_RADIUS, holeMaterial, holePoints };
}

/*
 * The bulge's glow: soft sprites in the bulge's own shape. See BULGE.
 */
export function buildBulgeGlow() {
    const layer = new Layer(BULGE.body + BULGE.lobes + BULGE.nucleus);
    const color = new THREE.Color();
    const heart = new THREE.Color(1.0, 0.9, 0.7);
    const gold = new THREE.Color(1.0, 0.76, 0.48);
    const ember = new THREE.Color(1.0, 0.6, 0.36);
    const p = new THREE.Vector3();
    const barCos = Math.cos(BAR_ANGLE);
    const barSin = Math.sin(BAR_ANGLE);
    const place = (along, across, height) => p.set(along * barCos - across * barSin, height, along * barSin + across * barCos);
    const { along: A, across: B, height: C } = BULGE.half;
    const E = BULGE.exponent;

    for (let i = 0; i < BULGE.body; i++) {
        // a point inside the unit superball: flat-sided, which is what makes it boxy
        let u = 0;
        let v = 0;
        let w = 0;
        for (let tries = 0; tries < 16; tries++) {
            u = rand() * 2 - 1;
            v = rand() * 2 - 1;
            w = rand() * 2 - 1;
            if (Math.pow(Math.abs(u), E) + Math.pow(Math.abs(v), E) + Math.pow(Math.abs(w), E) <= 1) break;
        }
        // pulled towards the middle: a bulge is far denser at its heart than at its edge
        const pull = Math.pow(rand(), 1.25);
        const t = Math.hypot(u, v, w) * pull;
        place(u * pull * A, v * pull * B, w * pull * C);
        color.copy(heart).lerp(gold, smoothstep(0.0, 0.45, t)).lerp(ember, smoothstep(0.4, 1.1, t));
        const diameter = 2.4 + 3.4 * t + rand() * 1.6;
        layer.add(p, color, diameter * BULGE.unit, 0.03 + 0.085 * Math.pow(1 - Math.min(t, 1), 1.6));
    }

    // the X: the peanut's four diagonal lobes, which is what makes a barred bulge
    // look pinched in the middle when it is seen from the side
    for (let i = 0; i < BULGE.lobes; i++) {
        const armSign = rand() < 0.5 ? 1 : -1;
        const upSign = rand() < 0.5 ? 1 : -1;
        const t = 0.3 + Math.pow(rand(), 0.85) * 0.85;
        place(armSign * t * A * 0.78 + gauss() * 0.5, gauss() * 0.8, upSign * t * C * 0.95 + gauss() * 0.3);
        color.copy(gold).lerp(ember, rand() * 0.7);
        layer.add(p, color, (2.2 + rand() * 1.8) * BULGE.unit, 0.024 + rand() * 0.02);
    }

    // the nucleus: the nuclear star cluster and the disk around it, a small hard
    // light at the very centre that the rest of the bulge is arranged around
    for (let i = 0; i < BULGE.nucleus; i++) {
        p.set(gauss() * 0.42, gauss() * 0.3, gauss() * 0.42);
        color.copy(heart).lerp(WHITE, rand() * 0.45);
        layer.add(p, color, (0.7 + rand() * 1.1) * BULGE.unit, 0.07 + rand() * 0.09);
    }
    return layer;
}

export function buildArmOutlines() {
    const group = new THREE.Group();
    const material = new THREE.LineDashedMaterial({
        color: 0x8fa7d8,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        dashSize: 0.9,
        gapSize: 0.7,
    });
    // per-vertex alpha, so each line tapers in and out where its arm does instead of
    // stopping dead in the middle of the disk
    material.vertexColors = true;
    const draw = (phase, rMin, rMax, taper) => {
        const points = [];
        const colors = [];
        for (let i = 0; i <= 160; i++) {
            const r = THREE.MathUtils.lerp(rMin, rMax, i / 160);
            points.push(armPoint(phase, r));
            colors.push(1, 1, 1, smoothstep(rMin, rMin + taper, r) * (1 - smoothstep(rMax - taper, rMax, r)));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));
        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();
        group.add(line);
    };
    for (const arm of ARMS) draw(armPhase(arm.crossing), 8.5, arm.rMax ?? GALAXY_RADIUS, 4);
    draw(armPhase(ORION_SPUR.crossing), ORION_SPUR.rMin, ORION_SPUR.rMax, 2);
    return { group, material };
}
