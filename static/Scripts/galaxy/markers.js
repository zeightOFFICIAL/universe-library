// spots a link label tries, in order: [side, vertical steps]
/*
 * Where a label may sit, tried in order: [side, rows up or down, steps out]. Beside its
 * dot first, then up or down on a stick, up to four rows. The sticks are always
 * vertical (owner, 2026-11-27: like falling stars), so nothing steps out sideways;
 * the third number stays for that, at 0.
 */
export const LABEL_SPOTS = [
    [1, 0, 0], [-1, 0, 0],
    [1, -1, 0], [1, 1, 0], [-1, -1, 0], [-1, 1, 0],
    [1, -2, 0], [1, 2, 0], [-1, -2, 0], [-1, 2, 0],
    [1, -3, 0], [1, 3, 0], [-1, -3, 0], [-1, 3, 0],
    [1, -4, 0], [1, 4, 0], [-1, -4, 0], [-1, 4, 0],
];
// one step out, in pixels
export const LABEL_REACH = 22;

// a cluster card's icon sits this far below the card's top edge (margin + half the icon)
const CLUSTER_ICON_TOP = 16.5;

export class Marker {
    constructor({
        position,
        name,
        sub = "",
        level,
        layer = "systems",
        kind = "link",
        href = null,
        color = null,
        fictional = false,
        onClick = null,
        priority = null,
        tangent = null,
        alias = undefined,
        // distance fades, in scene units: the label comes in as the camera closes
        // from far * 1.3 to far, and leaves again between near and near * 0.7
        far = Infinity,
        near = 0,
        // "camera" measures from the camera to the label's own point, "target" from
        // the camera to the pivot - right for things as big as an arm
        measureFrom = "target",
        members = null,
        membersNote = "",
        // a system whose page is still empty: shown, but quieter, and it says so
        // "map": a real place with no page yet; "fiction": a place from a story
        variant = null,
        // not a star system: a station, a spacecraft, a wormhole - drawn as a diamond
        object = false,
    }) {
        this.position = position;
        this.name = name;
        this.object = object;
        this.level = level;
        this.kind = kind;
        // where a link label sits relative to its icon: side 1 = right, -1 = left,
        // and a vertical shift in pixels when it had to step out of another's way
        this.side = 1;
        this.shift = 0;
        this.alias = alias;
        this.layer = layer;
        this.far = far;
        this.near = near;
        this.measureFrom = measureFrom;
        this.tangent = tangent;
        this.fade = 0;
        this.drawnFade = -1;
        const el = document.createElement(href ? "a" : "div");
        el.className = `GalaxyMarker ${kind === "region" ? "Region" : kind === "ring" ? "Ring" : "Link"}${fictional ? " Fictional" : ""}${members ? " Cluster" : ""}${variant === "map" ? " MapOnly" : variant === "fiction" ? " Fiction" : ""}${object ? " Object" : ""}`;
        if (href) el.href = href;
        if (color) el.style.setProperty("--marker-color", color);
        if (kind === "link") {
            const icon = document.createElement("span");
            icon.className = "GalaxyMarkerIcon";
            el.appendChild(icon);
        }
        const text = document.createElement("span");
        text.className = "GalaxyMarkerText";
        // a cluster's name is a button of its own, so its member links stay links
        const head = document.createElement(members ? "button" : "span");
        if (members) {
            head.type = "button";
            head.className = "GalaxyMarkerHead";
        } else {
            head.style.display = "contents";
        }
        head.innerHTML = `<span class="GalaxyMarkerName"></span>${sub ? '<span class="GalaxyMarkerSub"></span>' : ""}`;
        head.querySelector(".GalaxyMarkerName").textContent = name;
        if (sub) head.querySelector(".GalaxyMarkerSub").textContent = sub;
        text.appendChild(head);
        if (members) this.buildMembers(el, text, members, membersNote);
        el.appendChild(text);
        if (onClick) {
            (members ? head : el).addEventListener("click", (event) => {
                event.preventDefault();
                onClick();
            });
        }
        this.el = el;
        this.href = href;
        this.iconOnly = false;
        this.centered = kind !== "link";
        this.anchorTop = members ? CLUSTER_ICON_TOP : null;
        this.visible = false;
        // lower wins when two labels overlap: our systems first, then structure, then landmarks
        this.priority = priority ?? (kind === "link" ? 0 : kind === "ring" ? 3 : layer === "arms" ? 1 : 2);
    }

    /*
     * A cluster folds its systems into a strip of coloured dots beside its name.
     * Hovering or focusing it opens the list; a click on the dots pins it open, which
     * is also how it opens on a touch screen. The closed card is what the declutter
     * measures, so opening one never pushes other labels around.
     */
    buildMembers(el, text, members, note) {
        const row = document.createElement("span");
        row.className = "GalaxyMarkerRow";
        row.appendChild(text.firstChild);
        const dots = document.createElement("button");
        dots.type = "button";
        dots.className = "GalaxyMarkerDots";
        dots.setAttribute("aria-expanded", "false");
        dots.setAttribute("aria-label", `List the ${members.length} systems`);
        for (const member of members) {
            const dot = document.createElement("i");
            dot.style.setProperty("--member-color", member.color);
            if (member.soon) dot.className = "Soon";
            if (member.variant) dot.classList.add(member.variant === "fiction" ? "Fiction" : "MapOnly");
            dots.appendChild(dot);
        }
        row.appendChild(dots);
        text.appendChild(row);

        const list = document.createElement("span");
        list.className = "GalaxyMarkerMembers";
        for (const member of members) {
            // a system with a page is a link to it; one without flies the camera there
            const link = document.createElement(member.href ? "a" : "button");
            link.className = `GalaxyMember${member.soon ? " Soon" : ""}${member.variant === "fiction" ? " Fiction" : member.variant === "map" ? " MapOnly" : ""}`;
            if (member.href) link.href = member.href;
            else {
                link.type = "button";
                link.addEventListener("click", (event) => {
                    event.preventDefault();
                    member.fly?.();
                });
            }
            link.setAttribute("aria-label", member.title);
            link.style.setProperty("--member-color", member.color);
            link.innerHTML = "<span></span><small></small>";
            link.firstChild.textContent = member.name;
            link.lastChild.textContent = member.soon ? "soon" : member.distance;
            list.appendChild(link);
        }
        if (note) {
            const caption = document.createElement("span");
            caption.className = "GalaxyMembersNote";
            caption.textContent = note;
            list.appendChild(caption);
        }
        text.appendChild(list);

        let pinned = false;
        const setOpen = (open) => {
            el.classList.toggle("Open", open);
            dots.setAttribute("aria-expanded", String(open));
        };
        dots.addEventListener("click", (event) => {
            event.preventDefault();
            pinned = !pinned;
            setOpen(pinned);
        });
        el.addEventListener("pointerenter", (event) => event.pointerType === "mouse" && setOpen(true));
        el.addEventListener("pointerleave", (event) => event.pointerType === "mouse" && setOpen(pinned));
        el.addEventListener("focusin", () => setOpen(true));
        el.addEventListener("focusout", (event) => {
            if (!el.contains(event.relatedTarget)) setOpen(pinned);
        });
        el.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            pinned = false;
            setOpen(false);
        });
    }

    // a new subtitle; the box is measured again on the next frame
    setSub(text) {
        const sub = this.el.querySelector(".GalaxyMarkerSub");
        if (!sub) return;
        sub.textContent = text;
        this.width = 0;
        this.height = 0;
    }

    // how much of the label the camera distance allows, 0..1
    distanceFade(distance) {
        let fade = 1;
        if (this.far !== Infinity) {
            const t = Math.min(Math.max((this.far * 1.3 - distance) / (this.far * 0.3), 0), 1);
            fade *= t * t * (3 - 2 * t);
        }
        if (this.near > 0) {
            const t = Math.min(Math.max((distance - this.near * 0.7) / (this.near * 0.3), 0), 1);
            fade *= t * t * (3 - 2 * t);
        }
        return fade;
    }

    /*
     * Project to screen space and work out how strongly the label should show. The
     * view passes in every other reason to fade (level, layer, viewing angle, dust)
     * as one factor; the view decides afterwards which labels survive collisions.
     */
    project(camera, width, height, fade, targetDistance) {
        const p = this.position.clone().project(camera);
        this.onScreen = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
        this.screenX = (p.x * 0.5 + 0.5) * width;
        this.screenY = (-p.y * 0.5 + 0.5) * height;
        // kept apart from the layer and level factors, so the side panels can tell
        // what is in view even when its label is switched off
        this.distanceFactor = this.far !== Infinity || this.near > 0 ? this.distanceFade(this.measureFrom === "camera" ? camera.position.distanceTo(this.position) : targetDistance) : 1;
        fade *= this.distanceFactor;
        this.fade = fade;
        // below a few percent a label is noise, and it should not block others
        this.candidate = this.onScreen && fade > 0.04;
        if (this.tangent && this.candidate) {
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

    // vertical distance from the point to the middle of the label box
    get anchorShift() {
        return this.anchorTop === null ? 0 : this.height / 2 - this.anchorTop;
    }

    apply(visible, iconHalf) {
        if (visible !== this.visible) {
            this.el.classList.toggle("Visible", visible);
            this.visible = visible;
        }
        if (!this.onScreen) return;
        // only write the fade when it has moved enough to see
        if (visible && Math.abs(this.fade - this.drawnFade) > 0.02) {
            this.el.style.setProperty("--fade", this.fade.toFixed(2));
            this.drawnFade = this.fade;
        }
        // the name has a fade of its own: the dot stays while the name waits for the camera
        const text = this.textFade ?? 1;
        if (visible && Math.abs(text - (this.drawnText ?? -1)) > 0.02) {
            this.el.style.setProperty("--text-fade", text.toFixed(2));
            this.drawnText = text;
        }
        if (Boolean(this.crowded) !== this.drawnCrowded) {
            this.el.classList.toggle("Crowded", Boolean(this.crowded));
            this.drawnCrowded = Boolean(this.crowded);
        }
        if (this.iconOnly !== this.drawnIconOnly) {
            this.el.classList.toggle("IconOnly", this.iconOnly);
            this.drawnIconOnly = this.iconOnly;
        }
        const rotate = this.angle ? ` rotate(${this.angle.toFixed(1)}deg)` : "";
        if (this.centered) {
            this.el.style.transform = `translate(${this.screenX}px, ${this.screenY}px) translate(-50%, -50%)${rotate}`;
            return;
        }
        // the icon always sits on the point; only the text steps aside
        const left = this.side < 0;
        const x = left ? this.screenX + iconHalf - (this.width || 0) : this.screenX - iconHalf;
        const y = this.anchorTop === null ? "translate(0, -50%)" : `translate(0, -${this.anchorTop}px)`;
        this.el.style.transform = `translate(${x}px, ${this.screenY}px) ${y}`;
        const reach = this.reach || 0;
        if (left !== this.drawnLeft || this.shift !== this.drawnShift || reach !== this.drawnReach) {
            this.el.classList.toggle("Left", left);
            this.el.classList.toggle("Displaced", this.shift !== 0 || reach !== 0);
            // the text moves out and up or down; the stick runs from the dot to where it went
            const dx = (left ? -1 : 1) * reach;
            this.el.style.setProperty("--label-shift", `${this.shift}px`);
            this.el.style.setProperty("--label-reach", `${dx}px`);
            const length = Math.hypot(dx, this.shift);
            this.el.style.setProperty("--leader", `${Math.max(length - 3, 0).toFixed(1)}px`);
            // measured from straight down, clockwise, as CSS rotate() turns
            this.el.style.setProperty("--leader-angle", `${((Math.atan2(-dx, this.shift) * 180) / Math.PI).toFixed(1)}deg`);
            this.el.classList.toggle("Above", this.shift < 0);
            this.drawnLeft = left;
            this.drawnShift = this.shift;
            this.drawnReach = reach;
        }
    }
}
