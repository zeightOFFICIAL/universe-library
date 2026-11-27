/*
 * Measurement units, chosen in the settings dialog and remembered per browser.
 *
 * Everything the map prints as a quantity goes through these formatters, so a
 * change of unit is one call to setUnits() and a relabel. The choice is stored as
 * JSON under one localStorage key, "universeUnits", which the system pages can read
 * too. Nothing here imports anything, so any module can use it.
 */

/*
 * Grouped by what they measure, so the dialog reads as "across space", "planets",
 * "stars and black holes". Every quantity the map or a future info card prints has
 * a home here, even where nothing on the map uses it yet: the object cards and the
 * system pages will read the same choices.
 */
export const UNIT_OPTIONS = {
    distance: {
        section: "Across space",
        label: "Distances",
        hint: "Between stars, and across the galaxy",
        choices: [
            { value: "ly", label: "Light-years", example: "4.37 ly" },
            { value: "pc", label: "Parsecs", example: "1.34 pc" },
            { value: "km", label: "Kilometres", example: "4.13 × 10¹³ km" },
        ],
    },
    temperature: {
        section: "Across space",
        label: "Temperatures",
        hint: "Surfaces of stars and planets, nebula gas",
        choices: [
            { value: "C", label: "Celsius", example: "5,505 °C" },
            { value: "K", label: "Kelvin", example: "5,778 K" },
            { value: "F", label: "Fahrenheit", example: "9,941 °F" },
        ],
    },
    size: {
        section: "Planets and moons",
        label: "Sizes",
        hint: "Diameters",
        choices: [
            { value: "km", label: "Kilometres", example: "12,742 km" },
            { value: "mi", label: "Miles", example: "7,918 mi" },
            { value: "earth", label: "Earths", example: "1 Earth" },
            { value: "jupiter", label: "Jupiters", example: "0.09 Jupiters" },
        ],
    },
    planetMass: {
        section: "Planets and moons",
        label: "Masses",
        hint: "Rocky worlds to gas giants",
        choices: [
            { value: "earth", label: "Earths", example: "317.8 Earths" },
            { value: "jupiter", label: "Jupiters", example: "1 Jupiter" },
            { value: "kg", label: "Kilograms", example: "1.9 × 10²⁷ kg" },
        ],
    },
    period: {
        section: "Planets and moons",
        label: "Orbits and days",
        hint: "Years, days and rotation",
        choices: [
            { value: "days", label: "Earth days", example: "365.26 days" },
            { value: "years", label: "Earth years", example: "1 year" },
            { value: "hours", label: "Hours", example: "8,766 h" },
        ],
    },
    gravity: {
        section: "Planets and moons",
        label: "Surface gravity",
        hint: "What you would weigh",
        choices: [
            { value: "g", label: "Earth g", example: "0.38 g" },
            { value: "ms2", label: "m/s²", example: "3.72 m/s²" },
        ],
    },
    starSize: {
        section: "Stars and black holes",
        label: "Sizes",
        hint: "Star radii, event horizons",
        choices: [
            { value: "sun", label: "Suns", example: "887 Suns" },
            { value: "km", label: "Kilometres", example: "617 million km" },
            { value: "au", label: "AU", example: "4.1 AU" },
        ],
    },
    mass: {
        section: "Stars and black holes",
        label: "Masses",
        hint: "From red dwarfs to Sgr A*",
        choices: [
            { value: "relative", label: "Suns", example: "4.3 million Suns" },
            { value: "kg", label: "Kilograms", example: "8.6 × 10³⁶ kg" },
        ],
    },
    luminosity: {
        section: "Stars and black holes",
        label: "Brightness",
        hint: "Light given off",
        choices: [
            { value: "sun", label: "Suns", example: "126,000 Suns" },
            { value: "w", label: "Watts", example: "4.8 × 10³¹ W" },
        ],
    },
};

const KEY = "universeUnits";
const DEFAULTS = { distance: "ly", temperature: "C", size: "km", planetMass: "earth", period: "days", gravity: "g", starSize: "sun", mass: "relative", luminosity: "sun" };

function load() {
    const units = { ...DEFAULTS };
    try {
        const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
        for (const [key, value] of Object.entries(saved)) {
            // only keep values that are still on offer
            if (UNIT_OPTIONS[key]?.choices.some((c) => c.value === value)) units[key] = value;
        }
    } catch (e) {}
    return units;
}

export const UNITS = load();

export function setUnits(changes) {
    Object.assign(UNITS, changes);
    try {
        localStorage.setItem(KEY, JSON.stringify(UNITS));
    } catch (e) {}
    for (const listener of listeners) listener(UNITS);
}

const listeners = new Set();
export function onUnitsChange(listener) {
    listeners.add(listener);
}

/* ---------- display options ---------- */

/*
 * How the map itself behaves, remembered the same way under "galaxyDisplay": label
 * size, whether systems without a page yet are drawn, and whether the camera flies
 * or cuts between places.
 */
/*
 * Motion follows the device unless chosen here (owner, 2026-11-26): a device set to
 * reduce motion - Windows' "Animation effects" off, say - used to lose the flights and
 * the twinkling with no way to have them back, which on another computer read as
 * "flying and shimmering do not work". "Auto" still honours it; "Fly" and "On" win.
 */
const DEVICE_REDUCES_MOTION = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
export const DISPLAY_OPTIONS = {
    emptySystems: {
        label: "Systems without a page yet",
        hint: "Polaris, Sirius, Mira and others",
        choices: [
            { value: "show", label: "Show", example: "every system" },
            { value: "hide", label: "Hide", example: "only finished pages" },
        ],
    },
    motion: {
        label: "Camera moves",
        hint: "Between places",
        choices: [
            { value: "auto", label: "Auto", example: DEVICE_REDUCES_MOTION ? "cuts: this device asks for less motion" : "flies, unless the device asks for less motion" },
            { value: "fly", label: "Fly", example: "a smooth flight" },
            { value: "cut", label: "Cut", example: "jump straight there" },
        ],
    },
    twinkle: {
        label: "Twinkling",
        hint: "Stars shimmer, and now and then one glints",
        choices: [
            { value: "auto", label: "Auto", example: DEVICE_REDUCES_MOTION ? "still: this device asks for less motion" : "on, unless the device asks for less motion" },
            { value: "on", label: "On", example: "a living sky" },
            { value: "off", label: "Off", example: "still stars" },
        ],
    },
    turn: {
        label: "Idle turn",
        hint: "When nothing is touched for 5 s",
        choices: [
            { value: "off", label: "Off", example: "the view stays put" },
            { value: "slow", label: "Slow", example: "one turn in 10 minutes" },
        ],
    },
};

// labels are always the small size (owner, 2026-11-26: the size setting is gone)
export const LABEL_SIZE = 0.86;

// whether flights fly and stars twinkle now, from the setting and the device
export function motionAllowed(setting, reduce) {
    if (setting === "fly" || setting === "on") return true;
    if (setting === "cut" || setting === "off") return false;
    return !reduce;
}

const DISPLAY_KEY = "galaxyDisplay";
const DISPLAY_DEFAULTS = { emptySystems: "show", motion: "auto", twinkle: "auto", turn: "off" };

function loadDisplay() {
    const display = { ...DISPLAY_DEFAULTS };
    try {
        const saved = JSON.parse(localStorage.getItem(DISPLAY_KEY) || "{}");
        for (const [key, value] of Object.entries(saved)) {
            if (DISPLAY_OPTIONS[key]?.choices.some((c) => c.value === value)) display[key] = value;
        }
    } catch (e) {}
    return display;
}

export const DISPLAY = loadDisplay();
const displayListeners = new Set();

export function setDisplay(changes) {
    Object.assign(DISPLAY, changes);
    try {
        localStorage.setItem(DISPLAY_KEY, JSON.stringify(DISPLAY));
    } catch (e) {}
    for (const listener of displayListeners) listener(DISPLAY, changes);
}

export function onDisplayChange(listener) {
    displayListeners.add(listener);
}

/* ---------- formatting ---------- */

const SUPERSCRIPT = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };

function plain(value, digits = 2) {
    return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

// readable at any size: grouped digits up to a million, then words, then powers of ten
export function formatNumber(value) {
    const size = Math.abs(value);
    if (size >= 1e12 || (size > 0 && size < 1e-3)) {
        const exponent = Math.floor(Math.log10(size));
        const mantissa = value / Math.pow(10, exponent);
        const power = String(exponent).replace(/[-0-9]/g, (c) => SUPERSCRIPT[c]);
        return `${plain(mantissa, 2)} × 10${power}`;
    }
    if (size >= 1e9) return `${plain(value / 1e9, 2)} billion`;
    if (size >= 1e6) return `${plain(value / 1e6, 2)} million`;
    if (size >= 1000) return plain(Math.round(value), 0);
    return plain(value, size < 10 ? 2 : 1);
}

const LY_IN_PC = 3.26156;
const KM_IN_LY = 9.4607e12;

export function formatDistance(ly) {
    // inside the Solar System light-years are unreadable, so it switches to AU
    if (ly > 0 && ly < 0.05 && UNITS.distance !== "km") return `${formatNumber(ly * 63241)} AU`;
    switch (UNITS.distance) {
        case "pc":
            return `${formatNumber(ly / LY_IN_PC)} pc`;
        case "km":
            return `${formatNumber(ly * KM_IN_LY)} km`;
        default:
            return `${formatNumber(ly)} ly`;
    }
}

export function formatSize(km) {
    switch (UNITS.size) {
        case "mi":
            return `${formatNumber(km * 0.621371)} mi`;
        case "earth": {
            const earths = km / 12742;
            return `${formatNumber(earths)} ${earths === 1 ? "Earth" : "Earths"}`;
        }
        case "jupiter":
            return `${formatNumber(km / 139820)} Jupiters`;
        default:
            return `${formatNumber(km)} km`;
    }
}

const KG_IN_EARTH = 5.972e24;
const KG_IN_JUPITER = 1.898e27;
const KG_IN_SUN = 1.989e30;
const KM_IN_SUN = 695700;
const KM_IN_AU = 1.496e8;
const W_IN_SUN = 3.828e26;

const unit = (value, one, many) => `${formatNumber(value)} ${value === 1 ? one : many}`;

/*
 * Masses pick their scale by size: a tenth of a Sun or more is a star or a black
 * hole and follows the "stars" choice, anything lighter is a planet.
 */
export function formatMass(kg) {
    if (kg >= KG_IN_SUN * 0.1) {
        return UNITS.mass === "kg" ? `${formatNumber(kg)} kg` : unit(kg / KG_IN_SUN, "Sun", "Suns");
    }
    switch (UNITS.planetMass) {
        case "kg":
            return `${formatNumber(kg)} kg`;
        case "jupiter":
            return unit(kg / KG_IN_JUPITER, "Jupiter", "Jupiters");
        default:
            return unit(kg / KG_IN_EARTH, "Earth", "Earths");
    }
}

export function solarMasses(suns) {
    return suns * KG_IN_SUN;
}

// a star's radius or a black hole's event horizon, from kilometres
export function formatStarSize(km) {
    switch (UNITS.starSize) {
        case "km":
            return `${formatNumber(km)} km`;
        case "au":
            return `${formatNumber(km / KM_IN_AU)} AU`;
        default:
            return unit(km / KM_IN_SUN, "Sun", "Suns");
    }
}

// an event horizon is a few kilometres per Sun, so it is never printed in Suns
export function formatHorizon(km) {
    return UNITS.starSize === "au" ? `${formatNumber(km / KM_IN_AU)} AU` : `${formatNumber(km)} km`;
}

export function solarRadii(suns) {
    return suns * KM_IN_SUN;
}

// a black hole's event horizon: 2GM/c², about 2.95 km per solar mass
export function schwarzschildKm(suns) {
    return suns * 2.953;
}

export function formatLuminosity(suns) {
    return UNITS.luminosity === "w" ? `${formatNumber(suns * W_IN_SUN)} W` : unit(suns, "Sun", "Suns");
}

export function formatPeriod(days) {
    switch (UNITS.period) {
        case "years":
            return unit(days / 365.25, "year", "years");
        case "hours":
            return `${formatNumber(days * 24)} h`;
        default:
            return unit(days, "day", "days");
    }
}

export function formatGravity(g) {
    return UNITS.gravity === "ms2" ? `${formatNumber(g * 9.80665)} m/s²` : `${formatNumber(g)} g`;
}

export function formatTemperature(kelvin) {
    switch (UNITS.temperature) {
        case "K":
            return `${formatNumber(kelvin)} K`;
        case "F":
            return `${formatNumber(((kelvin - 273.15) * 9) / 5 + 32)} °F`;
        default:
            return `${formatNumber(kelvin - 273.15)} °C`;
    }
}
