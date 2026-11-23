# AGENTS.md

Guide for coding agents working on **Universe Library**, a small Django 4.2 educational site about space. Read "Concept" and "State of the project" first; the galaxy section further down is long because the galaxy took most of the effort, not because it matters more than the rest.

> This file is listed in `.gitignore` and has never been committed. It exists only in this working copy, so back it up before you do anything destructive to the checkout.

---

## 1. Concept

- **What it is:** an educational library of the universe for beginner-to-intermediate readers. It has two kinds of page:
  1. **The galaxy (`/`)**: an interactive, scientifically honest 3D Milky Way. It is the front door and the map.
  2. **System pages (`/Solar`, `/Trappist`, …)**: one per star system. A top-down animated orrery sits on the right, and on the left are information "frames" holding text, images, video, audio and tables.
- **Pillars**, in priority order:
  1. **Educational and honest.** Real positions, real distances, sources credited, and scale cheats always labelled ("shown closer", "log-scaled").
  2. **Visual aesthetics.** The site should feel like a planetarium rather than a textbook. The house look is deep black, violet/blue star tints, glowing accent borders and the display fonts in `static/Fonts`.
  3. **Modularity.** Adding a system should need data only: DB rows plus a `GALAXY_PLACEMENT` entry.
  4. **Embedded media.** Content is a mix of text, images, video and audio.
- **Deliberately removed. Don't bring any of these back:** the calculator, index, about, articles, the nav bar, and the Swiper card deck that used to be the main page (`CardType`/`DeckType`, `UniverseScripts.js`, the Swiper vendor files).
- **No external requests from the galaxy page.** Three.js is vendored, so the page works on a LAN with no internet. System pages still hotlink their images (see §2).

## 2. State of the project (audited 2026-11-19)

### Current priorities (owner's decisions, 2026-11-19)
- **Focus: the main page, the galaxy map.** That is where work goes now.
- **Deferred:** the system pages (bugs, redesign, mobile support), and the content for Polaris, Sirius and Mira. Don't start on these unless asked.
- **Hotlinked images on Solar and Alpha Centauri:** remove them rather than replace them, for now. Proper images come back when the system pages are reworked.
- Leave README, tests and DB cleanup alone until asked.

The galaxy is mature and polished. The system pages are the older half of the site and are where the gaps are.

| Area | Status |
|---|---|
| Galaxy view | Mature. Console is clean, and it uses an HDR + bloom pipeline as of 0.8.2.2. On 2026-11-19 it was split into ES modules and gained a portrait layout, touch gestures that match the mouse, keyboard controls, reduced-motion support, a lite quality tier, system labels that are never hidden, and an edge-on view that shows the dust lane. |
| Solar, Alpha Centauri (Python) | Complete content, but **many hotlinked images are dead**: 19 of 60 broken on Solar and 5 of 20 on Alpha. Most come from Russian wallpaper and blog hosts. |
| Trappist (DB) | Complete: 8 objects, 18 panels, all images load. |
| Trebia (DB) | A fictional Mass Effect system with 7 objects and 8 panels. It has a page but is `hidden` from the galaxy. |
| **Polaris, Sirius, Mira, Barnard's Star** (DB) | **Empty shells.** Each has a `systems` row, but 0 objects and 0 panels, so the page is a starfield with an accent bar and nothing else. Barnard's Star (`BarnardsStar`, added 2026-11-23) has no cover art or icon. Settings can hide empty systems from the map. |
| README.md | **Out of date.** It still describes the Swiper card deck as the main page. |
| Tests | None. `manage.py check` is clean. |

Known code issues in the system pages:
- `SystemType.get_univ_sidepanel()` builds a Windows-only path, `f"{BASE_DIR}\static\LinkImages\{...}"`, which also contains invalid escape sequences. On Linux every thumbnail falls back to `default.png`. Use `os.path.join` or `Path`.
- `get_univ_sidepanel()` hard-codes Solar/Alpha thumbnails as `solar.png` and `alpha.png`, while the docs used to cite `Solar.png`/`Alpha.png`. On disk the files are lowercase, and that is correct.
- `Sliders.js` keeps **one global** `slideIndex` for every slider on the page, so stepping one slider moves the others' position.
- `CombinedHeaderPanel` opens `<h3>` and closes it with `</h2>`.
- One `objects` row has `system_ID = NULL` (an orphan), and `object_types` contains duplicates ("Ocean planet" ×2, "Star - Blue Giant" ×2).
- The page `<title>` is `Hello <name>!`.
- Empty systems still look like finished ones unless Settings hides them; the owner chose that over an "in preparation" tag.

## 3. Run it locally (Windows)

```powershell
py -3.11 -m venv .venv                      # Django 4.2 supports up to Python 3.12; avoid 3.14
.venv\Scripts\python -m pip install -r requirements.txt   # file is UTF-16; pip handles it
# .env in repo root (gitignored) must contain: SECRET_KEY=<random string>
.venv\Scripts\python manage.py runserver 0.0.0.0:8000     # 0.0.0.0 = reachable from other LAN devices
```

- The existing `.venv` runs Python 3.11.9 with Django 4.2.6, django-compressor 4.4, django-libsass 0.9, django-sass-processor 1.2.2 and python-decouple 3.8.
- `settings.py` reads `SECRET_KEY` (required), `DEBUG` (default `True`) and `ALLOWED_HOSTS` (comma-separated, default `*`) through `python-decouple`.
- `.claude/launch.json` defines a `django` preview config. Its args hard-code port 8000. If the pane reports that it "assigned 8001", the server still listens on **8000**, so browse to that port.
- `db.sqlite3` is **committed** and holds the content. Never delete it or run `flush`. The `starsystems` models are `managed = False`, so migrations never touch those tables; edit content with a SQLite tool or a short script.

## 4. Layout

| Path | What it is |
|---|---|
| `mysite/settings.py`, `urls.py` | Project package. The root URLconf includes `starsystems.urls` at `/`. |
| `mysite/Types/*.py` | Classes that **generate HTML strings**: `SystemType` (page assembly), `ObjectType` (orrery bodies), `PanelType` (info frames), `StyleType` (inline styles and event-handler strings). This is the core of the system pages. |
| `mysite/PredefinedSystems/` | Solar (848 lines) and Alpha Centauri (360 lines), hard-coded as Python instances. |
| `mysite/ServerScripts.py` | Builds `SystemClass` objects from DB rows. `get_sql_system_links()` gives the name, href and colour the galaxy needs for each system. |
| `starsystems/models.py` | Unmanaged models: `systems`, `objects`, `panels`, `value_row`, `panel_types`, `object_types`. |
| `starsystems/views.py` | `universe_page` (the galaxy), `template_system_page` (DB systems) and two near-identical views for the predefined systems. |
| `starsystems/galaxy.py` | All galaxy data: placements, deep-sky catalogue, galaxies and credits. |
| `sections/Universe.html`, `System.html` | Templates (`TEMPLATES.DIRS = ["sections"]`). System markup arrives pre-rendered through `{{ x\|safe }}`. |
| `static/Scripts/galaxy/` | The galaxy, as ES modules loaded straight from the import map with no build step. The entry point is `main.js`. See §7.0 for what lives where. |
| `static/Scripts/CoreFunctions.js`, `Sliders.js` | System-page behaviour: panel switching, side panels, hover and sliders. |
| `static/Styles/` | `GalaxyStyles.css` (the dock and labels), `SystemStyles.css`, and `UniverseStyles.css` (the page base). |
| `static/Images/` | `GalaxyBackdrop.jpg`, `Galaxies/*.jpg`, and `<Name>cover[-sml].jpg`. The cover art is unused since the deck was removed and is kept on disk deliberately. |
| `static/LinkImages/` | **Still used**, by the "★ Stars" side panel on every system page. |
| `static/Vendor/three/` | Three.js 0.169 and `OrbitControls`, wired through the import map in `Universe.html`. |
| `deprecated/` | Old Russian docs. Ignore. |

## 5. Routing

- `/` → the galaxy, and nothing else.
- `/Solar`, `/AlphaCentauri` → the predefined Python systems.
- `/<systems.name_NAME>` → DB systems (Trappist, Trebia, Polaris, Sirius, Mira). `starsystems/urls.py` **queries the DB at import time** to register these, so a new row needs a server restart. A name containing a space would register a URL with a space while the galaxy links to the space-stripped href, so keep DB names space-free.
- Every page is one level deep, and links are relative (`../static/...`, `href="Trappist"`). Keep it that way or the links break. System pages link back to `/`.
- The galaxy's system markers and dock rows are plain `<a href>`, so nothing was orphaned by removing the deck.

## 6. System pages

### Content model (DB)
- **`systems`**: name, three colours, thumbnail (`LinkImages/` file), icon (`Icons/` file; missing → `AlternativeIcon.ico`), short description.
- **`objects`**: belongs to a system and optionally to a parent object (moons). Holds size (vh), colours, glow, orbit size (vmin) and orbit period (s).
- **`panels`**: belongs to either a system (the overview frames) or an object. `type_ID` → `panel_types`; `values_ID` → a `value_row`.
- **`value_row`**: the panel's arguments (title, text, image or media URL, colours a/b/c, header colours, layout, `is_slider`, `close_button`, `extra_ARGS`).
- Column suffixes encode type: `_NAME`, `_INT`, `_ANY` (a colour), `_PLAIN`, `_BOOL` (the **strings** `"True"`/`"False"`), `_TEXT_URL`.

### Panel types (`ServerScripts.get_sql_panel`, matched on `panel_types.id`)
| id | Class | Uses |
|---|---|---|
| 1 | `SimpleMusicSlider` | audio player (`img_src` = audio URL) |
| 2 | `PanelSlider` | `extra_ARGS` = comma-separated **panel ids** to cycle; those panels set `is_slider="True"` |
| 3 | `SimpleVideoPanel` | iframe (YouTube embed URL) |
| 4 | `CombinedSimplePanel` | text + image, `layout` 1/2 |
| 5 | `SimpleImagePanel` | image |
| 6 | `CombinedHeaderPanel` | title + text + image, `layout` 1/2/3 |
| 7 | `HeaderTextPanel` | title + text; optional close button; `extra_ARGS` = space-separated "read more" links |
| 8 | `TopHeaderTextPanel` | big title + text (the system's lead frame) |
| 9 | `SimpleTextPanel` | text |
| 10 | — | (`BasePanel`, unused) |
| 11 | `SimpleTable` | `text` = `key:value;key:value;…` |

Object panels whose `value_row.is_slider_BOOL = "True"` are not rendered on their own; they appear only through the slider that references them.

### Adding a DB system
1. Add a `systems` row, plus `objects`, `panels` and `value_row` rows. Copy the shape of Trappist (id 1), which is the cleanest complete example.
2. Add a `GALAXY_PLACEMENT` entry in `starsystems/galaxy.py`. **Compute** `l`/`b` from J2000 RA/Dec; don't guess them.
3. Optionally add `static/LinkImages/<name>.png` and `static/Icons/<X>.ico`.
4. Restart the server.

### Conventions
- HTML is built with f-strings and rendered `|safe`, so DB text is **unescaped**. That is acceptable only because the content is trusted. Escape any new user-facing input.
- Inline styles and handlers come from `StyleType.Style.*` and `StyleType.EventHandlers.*`. Reuse them instead of writing new raw strings.
- Sizes are in `vh`/`vmin`, and layout is absolute. The pages are designed for landscape desktop screens and are not responsive.

## 7. Galaxy view

The code in `static/Scripts/galaxy/` is the source of truth, and its comments are thorough. Read the comment above a constant before you change it. This section is the map, plus the lessons that cost the most to learn.

### 7.0 Modules (`static/Scripts/galaxy/`)
| Module | Holds |
|---|---|
| `main.js` | Entry point. Imports `setup.js` first, then builds `GalaxyView` and exposes it as `window.galaxyView`. |
| `setup.js` | Turns `THREE.ColorManagement` off. It must run before any other module creates a colour, which is why it is `main.js`'s first import. |
| `config.js` | Every tunable and the page data: `DATA`, `SUN`, `VIEW_SHIFT`, `FOV`, `NARROW_WIDTH`, `ARMS`, `BACKDROP`, the quality tier, `BULGE`, tints, `OVERVIEW`/`START`/`START_PORTRAIT`, `PIVOT`, `DEEP_SKY_STYLE`, shared scratch objects. It also holds the long header comment describing the scene. |
| `units.js` | Remembered unit choices (`universeUnits`), the settings options, and the distance, size, mass and temperature formatters. It imports nothing. |
| `util.js` | Seeded `rand`/`gauss`, arm geometry, sky-to-scene transforms, `formatLy`, `smoothstep`, `Layer`. |
| `shaders.js` | `noiseTexture`, `LANE_GLSL`, the point vertex/fragment shaders, `pointsMaterial`, `glowSprite`. |
| `dust.js` | `DUST` and the CPU-side column maths: `dustColumn`, `diskTransmission`. |
| `backdrop.js` | `BACKDROP_MATRIX`, the slice-stack shaders, `buildBackdropVolume`. |
| `starfield.js` | Image sampler, flocculence, dust map, `buildGalaxyFromImage`, `buildScatteredDeepSky`. |
| `structures.js` | Backdrop shell stars, galaxy dots, the core and black holes, the bulge glow, arm outlines. |
| `landmarks.js` | The named deep-sky points and the galaxy photographs and far-field quads. |
| `local.js` | The Sun-centred local view's rings and dots. |
| `post.js` | `POST` and `PostPipeline`: HDR target, bloom, tone curve. |
| `markers.js` | `Marker` (HTML labels) and `LABEL_SPOTS`. Variants: `map` (real system, no page) and `fiction`. |
| `panels.js` | `Catalogue`: a left-side panel with search, filter chips, fold state (`galaxyPanel:<key>`) and "in view first" sorting. It imports nothing; the view feeds it entries. |
| `view.js` | `GalaxyView`: scene assembly, loader, controls, keyboard, dock, the per-frame update, label declutter. |

- **Imports are explicit and acyclic:** `config` → `util` → (`dust`, `backdrop`, `post`) → (`shaders`, `starfield`) → (`structures`, `landmarks`, `local`) → `view` → `main`. Keep it that way. Keep top-level code free of calls into other modules, so evaluation order never matters.
- **Browsers cache ES modules hard.** After editing, a plain reload can keep running the old module. In the preview pane, `await fetch(url, {cache: "reload"})` on each changed file before `location.reload()`.

### 7.1 Data (`starsystems/galaxy.py` → `json_script` → `GALAXY_DATA`)
- `GALAXY_PLACEMENT` is keyed by href. Real systems give `l`/`b` (deg) and `d` (ly). Fictional ones give `x`/`z` (ly) plus a `source`. `hidden: True` keeps a system out of the view.
- `DEEP_SKY` holds 61 named nebulae, clusters, remnants and planetaries, plus the Local Bubble, keyed by `kind`. They are drawn **artistically** (`ARTISTIC` in `landmarks.js`): soft tinted wisps, rings for planetaries and remnants, and member stars for clusters spread wider than life. Positions stay exact. The landmarks use their own seeded PRNG, so adding one never reshuffles the star field.
- **Arms:** Norma, Outer, Scutum–Centaurus, Sagittarius–Carina, Perseus, the Orion Spur, and the Near and Far 3 kpc Arms (`THREE_KPC_ARMS`; names only, since the artwork doesn't resolve them). All are in `registry` under "Spiral arms", are listed in the Nebulae & clusters panel under "Structure", and all show from the Whole galaxy view.
- `PLANETARY_SYSTEMS` (8 entries, Kepler-186 to OGLE-2005-BLG-390L) are **real systems beyond the neighbourhood with no page**. They are map-only: hollow-ring markers on the systems layer that fade in near them, and a click flies there. Their `l`/`b` were computed from J2000 RA/Dec.
- `FICTIONAL_PLACES` are places from stories, on their own **fiction** layer and drawn dashed, violet and italic. A place whose story names a real star sits at it (`anchor`: Vulcan at 40 Eridani A, Arrakis at Canopus, Pandora and Trisolaris at Alpha Centauri, Reach at Epsilon Eridani). The rest (Mass Effect's Citadel, Omega, Tuchanka, Collector Base) are `x`/`z` placed by eye and say so. `offMap` entries (Star Wars) are listed with a note and not drawn.
- `GALAXIES` holds 13 entries: SagDEG, the LMC, SMC, M31 and M33, then IC 342, NGC 253, M82, M81, Cen A, M101, M51 and M104. `d` is the true distance, `display` the drawn distance, `size` the **real** diameter, and `brightness` is a ladder that restores distance ordering.
- `BACKGROUND_GALAXY_IMAGES` (`far1..4`) are for the 120 nameless far-field quads and must **not** be images of named galaxies. `spiral1.jpg` is M51 and `spiral2.jpg` is M104.
- **Coordinates are verified.** Every `l`/`b` was computed from J2000 RA/Dec, and Sgr A* lands on 0,0. The Sun is 26,700 ly from the centre (GRAVITY 2019) and 65 ly above the plane.

### 7.2 Scene conventions
- 1 unit = 1,000 ly. The galactic centre is at the origin, the disk is the XZ plane, the Sun is at +Z, longitude 0 points to −Z and longitude 90 to −X.
- The arm skeleton is log spirals at a 12° pitch (`ARMS[].crossing` is where each arm crosses the Sun–centre line) plus the Orion Spur. It drives the dashed outlines and the labels. The crossings (10.9 / 17.9 / 21.8 / 32.7) are **fitted to the backdrop** (2026-11-23): a phase sweep at the shared 12° pitch over the contrast-normalised artwork, taking the ridges. The old symmetric set put Perseus and Scutum in the gaps. A free pitch per arm aliases arms onto each other a turn apart, so keep it shared. `rMax` ends each line where its arm fades, and lines taper at both ends (vertex alpha). Re-fit if the backdrop or `BACKDROP.rotation` changes.
- The bar axis is `BAR_ANGLE` = 117°, tied to `BACKDROP.rotation` (16°). If one changes, so must the other.
- There are two levels: the whole galaxy, and a Sun-centred local view at **true scale** (since 2026-11-23; the log scale is gone). Systems and landmarks use `truePosition` at both levels, so landmarks have one set of labels (`level: "any"`). The local view fades in between `LOCAL_ENTER` 2.6 and `LOCAL_FULL` 1.5 units from the Sun. `minDistanceAt()` drops the zoom limit to `LOCAL_MIN_DISTANCE` (0.004, about 4 ly) near the Sun and blends back to 0.8 away from it, and `camera.near` follows the camera distance (×0.02, clamped 5e-5…0.01). Rings sit at 10/100/1,000 ly, and each ring label shows only while its ring is a readable size.

### 7.3 What is drawn
- **The backdrop** is R. Hurt's NASA/JPL-Caltech artist's concept (public domain). It is an impression, not survey data. It is a **slice stack** (`BACKDROP.slices: 5`): the mid-plane sheet is sharp, and the off-plane sheets are blurred, twisted, warped and torn by noise (`uTear`). All four tricks together are what stop ghosting face-on and the venetian-blind look edge-on, so check both views after touching any of them. The backdrop has no toggle.
- **The star field is sampled from the backdrop.** `buildGalaxyFromImage()` builds a brightness CDF (exponent 2.2) and samples `BACKDROP.stars` (2.1M, a budget: flocculent thinning removes about a fifth). Each star takes its pixel's hue, tinted towards `STAR_TINTS`. `BACKDROP_MATRIX` is shared by the sampler and the slices, so the two cannot drift apart.
- **There are three stellar components:** the thin disk, the thick disk (260k) and the halo (110k). They share one `Layer`, and its capacity must cover their sum. Fix perceived flatness with these components, never by thickening the thin disk.
- **Haze:** gas (10k), cirrus banks (2k), inter-arm fill (3.8k; picks dim pixels uniformly instead of from the CDF), and knots (3.6k).
- **Arm edges** are coloured from the artwork's radial brightness slope: blue outside, warm inside. `INTER_ARM_TINT` makes the gaps redder.
- **Controls:** the bottom-right group has a Sol button (`data-action="sun"`, the same as the dock's chip), then zoom out and zoom in.
- **The core:** a boxy, peanut-shaped bulge (`BULGE`, `buildCore`, `buildBulgeGlow`), a nuclear cluster, and 70 black holes drawn as ring glyphs, visible between about 5 and 46 units. The shapes are real; the sizes are schematic. `uCoreFade` hands the artwork's bulge over to the 3D core up close.
- **Scattered deep sky:** about 2,000 unlabelled filler objects. Each records its kind (`layer.objects`, which draws no random numbers, so the star field is unchanged), and they get the landmarks' painted look through `buildDeepSky(objects, { amount: 0.5, cores: false })`: fewer wisps and members, and quieter rings. If the view feels crowded, reduce these, never the catalogue.
- **Keep the bulge free of star formation.** The painting's bulge is warm gold, so any "pick the reddish pixels" test lands on it and the core close-up turns into pink confetti. Knots are gated out below r = 8.5. Scattered nebulae, remnants and planetaries thin out below r = 9, and "pink" requires low green (`r > g × 1.18`) as well as `r > b × 1.1`. Any new sampled population needs the same gate.
- **Galaxies** are photographs on fixed planes whose normals point back at the Sun, so each carries its real tilt. They are median-filtered to strip foreground stars (radius 3 for M31/M33 and 2 for far spirals; the LMC and SMC are left as they are). To tune apparent size, change `display`, never `size`. After you add a galaxy, re-check the brightness ladder.
- **Surroundings:** 26k shell stars, about 1,600 warm "galaxy dots", and 120 far-field quads (dim textures, brighter quads).

### 7.4 Post-processing (new in 0.8.2.2)
- The scene renders into a **half-float HDR target**, then goes through bloom (6 mip levels), a shouldered tone curve, saturation, vignette, a shadow tint and dither (`POST`, `PostPipeline`). `THREE.ColorManagement` is **off**: colours are authored display-referred.
- Soft layers (haze, bulge glow, off-plane sheets) render at **half resolution** (`SOFT_LAYER`, `SOFT_SCALE`) and are composited before the bloom.
- **This invalidated the old "saturation" reasoning.** Earlier tuning assumed an 8-bit frame clipping at 765 (sum of RGB), with the edge-on band about 2.5× over. Lane strengths were cranked up to cut through that clipping. With HDR "nothing clips now", and `DUST.laneDepth` was retuned down to **0.1**. Older notes quoting 0.105, 0.135 or 0.016, or peak values out of 765, are pre-HDR. Re-measure before relying on them.

### 7.5 Dust and extinction: rules that cost the most to learn
- **Don't reintroduce dust as geometry.** Sprite dust was built and deleted three times, and it always read as stains. Extinction is computed **per star in the vertex shader** (`LANE_GLSL`): a gaussian slab (`laneHeight` 0.34 kly) integrated in closed form with an `erf` approximation. **Write it as a mean density times path length, not as an integral in t**, or the column is lost exactly edge-on.
- **Arm dust is read from the artwork** (`dustMapFrom`, thresholded). It darkens the backdrop (`backdropDepth` 2.1, an optical depth under Beer's law with per-channel transmission of roughly R 0.50, G 0.40, B 0.30) and dims stars (`aDust`, `armDepth`). Threshold the map, or the whole disk turns to mud.
- **The two dust terms are gated by elevation in opposite directions.** The flat-view lane fades out between 0.18 and 0.30, and arm dust fades in between 0.10 and 0.26. Stars with `aDust` < 0.012 skip the maths, which is what makes per-star dust affordable.
- **Background objects are dimmed by disk dust** (`dustColumn` clipped analytically to the slab, then `diskTransmission`). Labels under 0.3 transmission are hidden. The core also dims as you drop into the plane (`uExtinction`, per star by height).
- The near/far asymmetry seen just off edge-on is real. Don't balance it out.
- **The edge-on lane depends on the camera angle as much as on the dust.** From 1.3° above the plane (the old 88.7° Edge-on button), every sight line to a star below the plane crosses the slab at a grazing angle *inside* the disk. The whole lower half of the band dimmed together, with no light below the lane, so it read as a shaded band. From 0.5° (the button is now 89.5°) those sight lines cross the plane outside the disk's dust, and the band is lit on both sides of a dark stripe. Measured at 2.3 MP, as summed-RGB row means across the band: 586 → 359 → 465. If the lane "disappears" again, check the viewing angle before touching `laneDepth`.
- **Measure a lane by toggling it** (`uLane` on and off, per-channel frame means) and compare the mid-plane against the wings, never the frame mean.

### 7.6 Camera, composition, UI
- **Controls:** left-drag pans, right-drag orbits, the wheel zooms. This mapping is deliberate. `autoRotate` is off, and nothing moves on its own.
- **Touch matches the mouse:** one finger pans, two fingers pinch and turn (`TOUCH.DOLLY_ROTATE`). On coarse pointers the hint text says so. On narrow screens the hint sits top right and fades after the first touch.
- **Keyboard** (`bindKeyboard`): arrows pan along the disk relative to where the camera faces, Shift+arrows turn and tilt, `+`/`-` zoom, Home shows the whole galaxy. Arrows act only when the map, or nothing, has focus, and keys are ignored in form fields. The canvas is focusable (`tabindex="0"`, `role="application"`) and shows an inset ring on `:focus-visible`.
- **Reduced motion:** with `prefers-reduced-motion`, every `flyTo` becomes a cut (duration 0) and OrbitControls damping is off.
- **`PIVOT`:** the pan allowance depends on zoom (from the rim at 22 units of distance down to 12 at the far limit), the target eases back rather than snapping, the far limit is 150, and `maxPolarAngle` is 89.6°. The camera never leaves the Milky Way, and other galaxies are not destinations.
- **`VIEW_SHIFT` (0.11)** moves the galaxy right of centre through `camera.setViewOffset`. Never do this by offsetting the controls target. At `NARROW_WIDTH` (760px) and below, the shift is 0, because the dock starts collapsed there.
- **`START` is the opening shot** (target (6, 0, 28), distance 66, polar 60°, azimuth 1.82). It was **solved for**, not eyeballed: the solve composes the core, Sun, M31 and M33, then keeps only cameras where M31 sits in dark sky with transmission above 0.85. If the field of view or `VIEW_SHIFT` changes, re-solve it. Never move M31's `l`/`b` to compose a shot. `OVERVIEW` belongs to the "Whole galaxy" chip.
- **Portrait screens get their own camera, and a wider lens.** In portrait, `resize()` widens the vertical field of view by √(1/aspect), giving 69° × 35° on a 375×812 phone. A full horizontal match would fish-eye. `START_PORTRAIT` (target (−4, 0, 20), distance 105, polar 45°, azimuth 2.198) was solved the same way as `START`: a 63,000-camera sweep requiring the disk to fill the width, the core and Sun in the lower half, and M31 above the projected rim, never inside it. Both M31 and M33 keep transmission 1.0. The tall frame suits the Local Group, because galactic north is screen-up and M31/M33 stack above the disk. `framed()` pulls the wide jump chips (Whole galaxy, Edge-on) back in portrait so they cover a similar width. It leaves the Sun and core chips alone, since pulling back from the Sun would leave the local view.
- **Units** (`units.js`): every printed quantity goes through `formatDistance` (and `formatLy`, which delegates to it), `formatMass`, `formatSize` and `formatTemperature`. The choice lives in `localStorage` `universeUnits` (JSON), is set in the Settings dialog (`#GALAXY_SETTINGS`, a native `<dialog>`), and a change rebuilds the markers and the system list. The dialog also holds the detail tier (it navigates to `?quality=`).
- **Readiness:** `systems[].ready` comes from the server (`get_sql_system_links`: the system has objects or panels; predefined systems are always ready). Empty systems are **not tagged** (the owner rejected an "in preparation" tag). Settings → Map → "Systems without a page yet" can hide them (`visibleSystems()`, `buildLocalGroup()`).
- **Display options** (`DISPLAY` in `units.js`, `localStorage` `galaxyDisplay`): label size (labels are sized in `em` off `--label-size` on `#GALAXY_LABELS`), empty systems shown or hidden, and camera moves (fly or cut).
- **Display names:** `GALAXY_PLACEMENT[href].label` overrides the DB name, because names double as URLs and must stay space-free (`BarnardsStar` → "Barnard's Star").
- **The left side** (`#GALAXY_DOCK`) is a see-through column of separate glass panels:
  - the intro: title, jump chips and "About this map";
  - **Star systems**: pages, map-only systems and fiction, with filters for each;
  - **Nebulae & clusters**: landmarks, arms, the core and galaxies, with kind filters.

  Both catalogues have search and fold independently, and the column's toggle hides them all. Each catalogue sorts **in view first** (`marker.inView` = on screen, right level, inside the distance window, ignoring the layer switches), then by distance from the Sun. Rows jump the camera, and pages get an open arrow. "In view now" is gone. **Layers** are a row of icon buttons top right (`.GalaxyLayers`). Settings has its own round panel in the corner beside it (`.GalaxySettingsPanel`). There are four toggles (`aria-pressed`): systems; arms, which is "Galaxy structure" and covers the arms, the core labels and other galaxies (it kept the `arms` key); deepsky; and fiction. Each has a tooltip (`.LayerTip`) explaining the layer. **The legend** is its own panel under the row (`#GALAXY_LEGEND`, `bindLegend`). It shows the `Primary` keys and opens to all of them on hover or focus; on narrow screens it is a tab that opens on tap. On touch screens a tap shows the tooltip for 2.2s (`.ShowTip`). The toggles are stored as `localStorage` `galaxyLayer:<key>`. On narrow screens the hint sits below the row. Layers control **labels only**, plus the arm outlines and the local rings; objects are always drawn.
- **Labels** are an HTML overlay that is decluttered by box overlap. Lower `priority` wins: systems 0, arms 1, galactic centre/bulge/nuclear cluster 1.9, landmarks 2, rings 3. **Labels fade, they don't switch**: each frame a 0..1 factor is the product of level (galaxy/local cross-fade around local 0.5), layer, arm tilt (`smoothstep(0.08, 0.2, elevation)`), galaxy disk transmission (0.25 to 0.45), and the marker's own distance window (`far`/`near`, fading over 30%; `measureFrom: "camera"` measures to the label's point, used by landmarks). It lands in `--fade`. The galactic centre is a deepsky-layer landmark label, not a link. From the galaxy level, the Sun's surroundings are one **compact cluster marker** named "Solar Neighbourhood" (deliberately not "local cluster": the Sun is in no star cluster, and the "Local Group" is galaxies) (`members`): name, count, and one dot per system. Hover, focus or a click on the dots (which pins it) opens it into link chips. The declutter measures the closed card, so opening it never pushes other labels around. The name flies to the local view. **Region and ring labels have `pointer-events: none`**, so drags pass straight through them; only system links are clickable.
- **Link labels (systems, Sol, Sgr A*) are never dropped.** In the local view they crowd round the Sun, and the declutter used to hide Trappist entirely. Each one now tries the spots in `LABEL_SPOTS` (right of its icon, left, then one or two label-heights up or down), rejecting any spot that clashes or runs off-screen. A label that moved vertically gets a leader line from its icon (`.Displaced`, `--label-shift`). If no spot fits, it is drawn in its default place anyway. On narrow screens long subtitles wrap (`max-width: 44vw`) so that a spot can fit.
- **Loading:** an SVG spiral (`.LoaderGalaxy`) turns above the bar, slowed to 60s per turn under reduced motion.
- **Loader steps:** `GALAXY_LOADER` waits for the images and the star-field build, then **pre-compiles every shader** (`renderer.compileAsync`) behind a "Preparing the view" step before it says "Ready". Without that step, the first frame's compile (the longest single block of the load) ran after "Ready" and froze the page under a part-filled bar. The bar only moves forward. A `setTimeout` fallback keeps the build from depending on `requestAnimationFrame`, so a hidden tab still loads.
- **A hidden or throttled preview pane also freezes CSS transitions,** so a screenshot can show the loader mid-fade ("Ready" over a part-filled bar) long after the DOM says `Done`, opacity 0 and width 100%. Check the DOM, or take a second screenshot, before calling the loader broken. Drive frames by hand with `galaxyView.frame(performance.now())` when rAF is suspended.

### 7.7 Performance and measurement
- **Measured 2026-11-19, after the HDR change and the module split.** Each figure is milliseconds per frame from `gl.readPixels` around 24 renders, at 1920×1200 (2.30 MP) on the Arc 140T laptop, as two back-to-back passes. The 60fps budget is 16.6ms.

  | View | full (2.26M points) | lite (1.04M points) |
  |---|---|---|
  | Opening (`START`) | 6.2 / 5.8 | 5.4 / 4.1 |
  | Whole galaxy | 5.9 / 6.1 | 4.1 / 4.5 |
  | Edge-on (89.5°) | 5.6 / 5.7 | 3.8 / 3.8 |
  | Galactic core (24 units) | **8.5 / 8.5** | 6.0 / 5.9 |
  | The Sun (local view) | 5.2 / 5.2 | 3.6 / 3.5 |

  The core close-up is the worst frame, as it always has been, and it is where to look first if a budget tightens. Time from navigation to the loader lifting was 4.6s full and 2.3s lite. That was measured in a throttled, hidden pane, so treat it as an upper bound. The JS heap is about 108MB at full detail.
- **Quality tier (`config.js`, `detectQuality`).** "lite" keeps 45% of the stars (thin disk, thick disk and halo) and 60% of the haze, multiplies their alphas by the inverse (`Layer`'s `alphaScale`, so count × alpha and therefore exposure hold), caps the pixel ratio at 1.5 and drops one bloom level. It is chosen automatically for a coarse pointer on a screen under 600px, ≤4 CPU cores or ≤4GB `deviceMemory`. `?quality=lite|full` overrides it and is remembered in `localStorage` (`galaxyQuality`); `?quality=auto` forgets the override. "About this map" shows the current tier and a link to switch. Arms, dust, labels and landmarks are identical in both tiers. **If you change a star count or alpha, check both tiers.**
- **Don't allocate per star.** `pixelToPlane()` writes into a passed-in vector; allocating per call was 4× slower.
- **Haze costs fill area, so raise alpha before count or size.** Sprite caps (`uMaxSize`) tighten as the camera approaches.
- **Density and brightness are separate dials.** Keep count × mean alpha constant. `uGain` lifts faint stars close in, so if you halve alpha, re-check the close-up.
- **Measure frame cost with `gl.readPixels` around N renders, not with fps.** The pane caps at vsync and throttles to about 2 fps when it isn't visible. GPU power state drifts absolute numbers by 2×, so A/B settings back to back.
- **`frame()` returns early when the view is stopped.** A sweep that calls `stop()` and then `frame()` measures nothing.
- **Debugging:** `window.galaxyView`; `placeCamera()` jumps instantly and `flyTo()` animates. Screenshots can lag a frame behind. Module-scoped constants (`DUST`, `BACKDROP`, …) are not on `window`, so to A/B a uniform, wrap `galaxyView.post.render` and set the uniform there: `frame()` rewrites uniforms every frame, so anything set before it is lost.

## 8. General conventions and gotchas

- Use CRLF in existing files (endings are mixed). `requirements.txt` is UTF-16.
- Asset names are case-sensitive on Linux; Windows hides mismatches.
- Installed apps are only `starsystems`, `staticfiles` and `compressor`. There is no auth, sessions or admin, so don't add features that need them.
- The Sass toolchain is kept on purpose for future SCSS, even though nothing uses `{% compress %}` yet.
- The settings are for development only. There is no production static serving (`STATIC_ROOT = compiled/`) and no deployment config.
- Commit messages are version numbers (`0.8.2.2`, `0.8.2.1b`, …).
