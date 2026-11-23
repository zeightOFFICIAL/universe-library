/*
 * Measurement units, chosen in the settings dialog and remembered per browser.
 *
 * Everything the map prints as a quantity goes through these formatters, so a
 * change of unit is one call to setUnits() and a relabel. The choice is stored as
 * JSON under one localStorage key, "universeUnits", which the system pages can read
 * too. Nothing here imports anything, so any module can use it.
 */

export const UNIT_OPTIONS = {
    distance: {
        label: "Distances",
        hint: "Between stars, and across the galaxy",
        choices: [
            { value: "ly", label: "Light-years", example: "4.37 ly" },
            { value: "pc", label: "Parsecs", example: "1.34 pc" },
            { value: "km", label: "Kilometres", example: "4.13 × 10¹³ km" },
        ],
    },
    size: {
        label: "Sizes",
        hint: "Diameters of planets and stars",
        choices: [
            { value: "km", label: "Kilometres", example: "12,742 km" },
            { value: "mi", label: "Miles", example: "7,918 mi" },
            { value: "earth", label: "Earths", example: "1 Earth" },
        ],
    },
    mass: {
        label: "Masses",
        hint: "Planets, stars and black holes",
        choices: [
            { value: "relative", label: "Earths and Suns", example: "4.3 million Suns" },
            { value: "kg", label: "Kilograms", example: "8.6 × 10³⁶ kg" },
            { value: "lb", label: "Pounds", example: "1.9 × 10³⁷ lb" },
        ],
    },
    temperature: {
        label: "Temperatures",
        hint: "Surfaces of stars and planets",
        choices: [
            { value: "C", label: "Celsius", example: "5,505 °C" },
            { value: "K", label: "Kelvin", example: "5,778 K" },
            { value: "F", label: "Fahrenheit", example: "9,941 °F" },
        ],
    },
};

const KEY = "universeUnits";
const DEFAULTS = { distance: "ly", size: "km", mass: "relative", temperature: "C" };

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
        default:
            return `${formatNumber(km)} km`;
    }
}

const KG_IN_EARTH = 5.972e24;
const KG_IN_SUN = 1.989e30;

export function formatMass(kg) {
    switch (UNITS.mass) {
        case "kg":
            return `${formatNumber(kg)} kg`;
        case "lb":
            return `${formatNumber(kg * 2.20462)} lb`;
        default: {
            // anything a tenth of a Sun or more is counted in Suns
            if (kg >= KG_IN_SUN * 0.1) return `${formatNumber(kg / KG_IN_SUN)} ${kg === KG_IN_SUN ? "Sun" : "Suns"}`;
            return `${formatNumber(kg / KG_IN_EARTH)} Earths`;
        }
    }
}

export function solarMasses(suns) {
    return suns * KG_IN_SUN;
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
