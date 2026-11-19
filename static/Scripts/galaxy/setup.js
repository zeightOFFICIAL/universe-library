import * as THREE from "three";

/*
 * Every colour in the galaxy is authored display-referred - the number written is
 * the number meant - and the only transform between scene and screen is the tone
 * curve in the composite pass (post.js). three's colour management would otherwise
 * linearise hex colours and, because the scene renders into an offscreen target,
 * never encode them back. This runs before any other galaxy module: main.js
 * imports it first.
 */
THREE.ColorManagement.enabled = false;
