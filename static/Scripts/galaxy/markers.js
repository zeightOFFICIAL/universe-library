// spots a link label tries, in order: [side, vertical steps]
export const LABEL_SPOTS = [[1, 0], [-1, 0], [1, -1], [1, 1], [-1, -1], [-1, 1], [1, -2], [1, 2]];

export class Marker {
    constructor({
        position,
        name,
        sub = "",
        level,
        layer = "systems",
        maxDistance = Infinity,
        kind = "link",
        href = null,
        color = null,
        fictional = false,
        onClick = null,
        priority = null,
        tangent = null,
        alias = undefined,
    }) {
        this.position = position;
        this.level = level;
        this.kind = kind;
        // where a link label sits relative to its icon: side 1 = right, -1 = left,
        // and a vertical shift in pixels when it had to step out of another's way
        this.side = 1;
        this.shift = 0;
        this.alias = alias;
        this.layer = layer;
        this.maxDistance = maxDistance;
        this.tangent = tangent;
        const el = document.createElement(href ? "a" : "div");
        el.className = `GalaxyMarker ${kind === "region" ? "Region" : kind === "ring" ? "Ring" : "Link"}${fictional ? " Fictional" : ""}`;
        if (href) el.href = href;
        if (color) el.style.setProperty("--marker-color", color);
        if (kind === "link") {
            const icon = document.createElement("span");
            icon.className = "GalaxyMarkerIcon";
            el.appendChild(icon);
        }
        const text = document.createElement("span");
        text.className = "GalaxyMarkerText";
        text.innerHTML = `<span class="GalaxyMarkerName"></span>${sub ? '<span class="GalaxyMarkerSub"></span>' : ""}`;
        text.querySelector(".GalaxyMarkerName").textContent = name;
        if (sub) text.querySelector(".GalaxyMarkerSub").textContent = sub;
        el.appendChild(text);
        if (onClick) {
            el.addEventListener("click", (event) => {
                event.preventDefault();
                onClick();
            });
        }
        this.el = el;
        this.centered = kind !== "link";
        this.visible = false;
        // lower wins when two labels overlap: our systems first, then structure, then landmarks
        this.priority = priority ?? (kind === "link" ? 0 : kind === "ring" ? 3 : layer === "arms" ? 1 : 2);
    }

    // project to screen space; the view decides afterwards which labels survive
    project(camera, width, height, allowed, cameraDistance) {
        const p = this.position.clone().project(camera);
        this.onScreen = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
        this.screenX = (p.x * 0.5 + 0.5) * width;
        this.screenY = (-p.y * 0.5 + 0.5) * height;
        this.candidate = allowed && this.onScreen && cameraDistance < this.maxDistance;
        if (this.tangent) {
            // lay the label along the arm by following it to a second point
            const q = this.tangent.clone().project(camera);
            const dx = (q.x - p.x) * width;
            const dy = -(q.y - p.y) * height;
            let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            if (angle > 90) angle -= 180;
            if (angle < -90) angle += 180;
            this.angle = angle;
        }
        return this.candidate;
    }

    // label box in pixels, measured once and after a resize
    measure() {
        if (!this.width || !this.height) {
            this.width = this.el.offsetWidth;
            this.height = this.el.offsetHeight;
        }
        return this.width > 0;
    }

    apply(visible, iconHalf) {
        if (visible !== this.visible) {
            this.el.classList.toggle("Visible", visible);
            this.visible = visible;
        }
        if (!this.onScreen) return;
        const rotate = this.angle ? ` rotate(${this.angle.toFixed(1)}deg)` : "";
        if (this.centered) {
            this.el.style.transform = `translate(${this.screenX}px, ${this.screenY}px) translate(-50%, -50%)${rotate}`;
            return;
        }
        // the icon always sits on the point; only the text steps aside
        const left = this.side < 0;
        const x = left ? this.screenX + iconHalf - (this.width || 0) : this.screenX - iconHalf;
        this.el.style.transform = `translate(${x}px, ${this.screenY}px) translate(0, -50%)`;
        if (left !== this.drawnLeft || this.shift !== this.drawnShift) {
            this.el.classList.toggle("Left", left);
            this.el.classList.toggle("Displaced", this.shift !== 0);
            this.el.style.setProperty("--label-shift", `${this.shift}px`);
            this.el.style.setProperty("--leader", `${Math.abs(this.shift)}px`);
            this.el.classList.toggle("Above", this.shift < 0);
            this.drawnLeft = left;
            this.drawnShift = this.shift;
        }
    }
}
