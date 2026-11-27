"""
Versioned static URLs for the galaxy page (2026-11-27).

Browsers cache ES modules hard, and the galaxy is a couple of dozen of them: after an
update a returning visitor could run a mix of old and new modules. Every script and
stylesheet the page loads now carries ?v=<first 10 hex of its content hash>, so a
changed file has a new URL and an unchanged one stays cached.

- {% vstatic 'Styles/GalaxyStyles.css' %}  a versioned URL for one file
- {% galaxy_importmap %}                   the page's import map: "three" and its
  OrbitControls, plus every module in Scripts/galaxy/ mapped from its plain URL to its
  versioned one - which is what makes the modules' own relative imports versioned too
- {% galaxy_preloads %}                    a <link rel="modulepreload"> per module, at
  the versioned URLs, built from the folder, so the list can no longer drift

Hashes are cached by modification time, so a request costs a stat per file.
"""
import hashlib
import json
from pathlib import Path

from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.html import format_html, format_html_join
from django.utils.safestring import mark_safe

register = template.Library()

STATIC_DIR = Path(settings.BASE_DIR) / "static"
GALAXY_DIR = STATIC_DIR / "Scripts" / "galaxy"
THREE = "Vendor/three/three.module.js"
ORBIT = "Vendor/three/addons/controls/OrbitControls.js"
_cache = {}


def _hash(relative):
    path = STATIC_DIR / relative
    try:
        stamp = path.stat().st_mtime_ns
    except OSError:
        return None
    hit = _cache.get(relative)
    if hit and hit[0] == stamp:
        return hit[1]
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:10]
    _cache[relative] = (stamp, digest)
    return digest


def versioned(relative):
    url = static(relative)
    digest = _hash(relative)
    return f"{url}?v={digest}" if digest else url


def _modules():
    return sorted(f"Scripts/galaxy/{p.name}" for p in GALAXY_DIR.glob("*.js"))


@register.simple_tag
def vstatic(relative):
    return versioned(relative)


@register.simple_tag
def galaxy_importmap():
    imports = {
        "three": versioned(THREE),
        "three/addons/controls/OrbitControls.js": versioned(ORBIT),
        "three/addons/": static("Vendor/three/addons/"),
    }
    # a module's own URL, as its relative imports resolve to, onto its versioned one
    for module in _modules():
        imports[static(module)] = versioned(module)
    return mark_safe('<script type="importmap">' + json.dumps({"imports": imports}, indent=1) + "</script>")


@register.simple_tag
def galaxy_preloads():
    urls = [versioned(THREE), versioned(ORBIT)] + [versioned(m) for m in _modules()]
    return format_html_join("\n", '<link rel="modulepreload" href="{}">', ((u,) for u in urls))
