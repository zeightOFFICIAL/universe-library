import "./setup.js";
import { GalaxyView } from "./view.js";

// the galaxy is the main page, so it starts as soon as the module runs
const view = new GalaxyView();
window.galaxyView = view; // handy for tuning from the console
view.start();
