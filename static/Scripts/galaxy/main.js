import "./setup.js";
import { GalaxyView } from "./view.js";

// the galaxy is the main page, so it starts as soon as the module runs
const setupStart = performance.now();
const view = new GalaxyView();
performance.measure("galaxy:setup", { start: setupStart, end: performance.now() });
window.galaxyView = view; // handy for tuning from the console
view.start();
