import * as THREE from "three";
import { SECTOR } from "./overlays.js";

/*
 * The territories layer (owner, 2026-11-26): nations and factions, for the owner's
 * own worlds. Data only - the territories table - and while it is empty the layer's
 * switch does not appear at all.
 *
 * A territory is drawn one of two ways:
 *   sectors  a list of sector names ("K16 K17 L16") filled as squares, with a border
 *            round the outside of the set - the easy way: read them off the grid
 *   points   a polygon, "X,Y; X,Y; ..." in the coordinates the readout shows
 *            (galactocentric kly: X towards the core from the Sun's side, Y the way
 *            the disk turns)
 * Each is a faint fill in its colour, a solid border, and its name in the middle.
 * The places it lists as members take its colour on the map while the layer is on.
 */
const HALF = (SECTOR.size * SECTOR.count) / 2;
const LETTERS = "ABCDEFGHIJKLMNOPQRST";

// readout coordinates (X, Y) to the scene's plane (x, z): X = -z, Y = -x
const toScene = ([X, Y]) => new THREE.Vector2(-Y, -X);

function parseSector(name) {
    const match = /^([A-Ta-t])(\d{1,2})$/.exec(name.trim());
    if (!match) return null;
    const column = LETTERS.indexOf(match[1].toUpperCase());
    const row = Number(match[2]) - 1;
    if (row < 0 || row >= SECTOR.count) return null;
    return { column, row };
}

export function buildTerritories(territories = []) {
    const group = new THREE.Group();
    group.renderOrder = 8;
    const parts = [];
    const labels = [];
    for (const t of territories) {
        const color = new THREE.Color(t.color || "#c7a6ff");
        const fill = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const edge = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
        const edges = [];
        let centre = new THREE.Vector2();
        let weight = 0;
        if (t.sectors?.length) {
            const cells = t.sectors.map(parseSector).filter(Boolean);
            const key = (c, r) => `${c},${r}`;
            const owned = new Set(cells.map((c) => key(c.column, c.row)));
            const geometries = [];
            for (const { column, row } of cells) {
                const x0 = -HALF + column * SECTOR.size;
                const z0 = -HALF + row * SECTOR.size;
                const x1 = x0 + SECTOR.size;
                const z1 = z0 + SECTOR.size;
                geometries.push(new THREE.PlaneGeometry(SECTOR.size, SECTOR.size).rotateX(-Math.PI / 2).translate(x0 + SECTOR.size / 2, 0, z0 + SECTOR.size / 2));
                // a border only where the neighbour is not ours
                if (!owned.has(key(column, row - 1))) edges.push(x0, 0, z0, x1, 0, z0);
                if (!owned.has(key(column, row + 1))) edges.push(x0, 0, z1, x1, 0, z1);
                if (!owned.has(key(column - 1, row))) edges.push(x0, 0, z0, x0, 0, z1);
                if (!owned.has(key(column + 1, row))) edges.push(x1, 0, z0, x1, 0, z1);
                centre.add(new THREE.Vector2(x0 + SECTOR.size / 2, z0 + SECTOR.size / 2));
                weight++;
            }
            for (const g of geometries) {
                const mesh = new THREE.Mesh(g, fill);
                mesh.frustumCulled = false;
                group.add(mesh);
            }
        } else if (t.points?.length >= 3) {
            const outline = t.points.map(toScene);
            const shape = new THREE.Shape(outline);
            // a Shape lives in x, y; the disk is x, z
            const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(Math.PI / 2), fill);
            mesh.frustumCulled = false;
            group.add(mesh);
            outline.forEach((p, i) => {
                const q = outline[(i + 1) % outline.length];
                edges.push(p.x, 0, p.y, q.x, 0, q.y);
                centre.add(p);
                weight++;
            });
        }
        if (!weight) continue;
        centre.multiplyScalar(1 / weight);
        if (edges.length) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
            const lines = new THREE.LineSegments(geometry, edge);
            lines.frustumCulled = false;
            group.add(lines);
        }
        parts.push({ fill, edge });
        labels.push({ name: t.name, sub: [t.source, t.note].filter(Boolean).join(" · "), color: t.color, position: new THREE.Vector3(centre.x, 0, centre.y) });
    }
    return { group, parts, labels };
}

export function updateTerritories(territories, fade) {
    territories.group.visible = fade > 0.003;
    for (const { fill, edge } of territories.parts) {
        fill.opacity = 0.06 * fade;
        edge.opacity = 0.55 * fade;
    }
}
