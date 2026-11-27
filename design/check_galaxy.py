"""
A quick check of the galaxy page, to run after any change (2026-11-27):

    .venv\\Scripts\\python design\\check_galaxy.py

It renders "/" through Django's test client against the real db.sqlite3 (read only,
nothing is written) and checks what most often breaks:

  - the page answers 200 and its data (GALAXY_DATA) is valid JSON
  - the import map names every module in static/Scripts/galaxy/, and every versioned
    URL - scripts, styles, preloads - points at a file that exists, with the hash
    of what is on disk now
  - every place has finite coordinates, and every photo it names is on disk
  - with PUBLIC_SITE on, no fair-use image is offered

It does not run the 3D view; for that, open the page and check the console is
clean and the loader says Ready (AGENTS.md, section 7.7, has the measuring snippets).
Exit code 0 when everything passes, 1 otherwise.
"""
import hashlib
import json
import math
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402
from django.test import Client  # noqa: E402
from django.test.utils import override_settings  # noqa: E402

from starsystems.image_sources import IMAGE_SOURCES  # noqa: E402

STATIC = ROOT / "static"
failures = []


def check(ok, what):
    print(("  ok    " if ok else "  FAIL  ") + what)
    if not ok:
        failures.append(what)


def page():
    response = Client(HTTP_HOST="localhost").get("/")
    html = response.content.decode("utf-8")
    return response.status_code, html


def page_data(html):
    match = re.search(r'<script id="GALAXY_DATA" type="application/json">(.*?)</script>', html, re.S)
    return json.loads(match.group(1)) if match else None


print("The galaxy page")
status, html = page()
check(status == 200, f"answers 200 (got {status})")
data = page_data(html)
check(data is not None, "carries GALAXY_DATA as valid JSON")

print("Versioned scripts and styles")
importmap = json.loads(re.search(r'<script type="importmap">(.*?)</script>', html, re.S).group(1))["imports"]
modules = sorted(p.name for p in (STATIC / "Scripts" / "galaxy").glob("*.js"))
mapped = {key.rsplit("/", 1)[-1] for key in importmap if "/Scripts/galaxy/" in key}
check(set(modules) <= mapped, f"the import map names all {len(modules)} galaxy modules")
urls = set(importmap.values())
urls |= set(re.findall(r'href="([^"]+\?v=[0-9a-f]+)"', html))
urls |= set(re.findall(r'src="([^"]+\?v=[0-9a-f]+)"', html))
stale = []
for url in sorted(u for u in urls if "?v=" in u):
    path, version = url.split("?v=")
    file = STATIC / path.split(settings.STATIC_URL.strip("/") + "/", 1)[-1]
    if not file.is_file():
        stale.append(f"{url} (no such file)")
    elif hashlib.sha256(file.read_bytes()).hexdigest()[:10] != version:
        stale.append(f"{url} (hash does not match the file)")
check(not stale, f"{len(urls)} versioned URLs point at real files with current hashes" + (": " + ", ".join(stale) if stale else ""))

print("Places")
bad = []
groups = ["deepSky", "planetarySystems", "fiction", "spacecraft", "stellarObjects"]
for group in groups:
    for place in data.get(group, []):
        for key in ("l", "b", "d", "x", "z", "au"):
            if key in place and not (isinstance(place[key], (int, float)) and math.isfinite(place[key])):
                bad.append(f"{group}:{place.get('name')}.{key}")
for system in data.get("systems", []):
    placement = system.get("placement", {})
    if not any(k in placement for k in ("d", "x")):
        bad.append(f"systems:{system.get('name')} has no position")
counts = ", ".join(f"{g} {len(data.get(g, []))}" for g in groups + ["systems"])
check(not bad, f"every place has finite coordinates ({counts})" + (": " + ", ".join(bad[:10]) if bad else ""))
missing = [p["image"] for g in groups for p in data.get(g, []) if p.get("image") and not (STATIC / "Images" / "DeepSky" / p["image"]).is_file()]
check(not missing, "every photo named is on disk" + (": " + ", ".join(missing) if missing else ""))

print("Public site")
fair = {slug for slug, source in IMAGE_SOURCES.items() if source["license"].lower().startswith("fair use")}
with override_settings(PUBLIC_SITE=True):
    _, public_html = page()
public = page_data(public_html)
offered = {p["image"][:-4] for g in groups for p in public.get(g, []) if p.get("image")}
check(not (offered & fair), f"with PUBLIC_SITE on, none of the {len(fair)} fair-use images is offered")

print()
print("All checks passed." if not failures else f"{len(failures)} check(s) failed.")
sys.exit(1 if failures else 0)
