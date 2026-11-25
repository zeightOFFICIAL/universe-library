import re
from pathlib import Path

from django.conf import settings
from django.shortcuts import render, HttpResponse

from mysite.PredefinedSystems.AlphaCentauri import System as Alpha
from mysite.PredefinedSystems.SolarSystem import System as Solar

from starsystems.galaxy import (
    BACKGROUND_GALAXY_IMAGES,
    CELESTIAL_POLE_GALACTIC,
    GALAXIES,
    IMAGE_CREDITS,
    SUN_HEIGHT_ABOVE_PLANE_LY,
    SUN_TO_GALACTIC_CENTRE_LY,
    deep_sky,
    fictional_places,
    galaxy_placement,
    planetary_systems,
    spacecraft,
    stellar_objects,
    territories,
)
from starsystems.image_sources import IMAGE_SOURCES
from mysite.ServerScripts import (
    get_sql_system,
    get_sql_system_id,
    get_sql_systems_thumbnail,
    get_sql_system_links,
)

# The two systems that are Python rather than database rows. Everything the main
# page needs of a system is its name, its page and its accent colour; where it sits
# in the galaxy comes from the galaxy_placement table, keyed by the same href.
PREDEFINED_SYSTEM_LINKS = [
    {
        "name": "Solar",
        "href": "Solar",
        "color": "#FBAB7E",
        "ready": True,
        "about": "The Sun and everything held by it: eight planets, their moons, the asteroid and Kuiper belts, and the Oort cloud reaching a light-year out. Home, 26,700 ly from the centre of the galaxy.",
    },
    {
        "name": "Alpha Centauri",
        "href": "AlphaCentauri",
        "color": "#FF0000",
        "ready": True,
        "about": "The nearest star system: two Sun-like stars orbiting each other every 80 years, and the red dwarf Proxima Centauri, the closest star of all, with at least one planet in its habitable zone.",
    },
]

# Photographs for the info cards. A card shows one only when the file is on disk, so
# an image can be added later by dropping it in, and a missing one never makes the
# page request a file that is not there (the galaxy page makes no external requests).
INFO_IMAGE_DIR = Path(settings.BASE_DIR) / "static" / "Images" / "DeepSky"


def image_slug(entry):
    return re.sub(r"[^a-z0-9]+", "-", (entry.get("alias") or entry["name"]).lower()).strip("-")


def short_credit(source):
    author = source["author"]
    if len(author) > 60:
        author = author[:57].rstrip(" ,;/(") + "…"
    return f"{author} · {source['license']}"


def with_images(entries):
    found = []
    for entry in entries:
        slug = image_slug(entry)
        source = IMAGE_SOURCES.get(slug)
        # an image is used only when it is on disk and we know whose it is
        if source and (INFO_IMAGE_DIR / f"{slug}.jpg").is_file():
            entry = dict(entry, image=f"{slug}.jpg", imageCredit=short_credit(source), imageSource=source["page"])
        found.append(entry)
    return found


def universe_page(request) -> HttpResponse:
    links = PREDEFINED_SYSTEM_LINKS + get_sql_system_links()
    Head = '<meta charset="UTF-8" name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="../static/Icons/UniverseFavicon.svg" type="image/svg+xml"><link rel="icon" href="../static/Icons/UniverseFavicon.ico" sizes="16x16 32x32 48x48"><link rel="apple-touch-icon" href="../static/Icons/UniverseLogo-180.png"><meta name="theme-color" content="#05070d"><title>Universe Library</title>'
    # the places come from the database on every request, so a new row shows at once
    placement = galaxy_placement()
    galaxy = {
        "sunDistance": SUN_TO_GALACTIC_CENTRE_LY,
        "sunHeight": SUN_HEIGHT_ABOVE_PLANE_LY,
        "deepSky": with_images(deep_sky()),
        "galaxies": GALAXIES,
        "planetarySystems": planetary_systems(),
        "fiction": with_images(fictional_places()),
        "spacecraft": with_images(spacecraft()),
        "stellarObjects": with_images(stellar_objects()),
        "celestialPole": CELESTIAL_POLE_GALACTIC,
        "backgroundGalaxies": BACKGROUND_GALAXY_IMAGES,
        "credits": IMAGE_CREDITS,
        "territories": territories(),
        "systems": [
            dict(link, name=placement[link["href"]].get("label", link["name"]), placement=placement[link["href"]])
            for link in links
            if link["href"] in placement
            and not placement[link["href"]].get("hidden")
        ],
    }
    return render(request, "Universe.html", {"head": Head, "galaxy": galaxy})


def template_system_page(request, name) -> HttpResponse:
    system_id = get_sql_system_id(name)
    System = get_sql_system(system_id)
    return render(
        request,
        "System.html",
        {
            "head": System.get_html_head,
            "mainpanels": System.get_main_panels,
            "accentbar": System.get_accent_bar,
            "objects": System.get_objects_repr,
            "panels": System.get_object_panels,
            "sidepanel_objects": System.get_star_sidepanel,
            "sidepanel_buttons": System.get_side_buttons,
            "sidepanel_univ": System.get_univ_sidepanel(get_sql_systems_thumbnail()),
        },
    )


def alpha_system_page(request) -> HttpResponse:
    return render(
        request,
        "System.html",
        {
            "head": Alpha.get_html_head,
            "mainpanels": Alpha.get_main_panels,
            "accentbar": Alpha.get_accent_bar,
            "objects": Alpha.get_objects_repr,
            "panels": Alpha.get_object_panels,
            "sidepanel_objects": Alpha.get_star_sidepanel,
            "sidepanel_buttons": Alpha.get_side_buttons,
            "sidepanel_univ": Alpha.get_univ_sidepanel(get_sql_systems_thumbnail()),
        },
    )


def solar_system_page(request) -> HttpResponse:
    return render(
        request,
        "System.html",
        {
            "head": Solar.get_html_head,
            "mainpanels": Solar.get_main_panels,
            "accentbar": Solar.get_accent_bar,
            "objects": Solar.get_objects_repr,
            "panels": Solar.get_object_panels,
            "sidepanel_objects": Solar.get_star_sidepanel,
            "sidepanel_buttons": Solar.get_side_buttons,
            "sidepanel_univ": Solar.get_univ_sidepanel(get_sql_systems_thumbnail()),
        },
    )
