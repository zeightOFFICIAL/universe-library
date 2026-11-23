/*
 * A catalogue panel on the left: a searchable, filterable list of places, kept in
 * "in view first" order. Each row jumps the camera there, and rows with a page get
 * an open link as well. It knows nothing about the scene: the view hands it
 * entries and, a few times a second, asks it to re-sort by what is on screen.
 *
 * entry: { id, name, sub, color, style, filter, href, fly, inView(), distance, search }
 *   style   "page" | "map" | "fiction" | a deep-sky kind - sets the dot
 *   filter  which filter chip the entry belongs to
 */
export class Catalogue {
    constructor(panel, { filters = [], storageKey }) {
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
        this.search.addEventListener("input", () => {
            this.query = this.search.value.trim().toLowerCase();
            this.applyFilter();
        });
        // Escape clears the search before it does anything else
        this.search.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.search.value) {
                event.stopPropagation();
                this.search.value = "";
                this.query = "";
                this.applyFilter();
            }
        });

        // each panel folds on its own, and remembers it
        const fold = panel.querySelector(".PanelFold");
        const setOpen = (open) => {
            panel.classList.toggle("Folded", !open);
            fold.setAttribute("aria-expanded", String(open));
            try {
                localStorage.setItem(storageKey, open ? "1" : "0");
            } catch (e) {}
        };
        let saved = null;
        try {
            saved = localStorage.getItem(storageKey);
        } catch (e) {}
        setOpen(saved !== "0");
        fold.addEventListener("click", () => setOpen(panel.classList.contains("Folded")));
    }

    setEntries(entries) {
        this.list.textContent = "";
        this.order = "";
        this.rows = entries.map((entry) => {
            const row = document.createElement("div");
            row.className = `CatalogueRow Style-${entry.style}`;
            row.style.setProperty("--row-color", entry.color);
            const jump = document.createElement(entry.fly ? "button" : "div");
            jump.className = "CatalogueJump";
            if (entry.fly) {
                jump.type = "button";
                jump.title = `Show ${entry.name} on the map`;
                jump.addEventListener("click", () => entry.fly());
            }
            jump.innerHTML = '<span class="CatalogueDot"></span><span class="CatalogueText"><span class="CatalogueName"></span><span class="CatalogueSub"></span></span><span class="CatalogueSeen" aria-hidden="true"></span>';
            jump.querySelector(".CatalogueName").textContent = entry.name;
            jump.querySelector(".CatalogueSub").textContent = entry.sub;
            row.appendChild(jump);
            if (entry.href) {
                const open = document.createElement("a");
                open.className = "CatalogueOpen";
                open.href = entry.href;
                open.title = `Open ${entry.name}`;
                open.setAttribute("aria-label", open.title);
                open.innerHTML = '<span aria-hidden="true">&rarr;</span>';
                row.appendChild(open);
            }
            this.list.appendChild(row);
            return { entry, row, seen: false, search: `${entry.name} ${entry.sub} ${entry.search || ""}`.toLowerCase() };
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
