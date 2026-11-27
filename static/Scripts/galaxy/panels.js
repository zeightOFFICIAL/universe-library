/*
 * A catalogue panel on the left: a searchable, filterable list of places, kept in
 * "in view first" order. Each row jumps the camera there, and rows with a page get
 * an open link as well. It knows nothing about the scene: the view hands it
 * entries and, a few times a second, asks it to re-sort by what is on screen.
 *
 * entry: { id, name, sub, color, style, filter, href, fly, inView(), distance, search, position }
 *   style     "page" | "map" | "fiction" | a deep-sky kind - sets the dot
 *   filter    which filter chip the entry belongs to
 *   position  where it is; with the distances option the row prints a line of
 *             distances from it, refreshed as the view moves
 */
/*
 * The catalogues share one column, so they open one at a time: unfolding one folds
 * the rest. Three open lists on a laptop screen left each about one row tall. One
 * is always open: a header only unfolds, never folds, and the column never ends up
 * as three bare headers.
 */
const OPEN_GROUP = [];

export function ensureOneOpen() {
    if (OPEN_GROUP.length && OPEN_GROUP.every((c) => c.panel.classList.contains("Folded"))) OPEN_GROUP[0].setOpen(true);
}

export class Catalogue {
    constructor(panel, { filters = [], storageKey, distances = null }) {
        this.distances = distances;
        this.panel = panel;
        this.list = panel.querySelector(".CatalogueList");
        this.search = panel.querySelector(".PanelSearch");
        this.count = panel.querySelector(".PanelCount");
        this.filterBar = panel.querySelector(".PanelFilters");
        this.filter = "all";
        this.query = "";
        this.rows = [];
        this.order = "";
        this.storageKey = storageKey;

        for (const [value, label] of [["all", "All"], ...filters]) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "PanelFilter";
            chip.textContent = label;
            chip.dataset.filter = value;
            chip.setAttribute("aria-pressed", String(value === "all"));
            chip.addEventListener("click", () => {
                this.filter = value;
                for (const other of this.filterBar.children) other.setAttribute("aria-pressed", String(other === chip));
                this.applyFilter();
            });
            this.filterBar.appendChild(chip);
        }
        /*
         * A clear button inside the field (owner, 2026-11-26), shown while there is
         * something to clear. The browser's own (Chromium only) is hidden in CSS.
         */
        const wrap = document.createElement("span");
        wrap.className = "PanelSearchWrap";
        this.search.replaceWith(wrap);
        wrap.appendChild(this.search);
        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "PanelSearchClear";
        clear.hidden = true;
        clear.setAttribute("aria-label", "Clear the search");
        clear.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>';
        wrap.appendChild(clear);
        const showClear = () => {
            clear.hidden = !this.search.value;
        };
        clear.addEventListener("click", () => {
            this.search.value = "";
            this.query = "";
            showClear();
            this.applyFilter();
            this.search.focus();
        });
        this.search.addEventListener("input", () => {
            this.query = this.search.value.trim().toLowerCase();
            showClear();
            this.applyFilter();
        });
        // Escape clears the search before it does anything else
        this.search.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.search.value) {
                event.stopPropagation();
                this.search.value = "";
                this.query = "";
                showClear();
                this.applyFilter();
            }
        });

        // one panel open at a time, remembered; the first one opens by default
        const fold = panel.querySelector(".PanelFold");
        const setOpen = (open) => {
            panel.classList.toggle("Folded", !open);
            fold.setAttribute("aria-expanded", String(open));
            try {
                localStorage.setItem(storageKey, open ? "1" : "0");
            } catch (e) {}
            if (open) {
                for (const other of OPEN_GROUP) if (other !== this && !other.panel.classList.contains("Folded")) other.setOpen(false);
                this.refresh(true);
            }
        };
        this.setOpen = setOpen;
        let saved = null;
        try {
            saved = localStorage.getItem(storageKey);
        } catch (e) {}
        const anotherOpen = OPEN_GROUP.some((other) => !other.panel.classList.contains("Folded"));
        OPEN_GROUP.push(this);
        setOpen(saved === null ? !anotherOpen : saved === "1" && !anotherOpen);
        fold.addEventListener("click", () => {
            if (panel.classList.contains("Folded")) setOpen(true);
        });
    }

    /*
     * Rows only near the visible part of the list carry live figures (2026-11-27): a
     * row's distance cells are built the first time it scrolls within 300 px of view,
     * and only such rows are rewritten on each refresh. Before, all ~250 rows were
     * filled and rewritten every 400 ms, about 3,500 elements nobody could see.
     */
    watchRows() {
        this.watcher?.disconnect();
        if (!("IntersectionObserver" in window)) return;
        this.byRow = new WeakMap();
        this.watcher = new IntersectionObserver(
            (changes) => {
                for (const change of changes) {
                    const item = this.byRow.get(change.target);
                    if (!item) continue;
                    item.near = change.isIntersecting;
                    if (item.near) this.fillDistances(item);
                }
            },
            { root: this.list, rootMargin: "300px 0px" }
        );
    }

    fillDistances(item) {
        if (!this.distances || !item.distanceLine || item.row.hidden) return;
        const values = this.distances(item.entry);
        if (item.distanceLine.children.length !== values.length) item.distanceLine.innerHTML = "<span><b></b><i></i></span>".repeat(values.length);
        const cells = item.distanceLine.children;
        values.forEach(([label, value, wide], i) => {
            // a wide figure takes the whole row
            cells[i].classList.toggle("Wide", Boolean(wide));
            const [name, figure] = cells[i].children;
            if (name.textContent !== label) name.textContent = label;
            if (figure.textContent !== value) figure.textContent = value;
        });
    }

    setEntries(entries) {
        this.list.textContent = "";
        this.order = "";
        this.watchRows();
        this.rows = entries.map((entry) => {
            const row = document.createElement("div");
            row.className = `CatalogueRow Style-${entry.style}`;
            row.style.setProperty("--row-color", entry.color);
            const jump = document.createElement(entry.fly ? "button" : "div");
            jump.className = "CatalogueJump";
            if (entry.fly) {
                jump.type = "button";
                jump.setAttribute("aria-label", `Fly to ${entry.name} and see it close up`);
                jump.addEventListener("click", () => entry.fly());
            }
            jump.innerHTML = '<span class="CatalogueDot"></span><span class="CatalogueText"><span class="CatalogueName"></span><span class="CatalogueSub"></span></span><span class="CatalogueSeen" aria-hidden="true"></span>';
            jump.querySelector(".CatalogueName").textContent = entry.name;
            const sub = jump.querySelector(".CatalogueSub");
            sub.textContent = entry.sub || "";
            sub.hidden = !entry.sub;
            let distanceLine = null;
            if (this.distances && entry.position) {
                // short columns, label over value, filled in by refresh()
                distanceLine = document.createElement("span");
                distanceLine.className = "CatalogueDistances";
                jump.querySelector(".CatalogueText").appendChild(distanceLine);
            }
            row.appendChild(jump);
            /*
             * Two buttons on the right of every row (owner, 2026-11-26): close-up,
             * which is also what a click anywhere on the row does, and - when the
             * place has one - its page.
             */
            if (entry.fly) {
                const close = document.createElement("button");
                close.type = "button";
                close.className = "CatalogueOpen CatalogueCloseUp";
                close.setAttribute("aria-label", `Fly to ${entry.name} and see it close up`);
                close.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2L14 14M7 4.8v4.4M4.8 7h4.4"/></svg>';
                close.addEventListener("click", () => entry.fly());
                row.appendChild(close);
            }
            if (entry.href) {
                const open = document.createElement("a");
                open.className = "CatalogueOpen";
                open.href = entry.href;
                open.setAttribute("aria-label", `Open the ${entry.name} page`);
                open.innerHTML = '<span aria-hidden="true">&rarr;</span>';
                row.appendChild(open);
            }
            // the buttons sit in the row's top corner; the name keeps clear of them
            row.classList.add(`Actions${Boolean(entry.fly) + Boolean(entry.href)}`);
            this.list.appendChild(row);
            // without an observer every row counts as near, as before
            const item = { entry, row, distanceLine, seen: false, near: !this.watcher, search: `${entry.name} ${entry.sub || ""} ${entry.search || ""}`.toLowerCase() };
            if (this.watcher) {
                this.byRow.set(row, item);
                this.watcher.observe(row);
            }
            return item;
        });
        this.applyFilter();
        this.refresh(true);
    }

    applyFilter() {
        let shown = 0;
        for (const item of this.rows) {
            const match = (this.filter === "all" || item.entry.filter === this.filter) && (!this.query || item.search.includes(this.query));
            item.row.hidden = !match;
            if (match) shown++;
        }
        this.count.textContent = String(shown);
        let empty = this.list.querySelector(".CatalogueEmpty");
        if (!shown && !empty) {
            empty = document.createElement("p");
            empty.className = "CatalogueEmpty";
            empty.textContent = "Nothing matches.";
            this.list.appendChild(empty);
        } else if (shown && empty) {
            empty.remove();
        }
    }

    /*
     * In view first, then nearest to the Sun. Rows are moved rather than rebuilt,
     * so a row keeps its focus and hover while the list re-sorts under it, and
     * nothing moves at all unless the set of things in view has changed.
     */
    refresh(force = false) {
        if (this.panel.classList.contains("Folded") && !force) return;
        // the distances move with the view, so they are rewritten even when the order holds
        if (this.distances) for (const item of this.rows) if (item.near) this.fillDistances(item);
        for (const item of this.rows) item.seen = Boolean(item.entry.inView?.());
        const sorted = [...this.rows].sort((a, b) => b.seen - a.seen || (a.entry.distance ?? Infinity) - (b.entry.distance ?? Infinity));
        const order = sorted.map((item) => `${item.entry.id}${item.seen ? "+" : ""}`).join("|");
        if (order === this.order && !force) return;
        this.order = order;
        for (const item of sorted) {
            item.row.classList.toggle("InView", item.seen);
            this.list.appendChild(item.row);
        }
        const empty = this.list.querySelector(".CatalogueEmpty");
        if (empty) this.list.appendChild(empty);
    }
}
