import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DATA, SUN, VIEW_SHIFT, NARROW_WIDTH, FOV, GALAXY_RADIUS, ARMS, ORION_SPUR, THREE_KPC_ARMS, BACKDROP, QUALITY, LITE, MAX_PIXEL_RATIO, WHITE, LOCAL_RINGS_LY, LOCAL_ENTER, LOCAL_FULL, LOCAL_MIN_DISTANCE, GALAXY_MIN_DISTANCE, SUN_VIEW, DEEP_SKY_LABEL_DISTANCE, OVERVIEW, START, START_PORTRAIT, PIVOT, SOFT_LAYER, SCRATCH_VECTOR, ORIGIN, EXTINCTION_RED, RAYCASTER, GALACTIC_PLANE, DEEP_SKY_STYLE } from "./config.js";
import { pointsMaterial, glowSprite } from "./shaders.js";
import { armPhase, armPoint, directionFromSun, truePosition, formatLy, smoothstep } from "./util.js";
import { UNITS, UNIT_OPTIONS, DISPLAY, DISPLAY_OPTIONS, setUnits, setDisplay, LABEL_SCALE, onUnitsChange, onDisplayChange, formatMass, solarMasses } from "./units.js";
import { buildBackdropVolume } from "./backdrop.js";
import { buildGalaxyFromImage } from "./starfield.js";
import { buildBackdropStars, buildGalaxyDots, buildCore, buildBulgeGlow, buildArmOutlines } from "./structures.js";
import { buildDeepSky, buildGalaxies } from "./landmarks.js";
import { DUST, dustColumn, diskTransmission } from "./dust.js";
import { buildLocal } from "./local.js";
import { PostPipeline } from "./post.js";
import { LABEL_SPOTS, Marker } from "./markers.js";
import { Catalogue } from "./panels.js";

/* ---------- view ---------- */

export class GalaxyView {
    constructor() {
        this.root = document.getElementById("GALAXY_VIEW");
        this.canvas = document.getElementById("GALAXY_CANVAS");
        this.labels = document.getElementById("GALAXY_LABELS");
        this.readout = document.getElementById("GALAXY_READOUT");
        this.scaleNote = document.getElementById("GALAXY_SCALE_NOTE");
        this.running = false;
        this.flight = null;
        this.lastInteraction = 0;
        this.lastListUpdate = 0;
        this.layerState = {};
        this.markers = [];

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: "high-performance" });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
        this.quality = QUALITY.tier;
        this.renderer.setClearColor(0x000000, 1);
        this.post = new PostPipeline(this.renderer);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 9000);

        this.starFieldReady = false;
        this.imagesReady = false;
        this.loadingManager = new THREE.LoadingManager();
        this.loadingManager.onProgress = (url, loaded, total) => {
            // the star field is the slow half, so images only fill the first 60%
            this.setLoaderProgress((loaded / Math.max(total, 1)) * 0.6);
        };
        this.loadingManager.onLoad = () => {
            this.imagesReady = true;
            this.maybeFinishLoading();
        };
        this.loadingManager.onError = (url) => {
            this.setLoaderStep(`Missing ${url.split("/").pop()}`);
        };

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = GALAXY_MIN_DISTANCE;
        this.controls.maxDistance = PIVOT.maxDistance;
        /*
         * Close enough to the plane to see the dust lane cut the disk. At 88 degrees
         * the sight line to the bulge passed a kiloparsec above a dust layer only a
         * couple of hundred light years thick, so the lane could only ever appear
         * beside the bright band instead of across it - which is what made it read
         * as a smear rather than as dust in front of the galaxy.
         */
        this.controls.maxPolarAngle = THREE.MathUtils.degToRad(89.6);
        this.controls.screenSpacePanning = false;
        this.controls.zoomSpeed = 1.2;
        /*
         * No idle auto-rotation. It used to drift the camera whenever the view sat
         * still for 25 seconds, which meant the galaxy was never where you left it:
         * you read a label, looked away, and came back to a different composition.
         * The view now moves only when the user moves it, or on a flight.
         */
        this.controls.autoRotate = false;
        // left button moves the map, right button tilts and turns it
        this.controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
        // and touch follows the mouse: one finger moves, two fingers pinch and turn
        this.controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
        this.hint = this.root.querySelector(".GalaxyHint");
        if (this.hint && window.matchMedia("(pointer: coarse)").matches) {
            this.hint.textContent = "Drag to move · two fingers to tilt and zoom";
        }
        this.controls.addEventListener("start", () => {
            this.flight = null;
            this.lastInteraction = performance.now();
            // the hint has done its job once the map has been touched
            this.hint?.classList.add("Dismissed");
        });

        /*
         * Reduced motion: flights become cuts and the drag loses its glide. Nothing
         * else here moves on its own, so that is the whole of it.
         */
        this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const applyMotion = () => {
            this.controls.enableDamping = !this.reducedMotion.matches;
        };
        applyMotion();
        this.reducedMotion.addEventListener("change", applyMotion);

        this.buildScene();
        this.buildMarkers();
        this.bindControls();
        this.bindKeyboard();
        this.bindPanels();
        this.placeCamera(this.isPortrait() ? START_PORTRAIT : START);

        /*
         * The readout follows the cursor: one ray-plane intersection per move, which
         * is far cheaper than a raycast against geometry. The pointer position is
         * stored and resolved during the frame that follows, so moving the mouse
         * never does work twice.
         */
        this.pointer = null;
        this.canvas.addEventListener("pointermove", (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.pointer = {
                x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
                y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
            };
        });
        this.canvas.addEventListener("pointerleave", () => {
            this.pointer = null;
        });

        window.addEventListener("resize", () => this.resize());
        this.resize();
    }

    buildScene() {
        this.materials = {
            stars: pointsMaterial({ maxSize: 5.5, minSize: 1.2, nearFade: 0.08, sharpness: 23, lane: true }),
            gas: pointsMaterial({ maxSize: 900, nearFade: 7, sharpness: 2.5, lane: true, soft: true, cloud: 0.85 }),
            bulge: pointsMaterial({ maxSize: 640, nearFade: 2.5, sharpness: 2.3, soft: true }),
            knots: pointsMaterial({ maxSize: 12, nearFade: 0.6, sharpness: 9, lane: true }),
            scattered: pointsMaterial({ maxSize: 11, minSize: 2.7, nearFade: 0.3, sharpness: 6 }),
            backdropStars: pointsMaterial({ maxSize: 4, sharpness: 18, attenuate: 0 }),
            // softer falloff than a star, so these read as small fuzzy patches
            galaxyDots: pointsMaterial({ maxSize: 5, sharpness: 5, attenuate: 0 }),
        };
        const backdropStars = new THREE.Points(buildBackdropStars().geometry(), this.materials.backdropStars);
        backdropStars.frustumCulled = false;
        this.scene.add(backdropStars);

        const galaxyDots = new THREE.Points(buildGalaxyDots().geometry(), this.materials.galaxyDots);
        galaxyDots.frustumCulled = false;
        this.scene.add(galaxyDots);

        this.core = buildCore();
        this.scene.add(this.core.group);

        /*
         * A galaxy does not end at its disk. The stellar halo and the gas around it
         * are far too faint to resolve, but together they are why a galaxy on a long
         * exposure sits in a soft glow instead of being cut out of black card.
         */
        this.haloGlow = glowSprite(new THREE.Color(0.36, 0.4, 0.72), 230, 0.05);
        this.haloGlow.renderOrder = -2;
        this.scene.add(this.haloGlow);

        this.bulge = new THREE.Points(buildBulgeGlow().geometry(), this.materials.bulge);
        this.bulge.renderOrder = 4;
        this.bulge.frustumCulled = false;
        this.bulge.layers.set(SOFT_LAYER);
        this.scene.add(this.bulge);

        this.arms = buildArmOutlines();
        this.scene.add(this.arms.group);

        this.deepSky = (DATA.deepSky || [])
            .filter((o) => o.kind !== "structure")
            .map((o) => ({ ...o, position: truePosition(o.l, o.b, o.d) }));
        this.structures = (DATA.deepSky || []).filter((o) => o.kind === "structure");
        this.deepSkyPoints = buildDeepSky(this.deepSky);
        this.scene.add(this.deepSkyPoints.group);

        this.galaxies = DATA.galaxies || [];
        const pole = DATA.celestialPole
            ? directionFromSun(DATA.celestialPole.l, DATA.celestialPole.b)
            : new THREE.Vector3(0, 1, 0);
        this.galaxyGroup = buildGalaxies(this.galaxies, DATA.backgroundGalaxies || [], this.root.dataset.galaxies, pole, this.loadingManager);
        this.scene.add(this.galaxyGroup.group);

        this.buildLocalGroup();

        /*
         * The artwork drives both the backdrop and the star field, so everything that
         * depends on it waits for the image. Sampling a million stars out of it blocks
         * the main thread for a moment, so the loader is painted first and the build
         * runs a frame later - otherwise the overlay would never appear.
         */
        new THREE.TextureLoader(this.loadingManager).load(this.root.dataset.backdrop, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            this.setLoaderStep("Building the star field");
            this.setLoaderProgress(0.6);
            /*
             * Give the loader one paint before the build blocks the thread, but never
             * depend on a frame arriving: a hidden tab suspends requestAnimationFrame
             * entirely, and the galaxy would sit on the loading screen until the tab
             * came back. The timeout wins in that case.
             */
            let started = false;
            const start = () => {
                if (started) return;
                started = true;
                try {
                    this.buildStarField(texture);
                } catch (error) {
                    // never leave the loader claiming to be working when it is not
                    this.setLoaderStep("Could not build the galaxy");
                    throw error;
                }
            };
            requestAnimationFrame(() => requestAnimationFrame(start));
            setTimeout(start, 120);
        });
    }

    /*
     * The systems on the map. Settings can hide the ones whose pages have nothing
     * on them yet; they are simply not drawn then, rather than tagged.
     */
    visibleSystems() {
        return DATA.systems.filter((s) => DISPLAY.emptySystems !== "hide" || s.ready !== false);
    }

    buildLocalGroup() {
        if (this.local) {
            this.scene.remove(this.local.group);
            this.local.group.traverse((node) => node.geometry?.dispose());
        }
        this.localSystems = this.visibleSystems()
            .filter((s) => !s.placement.fictional && s.placement.d > 0)
            // true positions: the local view is at the same scale as the galaxy
            .map((s) => ({ ...s, position: truePosition(s.placement.l, s.placement.b, s.placement.d) }));
        this.local = buildLocal(this.localSystems, this.structures);
        this.local.group.renderOrder = 7;
        this.scene.add(this.local.group);
    }

    buildStarField(texture) {
        {
            this.backdrop = buildBackdropVolume(texture);
            this.scene.add(this.backdrop.group);
            const galaxy = buildGalaxyFromImage(texture.image);
            // the backdrop darkens its own lanes with the map the star field read
            for (const m of this.backdrop.materials) m.uniforms.uDust.value = galaxy.dustTexture;
            this.scatteredPoints = new THREE.Points(galaxy.scattered.geometry(), this.materials.scattered);
            this.scatteredPoints.renderOrder = 8;
            this.scatteredPoints.frustumCulled = false;
            this.scene.add(this.scatteredPoints);
            /*
             * The unnamed filler gets the landmarks' painted look as well, thinner
             * and quieter: we do not know these objects, but the disk is full of
             * their like, and plain dots made the named ones look like the only
             * nebulae in the galaxy.
             */
            this.scatteredArt = buildDeepSky(galaxy.scattered.objects, { seed: 7311, amount: LITE ? 0.3 : 0.4, cores: false, haloFloor: 2 });
            this.scatteredArt.group.renderOrder = 8;
            this.scene.add(this.scatteredArt.group);
            this.resize();
            for (const [key, order] of [["gas", 1], ["stars", 2], ["knots", 3]]) {
                const points = new THREE.Points(galaxy[key].geometry(), this.materials[key]);
                points.renderOrder = order;
                points.frustumCulled = false;
                if (key === "gas") points.layers.set(SOFT_LAYER);
                this.scene.add(points);
            }
            this.root.classList.add("Ready");
            this.starFieldReady = true;
            this.maybeFinishLoading();
        }
    }

    /* ---------- loading ---------- */

    setLoaderStep(text) {
        const step = document.getElementById("GALAXY_LOADER_STEP");
        if (step) step.textContent = text;
    }

    // the bar only ever moves forward: images and the star field report out of order
    setLoaderProgress(fraction) {
        this.loaderProgress = Math.max(this.loaderProgress || 0, THREE.MathUtils.clamp(fraction, 0, 1));
        const bar = document.getElementById("GALAXY_LOADER_BAR");
        if (bar) bar.style.width = `${Math.round(this.loaderProgress * 100)}%`;
    }

    /*
     * The overlay lifts only when every image is in, the star field exists and the
     * shaders are compiled. It used to say "Ready" the moment the build finished,
     * and then the first frame compiled every shader in the scene - the longest
     * single block of the whole load - so "Ready" sat over a frozen, part-filled bar.
     * Compiling here, behind the loader and with a paint before it, keeps the bar
     * and the words honest.
     */
    async maybeFinishLoading() {
        if (!this.starFieldReady || !this.imagesReady || this.finishing) return;
        this.finishing = true;
        this.setLoaderProgress(0.92);
        this.setLoaderStep("Preparing the view");
        const paint = () => new Promise((resolve) => setTimeout(resolve, 40));
        await paint();
        try {
            await this.renderer.compileAsync(this.scene, this.camera);
        } catch (error) {
            // a failed pre-compile only means the first frame does the work instead
        }
        this.setLoaderProgress(1);
        this.setLoaderStep("Ready");
        await paint();
        const loader = document.getElementById("GALAXY_LOADER");
        if (loader) loader.classList.add("Done");
    }

    buildMarkers() {
        // rebuilt when the units change, so clear out the previous set first
        for (const marker of this.markers || []) marker.el.remove();
        this.markers = [];
        this.registry = [];
        this.systemMarkers = new Map();
        this.places = [];
        const add = (options) => {
            const marker = new Marker(options);
            this.labels.appendChild(marker.el);
            this.markers.push(marker);
            return marker;
        };

        /*
         * Arm names are map annotations for the wide view: they need a few degrees
         * of tilt to be readable along the arm (see frame()), and they bow out as
         * the camera comes in close enough that one arm fills the screen.
         */
        // every arm is also listed under "In view now", and flies there
        const armLabel = ({ position, tangent, name, sub = "", near = 12 }) => {
            const marker = add({ position, tangent, name, level: "galaxy", layer: "arms", kind: "region", near });
            this.registry.push({
                group: "Spiral arms",
                name,
                sub,
                marker,
                fly: () => this.flyTo({ target: new THREE.Vector3(position.x, 0, position.z), distance: 22, polar: 0.75 }),
            });
        };
        for (const arm of ARMS) {
            const phase = armPhase(arm.crossing);
            armLabel({ position: armPoint(phase, arm.label), tangent: armPoint(phase, arm.label * 1.08), name: arm.name, sub: arm.kind });
            if (arm.outerLabel) armLabel({ position: armPoint(phase, arm.outerAt), tangent: armPoint(phase, arm.outerAt * 1.08), name: arm.outerLabel, sub: "Norma's outer reaches" });
        }
        const spurPhase = armPhase(ORION_SPUR.crossing);
        armLabel({
            position: armPoint(spurPhase, 29.5).add(new THREE.Vector3(2.5, 0, 0)),
            tangent: armPoint(spurPhase, 30.5).add(new THREE.Vector3(2.5, 0, 0)),
            name: ORION_SPUR.name,
            sub: "The Sun's own spur",
            near: 6,
        });
        // the two arms that hug the bar: named, but schematic (see THREE_KPC_ARMS)
        for (const arm of THREE_KPC_ARMS) {
            const position = new THREE.Vector3(arm.x, 0, arm.z);
            const along = new THREE.Vector3(Math.cos(arm.angle), 0, Math.sin(arm.angle));
            armLabel({ position, tangent: position.clone().add(along), name: arm.name, sub: "Hugs the bar · placement schematic", near: 8 });
        }

        /*
         * The galactic centre is a landmark, labelled the way the nebulae and
         * clusters are, not a destination like a star system. From close in it
         * hands over to the two structures you can actually see there.
         */
        this.coreMarker = add({
            position: ORIGIN.clone(),
            name: "Galactic Centre",
            sub: `Sgr A* · black hole of ${formatMass(solarMasses(4.3e6))} · ${formatLy(DATA.sunDistance)}`,
            level: "galaxy",
            layer: "arms",
            kind: "region",
            far: DEEP_SKY_LABEL_DISTANCE,
            near: 16,
            measureFrom: "camera",
            priority: 1.9,
        });
        add({
            position: new THREE.Vector3(0, this.core.shellRadius, 0),
            name: "Nuclear bulge",
            sub: "Densest stars and black holes in the galaxy",
            level: "galaxy",
            layer: "arms",
            kind: "region",
            far: 34,
            measureFrom: "camera",
            priority: 1.9,
        });
        add({
            position: new THREE.Vector3(0, -this.core.shellRadius * 0.75, 0),
            name: "Nuclear star cluster",
            sub: "Millions of stars within a few light-years",
            level: "galaxy",
            layer: "arms",
            kind: "region",
            far: 26,
            measureFrom: "camera",
            priority: 1.95,
        });

        /*
         * Star systems. From the galaxy, the Sun's surroundings are far too small to
         * pull apart, so they are one compact marker with a dot per system. Hovering,
         * focusing or tapping the dots opens it into a chip per system, each a link
         * to its page; the name flies in to the local view, where every system has
         * its own label at its true distance.
         *
         * It is called the Solar Neighbourhood, the astronomers' name for the stars
         * within a few hundred light-years of the Sun. "Local cluster" would be
         * wrong: the Sun belongs to no star cluster, and the Local Group is the
         * group of galaxies the Milky Way is part of.
         */
        const sun = this.visibleSystems().find((s) => s.placement.d === 0 && !s.placement.fictional);
        const neighbours = [...(sun ? [sun] : []), ...[...this.localSystems].sort((a, b) => a.placement.d - b.placement.d)];
        const farthest = Math.max(0, ...this.localSystems.map((s) => s.placement.d));
        this.neighbourhood = add({
            position: SUN,
            name: "Solar Neighbourhood",
            sub: `${neighbours.length} star systems within ${formatLy(farthest)}`,
            level: "galaxy",
            color: "#9ecbff",
            onClick: () => this.flyToSun(),
            members: neighbours.map((s) => ({
                name: s === sun ? "Sun" : s.name,
                href: s.href,
                color: s.color,
                distance: s === sun ? "here" : formatLy(s.placement.d),
                title: `${s === sun ? "The Solar System" : `${s.name}, ${formatLy(s.placement.d)} away`}: open its page`,
            })),
        });
        if (sun) {
            const marker = add({ position: SUN, name: "Sun", sub: "Solar System · you are here", level: "local", href: sun.href, color: sun.color });
            this.systemMarkers.set(sun.href, marker);
            this.registry.push({ group: "Star systems", name: "Sun", sub: "Solar System", marker, fly: () => this.flyToSun() });
        }
        for (const s of this.localSystems) {
            const marker = add({ position: s.position, name: s.name, sub: formatLy(s.placement.d), level: "local", href: s.href, color: s.color });
            this.systemMarkers.set(s.href, marker);
            this.registry.push({
                group: "Star systems",
                name: s.name,
                sub: formatLy(s.placement.d),
                marker,
                // close enough that the system stands clear of the Sun
                fly: () => this.flyTo({ target: s.position.clone(), distance: Math.max((s.placement.d / 1000) * 2.2, 0.014) }),
            });
        }
        for (const s of this.visibleSystems().filter((s) => s.placement.fictional)) {
            const position = new THREE.Vector3(s.placement.x / 1000, 0, s.placement.z / 1000);
            const sub = [s.placement.source, s.placement.note, "placed by eye"].filter(Boolean).join(" · ");
            const marker = add({ position, name: s.name, sub, level: "any", layer: "fiction", href: s.href, color: s.color, variant: "fiction", far: 40, measureFrom: "camera" });
            this.systemMarkers.set(s.href, marker);
        }

        /*
         * Real planetary systems beyond the neighbourhood, with no page yet. They are
         * drawn and named, and a click flies there; they come in as the camera nears
         * them, so the wide view is not buried in names.
         */
        for (const s of DATA.planetarySystems || []) {
            const position = truePosition(s.l, s.b, s.d);
            const fly = () => this.flyTo({ target: position.clone(), distance: Math.max((s.d / 1000) * 0.5, 0.25) });
            const marker = add({
                position,
                name: s.name,
                // the map says where; the side panel says why it matters
                sub: formatLy(s.d),
                level: "any",
                variant: "map",
                color: "#9ecbff",
                far: Math.max(4, (s.d / 1000) * 2.2),
                measureFrom: "camera",
                priority: 0.4,
                onClick: fly,
            });
            this.places.push({ kind: "map", type: "system", data: s, marker, fly, position, distance: s.d });
        }

        /*
         * Places from fiction: dashed and violet, on their own layer, so the real map
         * can always be had without them. A place a story sets at a real star sits
         * at that star; the rest are placed by eye and say so.
         */
        for (const f of DATA.fiction || []) {
            const anchored = f.d !== undefined;
            const position = anchored ? truePosition(f.l, f.b, f.d) : new THREE.Vector3(f.x / 1000, 0, f.z / 1000);
            const near = anchored && f.d < 1000;
            const fly = () => this.flyTo({ target: position.clone(), distance: anchored ? Math.max((f.d / 1000) * 2.2, LOCAL_MIN_DISTANCE * 1.5) : 8 });
            const marker = add({
                position,
                name: f.name,
                sub: [f.source, f.note, anchored ? "" : "placed by eye"].filter(Boolean).join(" · "),
                level: "any",
                layer: "fiction",
                variant: "fiction",
                object: f.type === "object",
                color: "#c7a6ff",
                far: f.d < 0.01 ? 0.004 : near ? 1.6 : 40,
                measureFrom: "camera",
                priority: 0.8,
                onClick: fly,
            });
            this.places.push({ kind: "fiction", type: f.type, data: f, marker, fly, position, distance: anchored ? f.d : position.distanceTo(SUN) * 1000 });
        }

        /*
         * Real things that are not star systems: the Voyagers, the farthest objects
         * we have sent. At true scale they are a light-day out, so they only part
         * from the Sun at the bottom of the local zoom.
         */
        for (const c of DATA.spacecraft || []) {
            const ly = c.au / 63241;
            const position = truePosition(c.l, c.b, ly);
            const fly = () => this.flyTo({ target: SUN.clone(), distance: (ly / 1000) * 3.2, polar: 1.1 });
            const marker = add({
                position,
                name: c.name,
                sub: formatLy(ly),
                level: "local",
                object: true,
                color: "#e6eaf2",
                far: (ly / 1000) * 40,
                measureFrom: "camera",
                priority: 0.6,
                onClick: fly,
            });
            this.places.push({ kind: "real", type: "object", data: { ...c, d: ly }, marker, fly, position, distance: ly });
        }

        /*
         * Landmarks sit at their true positions at every zoom, so the same labels
         * serve both levels: the Pleiades and the Orion Nebula are simply there in
         * the local view, at their real distances.
         */
        for (const o of this.deepSky) {
            const style = DEEP_SKY_STYLE[o.kind];
            const marker = add({
                position: o.position,
                name: o.name,
                sub: `${o.alias} · ${style.label} · ${formatLy(o.d)}`,
                level: "any",
                layer: "deepsky",
                // measured to the object itself, so landmarks come in around
                // wherever the camera is rather than all at once
                far: DEEP_SKY_LABEL_DISTANCE,
                measureFrom: "camera",
                kind: "region",
            });
            this.registry.push({
                group: "Nebulae & clusters",
                name: o.name,
                sub: `${style.label} · ${formatLy(o.d)}`,
                marker,
                fly: () => this.flyTo({ target: o.position.clone(), distance: Math.max(o.d / 1000, 1.2) }),
            });
        }
        for (const g of this.galaxies) {
            const position = truePosition(g.l, g.b, g.display);
            const compressed = g.display !== g.d ? " · shown closer" : "";
            const marker = add({
                position,
                name: g.name,
                sub: `${g.alias} · ${formatLy(g.d)}${compressed}`,
                level: "galaxy",
                layer: "arms",
                kind: "region",
                alias: g.alias,
            });
            // listed for reference only: the camera stays with the Milky Way, so
            // other galaxies are context rather than places to visit
            this.registry.push({
                group: "Galaxies",
                name: g.name,
                sub: `${formatLy(g.d)}${compressed}`,
                marker,
            });
        }
        for (const s of this.structures) {
            const marker = add({
                position: SUN.clone().add(new THREE.Vector3(0, 0, -s.radius / 1000)),
                name: s.name,
                sub: `${s.alias} · about ${formatLy(s.radius * 2)} across`,
                level: "local",
                layer: "deepsky",
                kind: "region",
            });
            this.registry.push({ group: "Nebulae & clusters", name: s.name, sub: s.alias, marker, fly: () => this.flyToSun() });
        }
        for (const ly of LOCAL_RINGS_LY) {
            /*
             * Each ring's name only while the ring is a readable size: the 10 ly ring
             * is a dot from where the 1,000 ly ring fits, and the other way round.
             */
            add({
                position: SUN.clone().add(new THREE.Vector3(0, 0, -ly / 1000)),
                name: formatLy(ly),
                level: "local",
                kind: "ring",
                far: (ly / 1000) * 14,
                near: (ly / 1000) * 0.9,
            });
        }
    }

    bindControls() {
        // the dock's jump chips and the zoom buttons share one vocabulary
        this.root.querySelectorAll("[data-action]").forEach((button) => {
            button.addEventListener("click", () => {
                const action = button.dataset.action;
                if (action === "overview") this.flyTo({ ...OVERVIEW, distance: this.framed(OVERVIEW.distance) });
                if (action === "sun") this.flyToSun();
                if (action === "core") this.flyTo({ target: ORIGIN.clone(), distance: 24, polar: 0.95 });
                /*
                 * 89.5 degrees, not 88.7. From 1.3 degrees up, every sight line to a
                 * star below the plane crosses the dust slab at a grazing angle inside
                 * the disk, so the whole lower half of the band dimmed together and no
                 * bright light was left under the lane - it read as a shaded band, not
                 * a lane (measured: no recovery below the dip at all). From half a
                 * degree, those sight lines cross the plane outside the disk's dust, so
                 * the band is lit on both sides of a dark stripe: 586, 359, 465 across
                 * it, in summed RGB.
                 */
                if (action === "edge") this.flyTo({ target: ORIGIN.clone(), distance: this.framed(96), polar: THREE.MathUtils.degToRad(89.5) });
                if (action === "zoom-in") this.zoomBy(0.6);
                if (action === "zoom-out") this.zoomBy(1 / 0.6);
            });
        });
    }

    /*
     * The keyboard drives the same moves as the mouse: arrows pan across the disk
     * relative to where the camera faces, Shift turns and tilts, +/- zoom, Home goes
     * back to the whole galaxy. Keys are ignored while a form control has focus, so
     * the dock's switches and links keep their own keys.
     */
    bindKeyboard() {
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        window.addEventListener("keydown", (event) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const el = document.activeElement;
            const typing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
            if (typing) return;
            // arrows belong to whatever has focus, unless that is the map or nothing
            const mapHasKeys = !el || el === document.body || el === this.canvas;
            const s = this.spherical();
            const target = this.controls.target.clone();
            let move = null;
            switch (event.key) {
                case "+":
                case "=":
                    this.zoomBy(0.75);
                    break;
                case "-":
                case "_":
                    this.zoomBy(1 / 0.75);
                    break;
                case "Home":
                    this.flyTo({ ...OVERVIEW, distance: this.framed(OVERVIEW.distance) });
                    break;
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "ArrowDown": {
                    if (!mapHasKeys) return;
                    const sign = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
                    const sideways = event.key === "ArrowLeft" || event.key === "ArrowRight";
                    if (event.shiftKey) {
                        // turn around the pivot, or tilt towards and away from the plane
                        move = sideways
                            ? { azimuth: s.theta - sign * 0.14 }
                            : { polar: THREE.MathUtils.clamp(s.phi + sign * 0.09, this.controls.minPolarAngle, this.controls.maxPolarAngle) };
                    } else {
                        // pan along the disk, in the directions the camera is facing
                        this.camera.getWorldDirection(forward).setY(0).normalize();
                        right.crossVectors(forward, this.camera.up).normalize();
                        const step = s.radius * 0.1;
                        if (sideways) target.addScaledVector(right, sign * step);
                        else target.addScaledVector(forward, -sign * step);
                        move = {};
                    }
                    break;
                }
                default:
                    return;
            }
            event.preventDefault();
            if (move) this.flyTo({ target, distance: s.radius, polar: move.polar ?? s.phi, azimuth: move.azimuth ?? s.theta }, 280);
        });
    }

    bindPanels() {
        /*
         * The dock. This page is the site's map, so the first thing in it is the
         * list of places you can go: every star system, as a link to its page with
         * a button beside it that flies the camera there instead.
         */
        const dock = document.getElementById("GALAXY_DOCK");
        const toggle = document.getElementById("GALAXY_DOCK_TOGGLE");
        const setCollapsed = (collapsed) => {
            dock.classList.toggle("Collapsed", collapsed);
            toggle.setAttribute("aria-expanded", String(!collapsed));
        };
        toggle.addEventListener("click", () => setCollapsed(!dock.classList.contains("Collapsed")));
        // on a narrow window the dock would cover the map it is the index to
        const narrow = window.matchMedia(`(max-width: ${NARROW_WIDTH}px)`);
        if (narrow.matches) setCollapsed(true);
        narrow.addEventListener("change", (event) => setCollapsed(event.matches));

        this.renderSystemList();
        this.bindLayers();
        this.bindLegend();
        this.bindSettings();

        // a change of units relabels everything that prints a quantity
        onUnitsChange(() => {
            this.buildMarkers();
            this.renderSystemList();
            this.resize();
        });
    }

    /*
     * The two catalogue panels on the left. They are rebuilt whenever the markers
     * are (units, hidden systems), and re-sorted by what is in view as you move.
     */
    renderSystemList() {
        if (!this.systemPanel) {
            this.systemPanel = new Catalogue(document.getElementById("PANEL_SYSTEMS"), {
                storageKey: "galaxyPanel:systems",
                filters: [["page", "With a page"], ["map", "Map only"], ["fiction", "Fiction"]],
            });
            this.objectPanel = new Catalogue(document.getElementById("PANEL_OBJECTS"), {
                storageKey: "galaxyPanel:objects",
                filters: [["real", "Real"], ["fiction", "Fiction"]],
            });
            this.landmarkPanel = new Catalogue(document.getElementById("PANEL_LANDMARKS"), {
                storageKey: "galaxyPanel:landmarks",
                filters: [["nebula", "Nebulae"], ["cluster", "Clusters"], ["remnant", "Supernovae"], ["planetary", "Planetary"], ["structure", "Structure"]],
            });
        }
        const seen = (marker) => () => Boolean(marker?.inView);
        const systems = [];
        for (const system of this.visibleSystems()) {
            const fiction = Boolean(system.placement.fictional);
            const marker = this.systemMarkers.get(system.href);
            const home = system.placement.d === 0 && !fiction;
            const found = this.registry.find((e) => e.marker === marker);
            systems.push({
                id: `page-${system.href}`,
                name: home ? "Sun · Solar System" : system.name,
                sub: fiction ? [system.placement.source, system.placement.note].filter(Boolean).join(" · ") : home ? "Home · you are here" : formatLy(system.placement.d),
                search: fiction ? "fiction" : "",
                color: system.color,
                style: fiction ? "fiction" : "page",
                filter: fiction ? "fiction" : "page",
                href: system.href,
                fly: found?.fly || (() => this.flyTo({ target: marker.position.clone(), distance: 8 })),
                // from afar a nearby system is in view when its neighbourhood is
                inView: () => Boolean(marker?.inView || (!fiction && this.neighbourhood?.inView)),
                distance: fiction ? Infinity : system.placement.d,
            });
        }
        // star systems go to the first panel, everything else to Objects
        const objects = [];
        for (const place of this.places) {
            const d = place.data;
            const fiction = place.kind === "fiction";
            const entry = {
                id: `${place.kind}-${d.name}`,
                name: d.name,
                sub: fiction ? [d.source, d.note].filter(Boolean).join(" · ") : `${formatLy(d.d)} · ${d.note}`,
                search: fiction ? `fiction ${d.source}` : "",
                color: place.kind === "map" ? "#9ecbff" : fiction ? "#c7a6ff" : "#e6eaf2",
                style: place.type === "object" ? (fiction ? "fiction-object" : "object") : place.kind,
                filter: place.type === "object" ? (fiction ? "fiction" : "real") : place.kind,
                fly: place.fly,
                inView: seen(place.marker),
                distance: place.distance,
            };
            (place.type === "object" ? objects : systems).push(entry);
        }
        this.systemPanel.setEntries(systems);
        this.objectPanel.setEntries(objects);

        const landmarks = [];
        const kindFilter = { nebula: "nebula", open: "cluster", globular: "cluster", remnant: "remnant", planetary: "planetary" };
        for (const entry of this.registry) {
            if (entry.group === "Nebulae & clusters") {
                const o = this.deepSky.find((d) => d.name === entry.name) || this.structures.find((d) => d.name === entry.name);
                landmarks.push({
                    id: `deep-${entry.name}`,
                    name: entry.name,
                    sub: o?.kind === "structure" ? o.alias : `${DEEP_SKY_STYLE[o.kind].label} · ${formatLy(o.d)}`,
                    search: o?.alias || "",
                    color: DEEP_SKY_STYLE[o?.kind || "structure"].color,
                    style: o?.kind || "structure",
                    filter: kindFilter[o?.kind] || "structure",
                    fly: entry.fly,
                    inView: seen(entry.marker),
                    distance: o?.d ?? 0,
                });
            } else if (entry.group === "Spiral arms" || entry.group === "Galaxies") {
                const arm = entry.group === "Spiral arms";
                landmarks.push({
                    id: `${arm ? "arm" : "galaxy"}-${entry.name}`,
                    name: entry.name,
                    sub: arm ? `Spiral arm · ${entry.sub}` : `Galaxy · ${entry.sub}`,
                    search: arm ? "arm spiral" : "galaxy",
                    color: arm ? "#8fa7d8" : "#c9d6ff",
                    style: arm ? "arm" : "galaxy",
                    filter: "structure",
                    fly: entry.fly,
                    inView: seen(entry.marker),
                    distance: arm ? entry.marker.position.distanceTo(SUN) * 1000 : Infinity,
                });
            }
        }
        landmarks.push({
            id: "core",
            name: "Galactic Centre",
            sub: `Sgr A* and the bulge · ${formatLy(DATA.sunDistance)}`,
            search: "sgr a* core bulge black hole",
            color: "#ffd9a0",
            style: "core",
            filter: "structure",
            fly: () => this.flyTo({ target: ORIGIN.clone(), distance: 24, polar: 0.95 }),
            inView: seen(this.coreMarker),
            distance: DATA.sunDistance,
        });
        this.landmarkPanel.setEntries(landmarks);
    }

    updateCatalogues(now) {
        if (now - this.lastListUpdate < 400) return;
        this.lastListUpdate = now;
        this.systemPanel?.refresh();
        this.objectPanel?.refresh();
        this.landmarkPanel?.refresh();
    }

    /*
     * The legend sits under the layers. It shows the few keys that matter most and
     * opens to all of them on hover, focus or a tap.
     */
    bindLegend() {
        const legend = document.getElementById("GALAXY_LEGEND");
        const list = document.getElementById("GALAXY_LEGEND_LIST");
        const head = legend.querySelector(".LegendHead");
        const keys = [
            ["Star system, opens its page", "#ffffff", "Ring", true],
            ["Real system, map only", "#9ecbff", "Ring Hollow", true],
            ["Place from fiction", "#c7a6ff", "Ring Fiction", true],
            ["Object: spacecraft or station", "#e6eaf2", "Diamond", true],
            ["Spiral arm", "#8fa7d8", "Dash", true],
            [DEEP_SKY_STYLE.nebula.label, DEEP_SKY_STYLE.nebula.color, "", true],
            [DEEP_SKY_STYLE.open.label, DEEP_SKY_STYLE.open.color, "", true],
            [DEEP_SKY_STYLE.globular.label, DEEP_SKY_STYLE.globular.color],
            [DEEP_SKY_STYLE.remnant.label, DEEP_SKY_STYLE.remnant.color, "Ring"],
            [DEEP_SKY_STYLE.planetary.label, DEEP_SKY_STYLE.planetary.color, "Ring"],
            ["Galactic centre and bulge", "#ffd9a0"],
            ["Other galaxy, at its real tilt", "#c9d6ff", "Oval"],
            ["Star-forming gas", "#ff8fb0"],
            ["Local rings: 10, 100, 1,000 ly", "#9ecbff", "Line"],
        ];
        for (const [label, color, shape = "", primary = false] of keys) {
            const item = document.createElement("li");
            if (primary) item.className = "Primary";
            item.innerHTML = `<span class="LegendDot ${shape}"></span><span></span>`;
            item.firstChild.style.setProperty("--legend-color", color);
            item.lastChild.textContent = label;
            list.appendChild(item);
        }
        head.addEventListener("click", () => {
            const open = !legend.classList.contains("Open");
            legend.classList.toggle("Open", open);
            head.setAttribute("aria-expanded", String(open));
        });
    }

    /*
     * The Layers row, top right: one icon per layer, each with a tooltip that names
     * it, says what it covers and carries its part of the legend - the legend lives
     * there rather than in the dock, next to the switch for the things it explains.
     * Choices are remembered per browser. Galaxies used to share a switch with the
     * arms, so until it has a setting of its own it inherits theirs.
     */
    bindLayers() {
        const read = (key) => {
            try {
                return localStorage.getItem(`galaxyLayer:${key}`);
            } catch (e) {
                return null;
            }
        };
        this.root.querySelectorAll(".LayerToggle[data-layer]").forEach((button) => {
            const key = button.dataset.layer;
            const state = button.querySelector(".TipState");
            const saved = read(key);
            const set = (on) => {
                this.layerState[key] = on;
                button.setAttribute("aria-pressed", String(on));
                state.textContent = on ? "Shown · click to hide" : "Hidden · click to show";
            };
            set(saved === null ? true : saved === "1");
            // a touch screen has no hover, so a tap shows the tooltip for a moment
            button.addEventListener("pointerup", (event) => {
                if (event.pointerType === "mouse") return;
                button.classList.add("ShowTip");
                clearTimeout(button.tipTimer);
                button.tipTimer = setTimeout(() => button.classList.remove("ShowTip"), 2200);
            });
            button.addEventListener("click", () => {
                const on = !this.layerState[key];
                set(on);
                try {
                    localStorage.setItem(`galaxyLayer:${key}`, on ? "1" : "0");
                } catch (e) {}
            });
        });
    }

    /*
     * Settings: the units every quantity is printed in, and the rendering detail.
     * Units apply at once and are stored (see units.js); detail needs a reload, so
     * it is a link that carries the choice in the URL, which config.js remembers.
     */
    bindSettings() {
        const dialog = document.getElementById("GALAXY_SETTINGS");
        const opener = document.getElementById("GALAXY_SETTINGS_OPEN");
        if (!dialog || !opener) return;
        // one segmented control per option, for the units and the map alike
        const groups = (container, options, values, apply) => {
            if (!container) return;
            for (const [key, option] of Object.entries(options)) {
                const group = document.createElement("fieldset");
                group.className = "SettingGroup";
                group.innerHTML = '<legend><span class="SettingName"></span><span class="SettingHint"></span></legend><div class="Segmented"></div>';
                group.querySelector(".SettingName").textContent = option.label;
                group.querySelector(".SettingHint").textContent = option.hint;
                const segmented = group.querySelector(".Segmented");
                for (const choice of option.choices) {
                    const label = document.createElement("label");
                    label.innerHTML = `<input type="radio" name="setting-${key}"><span></span><small></small>`;
                    const input = label.querySelector("input");
                    input.value = choice.value;
                    input.checked = values[key] === choice.value;
                    input.addEventListener("change", () => input.checked && apply({ [key]: choice.value }));
                    label.querySelector("span").textContent = choice.label;
                    label.querySelector("small").textContent = choice.example;
                    segmented.appendChild(label);
                }
                container.appendChild(group);
            }
        };
        groups(document.getElementById("GALAXY_SETTINGS_UNITS"), UNIT_OPTIONS, UNITS, setUnits);
        groups(document.getElementById("GALAXY_SETTINGS_MAP"), DISPLAY_OPTIONS, DISPLAY, setDisplay);
        this.applyLabelSize();
        onDisplayChange((display, changes) => {
            if ("labelSize" in changes) {
                this.applyLabelSize();
                this.resize();
            }
            if ("emptySystems" in changes) {
                this.buildLocalGroup();
                this.resize();
                this.buildMarkers();
                this.renderSystemList();
            }
        });

        const detail = document.getElementById("GALAXY_SETTINGS_DETAIL");
        if (detail) {
            const current = QUALITY.auto ? "auto" : QUALITY.tier;
            const choices = [
                ["auto", "Automatic", `now ${LITE ? "lighter" : "full"}`],
                ["full", "Full", "2.3 million stars"],
                ["lite", "Lighter", "for phones and older laptops"],
            ];
            for (const [value, name, note] of choices) {
                const label = document.createElement("label");
                label.innerHTML = `<input type="radio" name="detail"><span></span><small></small>`;
                const input = label.querySelector("input");
                input.checked = value === current;
                input.addEventListener("change", () => {
                    if (input.checked) window.location.search = `?quality=${value}`;
                });
                label.querySelector("span").textContent = name;
                label.querySelector("small").textContent = note;
                detail.appendChild(label);
            }
        }

        opener.addEventListener("click", () => {
            dialog.showModal();
            opener.setAttribute("aria-expanded", "true");
        });
        dialog.addEventListener("close", () => {
            opener.setAttribute("aria-expanded", "false");
            opener.focus();
        });
        // a click on the backdrop, outside the panel, closes it
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) dialog.close();
        });
    }

    // labels are sized in em off this one value (see .GalaxyLabels)
    applyLabelSize() {
        this.labels.style.setProperty("--label-size", String(LABEL_SCALE[DISPLAY.labelSize] ?? 1));
    }

    isPortrait() {
        const width = this.root.clientWidth || window.innerWidth;
        const height = this.root.clientHeight || window.innerHeight;
        return width < height;
    }

    /*
     * The jump chips' distances were set for a landscape window. A portrait one sees
     * a narrower slice across, so wide shots pull back until they cover about the
     * same width - up to the zoom limit. Close shots keep their distance: pulling
     * back from the Sun would leave the local view it exists to show.
     */
    framed(distance) {
        if (!this.isPortrait()) return distance;
        const across = (fov, aspect) => Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect;
        const factor = across(FOV, 1.6) / across(this.camera.fov, this.width / this.height);
        return Math.min(distance * factor, PIVOT.maxDistance);
    }

    spherical() {
        return new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    }

    placeCamera({ target, distance, polar, azimuth }) {
        this.controls.target.copy(target);
        this.camera.position.copy(target).add(new THREE.Vector3().setFromSphericalCoords(distance, polar, azimuth));
        this.controls.update();
    }

    flyTo({ target, distance, polar, azimuth }, duration = 1600) {
        if (this.reducedMotion?.matches || DISPLAY.motion === "cut") duration = 0;
        const from = this.spherical();
        // the near limit depends on where the flight ends, not where it starts
        const radius = THREE.MathUtils.clamp(distance, this.minDistanceAt(target), this.controls.maxDistance);
        const toSph = new THREE.Spherical(radius, polar ?? from.phi, azimuth ?? from.theta);
        this.flight = {
            start: performance.now(),
            duration,
            fromTarget: this.controls.target.clone(),
            toTarget: target.clone(),
            fromSph: from,
            toSph,
        };
        this.lastInteraction = performance.now();
    }

    /*
     * How close the camera may come. Near the Sun the local view is at true scale,
     * where Alpha Centauri is 0.004 units out, so the limit drops to a few
     * light-years; away from it the galaxy's own limit applies. It blends between
     * the two, so panning away from the Sun eases the camera back out.
     */
    minDistanceAt(target) {
        const away = smoothstep(1.2, 4, target.distanceTo(SUN));
        return Math.exp(THREE.MathUtils.lerp(Math.log(LOCAL_MIN_DISTANCE), Math.log(GALAXY_MIN_DISTANCE), away));
    }

    flyToSun() {
        this.flyTo({ target: SUN, distance: SUN_VIEW.distance, polar: SUN_VIEW.polar });
    }

    zoomBy(factor) {
        const s = this.spherical();
        this.flyTo({ target: this.controls.target.clone(), distance: s.radius * factor }, 600);
    }

    stepFlight(now) {
        const f = this.flight;
        // a zero-length flight is a cut (reduced motion)
        const t = f.duration > 0 ? Math.min((now - f.start) / f.duration, 1) : 1;
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        // interpolate the distance logarithmically so long zooms feel even
        const radius = Math.exp(THREE.MathUtils.lerp(Math.log(f.fromSph.radius), Math.log(f.toSph.radius), e));
        let dTheta = f.toSph.theta - f.fromSph.theta;
        dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
        const target = f.fromTarget.clone().lerp(f.toTarget, e);
        const offset = new THREE.Vector3().setFromSphericalCoords(
            radius,
            THREE.MathUtils.lerp(f.fromSph.phi, f.toSph.phi, e),
            f.fromSph.theta + dTheta * e
        );
        this.controls.target.copy(target);
        this.camera.position.copy(target).add(offset);
        if (t >= 1) this.flight = null;
    }

    resize() {
        const width = this.root.clientWidth || window.innerWidth;
        const height = this.root.clientHeight || window.innerHeight;
        this.renderer.setSize(width, height, false);
        const buffer = this.renderer.getDrawingBufferSize(new THREE.Vector2());
        this.post.setSize(buffer.x, buffer.y);
        /*
         * The galaxy is parked right of centre to leave the left side free for the
         * panels. This is a projection offset rather than a moved camera target: the
         * frustum is widened and only its left part is rendered, so the galactic
         * centre lands at about 58% of the width while the view keeps its scale, its
         * pivot limits and its mouse picking - all of which read the same projection
         * matrix and so follow along for free.
         */
        // on a narrow screen the dock starts collapsed, so there is nothing to make room for
        const shift = width > NARROW_WIDTH ? width * VIEW_SHIFT : 0;
        /*
         * A portrait screen keeps the vertical field of view and loses the sides: at
         * a phone's 0.46 aspect only 24 degrees of width are left, which crops the
         * disk to a sliver. Widening the vertical angle by the square root of the
         * lost aspect splits the difference - 35 degrees across, 69 tall - without
         * the fish-eye a full horizontal match would need.
         */
        const aspect = width / height;
        this.camera.fov = aspect < 1 ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV / 2)) / Math.sqrt(aspect))) : FOV;
        this.portrait = aspect < 1;
        this.camera.aspect = (width + 2 * shift) / height;
        this.camera.updateProjectionMatrix();
        this.camera.setViewOffset(width + 2 * shift, height, 0, 0, width, height);
        this.width = width;
        this.height = height;
        // point sizes are authored for a ~900px tall view seen from ~80 units away
        const scale = (height / 900) * this.renderer.getPixelRatio() * 80;
        for (const m of [...Object.values(this.materials), this.local.dotMaterial, ...this.deepSkyPoints.materials, ...(this.scatteredArt?.materials || []), this.core.material, this.core.holeMaterial]) {
            m.uniforms.uScale.value = scale;
        }
        for (const key of ["gas", "bulge"]) this.materials[key].uniforms.uScale.value = scale * this.post.softScale;
        this.iconHalf = Math.min(width, height) * 0.0055;
        // label boxes are sized in vmin, so they change with the viewport
        for (const marker of this.markers) {
            marker.width = 0;
            marker.height = 0;
        }
    }

    // where the cursor's ray crosses the galactic plane, or null if it misses
    pointerOnPlane(height = 0) {
        if (!this.pointer) return null;
        RAYCASTER.setFromCamera(this.pointer, this.camera);
        GALACTIC_PLANE.constant = -height;
        const hit = RAYCASTER.ray.intersectPlane(GALACTIC_PLANE, SCRATCH_VECTOR);
        if (!hit) return null;
        if (hit.length() > GALAXY_RADIUS * 4) return null;
        return hit;
    }

    frame(now) {
        if (!this.running) return;
        requestAnimationFrame((t) => this.frame(t));

        if (this.flight) this.stepFlight(now);
        this.controls.update();

        const target = this.controls.target;
        this.controls.minDistance = this.minDistanceAt(target);
        const cameraDistance = this.spherical().radius;
        /*
         * The local view goes down to a few light-years, a thousandth of the
         * galaxy's scale, so the near plane follows the camera in. A fixed one would
         * either clip the Sun's neighbours or waste the depth buffer on the galaxy.
         */
        const near = THREE.MathUtils.clamp(cameraDistance * 0.02, 1e-8, 0.01);
        if (Math.abs(near - this.camera.near) > this.camera.near * 0.1) {
            this.camera.near = near;
            this.camera.updateProjectionMatrix();
        }

        /*
         * The pivot never leaves the Milky Way, but how much of it is in reach
         * depends on the zoom: the rim when close, the core when pulled back.
         */
        const reach = smoothstep(PIVOT.nearDistance, PIVOT.maxDistance, cameraDistance);
        const pivotRadius = THREE.MathUtils.lerp(PIVOT.nearRadius, PIVOT.farRadius, reach);
        const pivotHeight = THREE.MathUtils.lerp(PIVOT.nearHeight, PIVOT.farHeight, reach);
        /*
         * Ease back into the allowance rather than snapping to it. Zooming out
         * shrinks the allowance, and a hard clamp would yank the view towards the
         * core; this glides it back over a handful of frames instead.
         */
        const flat = Math.hypot(target.x, target.z);
        if (flat > pivotRadius) {
            const scale = Math.max(pivotRadius, flat * 0.88) / flat;
            target.x *= scale;
            target.z *= scale;
        }
        if (Math.abs(target.y) > pivotHeight) {
            target.y = Math.sign(target.y) * Math.max(pivotHeight, Math.abs(target.y) * 0.88);
        }
        const sunDistance = this.camera.position.distanceTo(SUN);
        const local = 1 - smoothstep(LOCAL_FULL, LOCAL_ENTER, sunDistance);

        this.local.group.visible = local > 0.01 && this.layerState.systems !== false;
        for (const m of this.local.materials) m.opacity = 0.35 * local;
        this.local.dotMaterial.uniforms.uOpacity.value = local;
        this.materials.gas.uniforms.uOpacity.value = 1 - 0.6 * local;

        /*
         * Individual stars are faint on purpose: at a distance thousands of them
         * overlap and sum into a solid disk. Up close that overlap is gone, each
         * star stands alone against black, and the field reads pale and washed out.
         * So the closer the camera gets, the more each surviving star is worth -
         * which keeps the exposure of the wide view untouched while giving the
         * close-up its contrast back.
         */
        /*
         * Close in, attenuation inflates every sprite: stars reach their size cap and
         * the haze blobs cover hundreds of pixels each, which is where the frame cost
         * goes. Nothing is gained visually by letting them grow that far, so the caps
         * tighten as the camera approaches. This is the cheapest lever on the worst
         * case - the core close-up - and it leaves the wide view untouched.
         */
        // how far the camera sits above the disk's plane, 0 edge-on and 1 overhead
        const elevation = Math.abs(this.camera.position.y - target.y) / Math.max(cameraDistance, 0.001);
        /*
         * The lane costs ~1.4ms of vertex work across 2.3M points, and more than a
         * few degrees off the plane the column is so short that it changes nothing -
         * so it is switched off there rather than computed and thrown away. The
         * branch is on a uniform, which makes it genuinely free, and the fade is
         * wide enough that nothing pops. Edge-on it is free anyway: the stars it
         * dims produce fragments that fall under the discard threshold, and that
         * saving pays for the arithmetic.
         */
        const laneDepth = DUST.laneDepth * (1 - smoothstep(0.18, 0.3, elevation));
        /*
         * The arm dust is the mirror image: off near the plane, where the long
         * column already draws a lane and where per-star structure would read as
         * the patches and stains the sprite versions produced, and on from a few
         * degrees up, where it is the only thing that can show a lane at all.
         */
        const armDustRamp = smoothstep(0.1, 0.26, elevation);
        /*
         * And its opposite number: the lane that cuts the band when the disk is seen
         * edge-on. It hands over to the arm dust as the view tilts up, so there is
         * always one of the two carrying the dust and never both at full strength.
         */
        const planeLane = DUST.planeLaneDepth * (1 - smoothstep(0.045, 0.2, elevation));
        const armDust = DUST.armDepth * armDustRamp;
        for (const key of ["stars", "knots"]) {
            this.materials[key].uniforms.uLane.value = laneDepth;
            this.materials[key].uniforms.uArmDust.value = armDust;
        }
        /*
         * The soft layers take the same lane per fragment. uUpY is how much of a
         * sprite's height on screen is height in the world: all of it edge-on, none
         * of it from overhead, where the sprite's vertical extent is depth instead.
         */
        const upY = Math.sqrt(Math.max(0, 1 - elevation * elevation));
        for (const key of ["gas", "bulge"]) {
            const u = this.materials[key].uniforms;
            u.uLane.value = 0;
            u.uSoftLane.value = laneDepth * DUST.softLane;
            u.uArmDust.value = key === "gas" ? armDust : 0;
            u.uUpY.value = upY;
            u.uCamY.value = this.camera.position.y;
        }

        const closeness = 1 - smoothstep(15, 60, cameraDistance);
        this.materials.stars.uniforms.uMaxSize.value = THREE.MathUtils.lerp(6.0, 4.8, closeness);
        // caps are in the soft target's pixels, hence the scale
        this.materials.gas.uniforms.uMaxSize.value = THREE.MathUtils.lerp(900, 520, closeness) * this.post.softScale;
        this.materials.bulge.uniforms.uMaxSize.value = THREE.MathUtils.lerp(640, 300, closeness) * this.post.softScale;

        /*
         * From outside, the bulge is a glow. From inside it would be a white wall:
         * the same sprites, each now hundreds of pixels wide, stacked over the whole
         * view. So the glow steps back as the camera enters and the star field and
         * the nucleus - which are what you came in to see - take over.
         */
        const coreNear = 1 - smoothstep(12, 62, this.camera.position.length());
        this.materials.bulge.uniforms.uOpacity.value = THREE.MathUtils.lerp(1, 0.16, coreNear);
        // and the haze goes smoother up close, where a wisp is a whole screen wide
        this.materials.gas.uniforms.uCloud.value = THREE.MathUtils.lerp(0.85, 0.4, closeness);

        const closeGain = 1 - smoothstep(10, 80, cameraDistance);
        this.materials.stars.uniforms.uGain.value = 1 + 5.6 * closeGain;
        this.materials.knots.uniforms.uGain.value = 1 + 2.0 * closeGain;
        this.materials.scattered.uniforms.uGain.value = 1 + 1.0 * closeGain;

        /*
         * The backdrop stays visible at every angle, including edge-on, because the
         * slices give it thickness. It only fades as the camera comes close, where
         * its resolution runs out and our own stars carry the detail.
         */
        if (this.backdrop) {
            // never switched off: it only dims as the camera closes in, where the
            // artwork runs out of resolution and the 3D field carries the detail
            const closeFade = smoothstep(2, 7, cameraDistance);
            // hand the bulge over to the 3D core as the camera comes in
            const coreFade = 1 - smoothstep(22, 65, cameraDistance);
            /*
             * The off-plane sheets exist to give the disk body from a distance. Up
             * close the 3D star field does that job, and five full-screen quads is
             * the most expensive thing in the frame, so the outer sheets bow out.
             */
            const sheetFade = 1 - closeness;
            /*
             * A painting of a galaxy from above is a decal from the side. Edge-on it
             * contributes a smear of light at the mid-plane that obeys none of the
             * dust the 3D layers do, and it was most of why the lane kept washing
             * out there. It bows out as the view flattens and the stars, the haze
             * and the bulge - which all work the lane out for themselves - carry it.
             */
            const flatFade = 0.12 + 0.88 * smoothstep(0.03, 0.24, elevation);
            for (const m of this.backdrop.materials) {
                const sheet = m.userData.offset === 0 ? 1 : sheetFade;
                m.uniforms.uOpacity.value = BACKDROP.opacity * m.userData.weight * closeFade * sheet * flatFade;
                m.uniforms.uCoreFade.value = coreFade;
                /*
                 * Up close the painting is magnified far past its resolution, and
                 * what it has at that scale is the artist's own painted stars -
                 * which, stretched across a grazing plane, came out as a field of
                 * grey flecks under the real star field. The mid-plane sheet drops
                 * to a coarser mip as the camera closes in, so it stays as colour
                 * and loses the flecks.
                 */
                if (m.userData.offset === 0) m.uniforms.uBias.value = 3.6 * Math.pow(closeness, 1.4);
                m.uniforms.uDustStrength.value = DUST.backdropDepth * armDustRamp;
                m.uniforms.uPlaneLane.value = planeLane * m.userData.inLane;
            }
        }

        /*
         * The dashed arm skeleton is a map overlay. Up close it is just scratches
         * across the stars, and flat on it collapses into one line, so it fades with
         * both - but it now holds on down to the middle distances, where finding
         * your way along an arm is most of what the outline is for.
         */
        const armLines = 0.24 * (1 - local) * smoothstep(9, 30, cameraDistance) * smoothstep(0.05, 0.2, elevation);
        this.arms.group.visible = this.layerState.arms !== false && armLines > 0.002;
        this.arms.material.opacity = armLines;
        this.core.shellMaterial.opacity = 0.3 * (1 - local) * (this.layerState.arms !== false ? 1 : 0);

        /*
         * The core obeys the same dust as everything else, which until now it did not:
         * background galaxies were extinguished behind the disk while the galactic
         * centre shone through it at full strength. Seen from above the plane the
         * sight line barely clips the dust and the bulge is bright, as it is in any
         * face-on galaxy; drop into the plane and the line runs the length of the
         * disk, the bulge dims and reddens, and you get the reason the galactic
         * centre is invisible to the naked eye from Earth. The bulge's own density is
         * excluded from the column - we are looking at it, not through it.
         */
        const coreColumn = dustColumn(this.camera.position, ORIGIN, 0);
        // a gentler optical depth than the one used for background galaxies: we are
        // looking at the bulge itself, and face-on it should read bright, the way a
        // bulge does in any photograph of a face-on spiral
        const coreLight = Math.exp(-DUST.opticalDepth * 0.6 * coreColumn);
        // reddening only bites once the extinction is heavy, so a mild column tints
        // rather than oranges the whole bulge
        const reddening = Math.pow(1 - coreLight, 1.6);
        this.core.material.uniforms.uExtinction.value = 0.1 + 0.9 * coreLight;
        this.core.material.uniforms.uTint.value.copy(WHITE).lerp(EXTINCTION_RED, reddening);
        for (const shell of this.core.shells) {
            shell.material.opacity = shell.userData.baseOpacity * (0.1 + 0.9 * coreLight);
            shell.material.color.copy(shell.userData.baseColor).lerp(EXTINCTION_RED, reddening * 0.85);
        }
        /*
         * The black holes are still a reward for going in, but they used to need a
         * dive most people would never make: nothing until 24 units and only full
         * strength inside 13. They now come in from 46 units - about a third of the
         * way out from the core - and are at full strength by 26. The inner fade
         * stays: below ~5 units the camera is inside the cloud itself, where rings
         * of fixed screen size would cover everything.
         */
        const holeFade = smoothstep(3, 7, cameraDistance) * (1 - smoothstep(26, 46, cameraDistance)) * (1 - local);
        this.core.holePoints.visible = holeFade > 0.01;
        this.core.holeMaterial.uniforms.uOpacity.value = holeFade;
        /*
         * Landmarks and galaxies are always drawn. The layer switches only decide
         * whether their labels appear, which is why the panel calls them labels.
         */
        // landmarks are at their true positions at both levels, so they stay
        this.deepSkyPoints.group.visible = true;
        if (this.scatteredPoints) {
            this.scatteredPoints.visible = local < 0.999;
            this.materials.scattered.uniforms.uOpacity.value = 1 - local;
            this.scatteredArt.group.visible = local < 0.999;
            for (const m of this.scatteredArt.materials) m.uniforms.uOpacity.value = 1 - local;
        }
        this.galaxyGroup.group.visible = true;
        /*
         * A photograph on a flat plane has no thickness, so edge-on it degenerates
         * into a razor line. Fade each far-field galaxy out as it turns edge-on
         * rather than pretending a card can be a disc from every angle.
         */
        for (const quad of this.galaxyGroup.quads) {
            const toCamera = this.camera.position.clone().sub(quad.position).normalize();
            const facing = Math.abs(quad.getWorldDirection(SCRATCH_VECTOR).dot(toCamera));
            /*
              * Two things used to black these out: a steep edge-on fade and the full
              * force of the dust column. They are meant to be scenery, so the fade
              * now only bites when the plane is nearly edge-on, and the dust keeps a
              * high floor for them - they sit far outside the disk, and a background
              * galaxy that vanishes entirely just reads as a hole in the sky.
              */
            const transmission = Math.max(diskTransmission(this.camera.position, quad.position), 0.22);
            quad.material.opacity = quad.userData.baseOpacity * smoothstep(0.05, 0.28, facing) * transmission;
        }
        /*
         * Named galaxies get the same treatment, and their labels go with them: a
         * name floating over a galaxy you can barely see through the disk is worse
         * than no name at all.
         */
        this.galaxyTransmission = this.galaxyTransmission || {};
        for (const node of this.galaxyGroup.members) {
            const transmission = diskTransmission(this.camera.position, node.position);
            node.material.opacity = node.userData.baseOpacity * transmission;
            this.galaxyTransmission[node.userData.alias] = transmission;
        }
        this.scaleNote.classList.toggle("Visible", local > 0.5);

        /*
         * Every label fades rather than switches. Each reason is a 0..1 factor and
         * they multiply: the level cross-fades between the galaxy and the local
         * view, distance is handled per marker (see Marker.distanceFade), and the
         * rest are below. The CSS transition smooths whatever is left.
         */
        const galaxyLevel = 1 - smoothstep(0.35, 0.55, local);
        const localLevel = smoothstep(0.45, 0.65, local);
        /*
         * Arm names lie along the arms, so as the disk flattens towards edge-on
         * they all converge into one line and overlap each other. They also stop
         * meaning anything there - you cannot tell one arm from another through
         * the disk - so they bow out with the viewing angle.
         */
        const armTilt = smoothstep(0.08, 0.2, elevation);
        const candidates = [];
        for (const marker of this.markers) {
            const levelMatches = marker.level === "local" ? local > 0.5 : marker.level === "galaxy" ? local < 0.5 : true;
            const level = marker.level === "local" ? localLevel : marker.level === "galaxy" ? galaxyLevel : 1;
            let fade = this.layerState[marker.layer] === false ? 0 : level;
            // a galaxy dimmed by the disk takes its name down with it
            if (marker.alias !== undefined) fade *= smoothstep(0.25, 0.45, this.galaxyTransmission?.[marker.alias] ?? 1);
            if (marker.tangent) fade *= armTilt;
            if (marker.project(this.camera, this.width, this.height, fade, cameraDistance)) candidates.push(marker);
            /*
             * The list reports what is drawn, so it ignores both label collisions and
             * the label switches - turning labels off should not empty the list.
             */
            marker.onScreenAllowed = levelMatches && marker.onScreen;
            // what the side panels sort by: on screen and near enough to be named
            marker.inView = marker.onScreenAllowed && (marker.distanceFactor ?? 1) > 0.04;
        }
        // drop labels whose box would overlap a more important one
        candidates.sort((a, b) => a.priority - b.priority);
        const kept = [];
        const clashes = (marker) =>
            kept.some(
                (other) =>
                    Math.abs(other.boxX - marker.boxX) < (other.width + marker.width) * 0.5 + 8 &&
                    Math.abs(other.boxY - marker.boxY) < (other.height + marker.height) * 0.5 + 2
            );
        for (const marker of candidates) {
            marker.measure();
            if (marker.centered) {
                // region labels are centred on the point
                marker.boxX = marker.screenX;
                marker.boxY = marker.screenY;
                marker.keep = !clashes(marker);
            } else {
                /*
                 * Link labels are the places you can open, so they are never dropped:
                 * in the local view several systems crowd round the Sun and the
                 * declutter used to hide one of them outright. Instead the text tries
                 * the other side of its icon, then steps up or down on a leader line,
                 * and if every spot is taken it is drawn where it was anyway.
                 */
                const step = marker.height + 4;
                let placed = false;
                for (const [side, shift] of LABEL_SPOTS) {
                    marker.side = side;
                    marker.shift = shift * step;
                    marker.boxX = marker.screenX + (side * marker.width) / 2;
                    marker.boxY = marker.screenY + marker.shift + marker.anchorShift;
                    // a label cut off by the edge of the screen is as bad as a hidden one
                    const inside = marker.boxX - marker.width / 2 > 4 && marker.boxX + marker.width / 2 < this.width - 4;
                    if (inside && !clashes(marker)) {
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    marker.side = 1;
                    marker.shift = 0;
                    marker.boxX = marker.screenX + marker.width / 2;
                    marker.boxY = marker.screenY + marker.anchorShift;
                }
                marker.keep = true;
            }
            if (marker.keep) kept.push(marker);
        }
        for (const marker of this.markers) marker.apply(Boolean(marker.candidate && marker.keep), this.iconHalf);

        this.updateCatalogues(now);

        // near the Sun the cursor reads off the plane the Sun sits in, 65 ly up,
        // which at local scale is a big difference
        const probe = this.pointerOnPlane(local > 0.5 ? SUN.y : 0) || target;
        const label = probe === target ? "Target" : "Cursor";
        const fromSun = probe.distanceTo(SUN) * 1000;
        this.readout.textContent = local > 0.5
            ? `${label} · ${formatLy(fromSun < 1 ? 0 : fromSun)} from Sol · true scale`
            : `${label} · ${formatLy(Math.round(probe.length() * 1000))} from core · ${formatLy(Math.round(fromSun))} from Sol`;

        this.post.render(this.scene, this.camera);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.resize();
        requestAnimationFrame((t) => this.frame(t));
    }

    stop() {
        this.running = false;
    }
}
