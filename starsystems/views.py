from django.shortcuts import render, HttpResponse

from mysite.PredefinedSystems.AlphaCentauri import System as Alpha
from mysite.PredefinedSystems.SolarSystem import System as Solar

from starsystems.galaxy import (
    BACKGROUND_GALAXY_IMAGES,
    CELESTIAL_POLE_GALACTIC,
    DEEP_SKY,
    GALAXIES,
    GALAXY_PLACEMENT,
    IMAGE_CREDITS,
    SUN_HEIGHT_ABOVE_PLANE_LY,
    SUN_TO_GALACTIC_CENTRE_LY,
)
from mysite.ServerScripts import (
    get_sql_system,
    get_sql_system_id,
    get_sql_systems_thumbnail,
    get_sql_system_links,
)

# The two systems that are Python rather than database rows. Everything the main
# page needs of a system is its name, its page and its accent colour; where it sits
# in the galaxy comes from GALAXY_PLACEMENT, keyed by the same href.
PREDEFINED_SYSTEM_LINKS = [
    {"name": "Solar", "href": "Solar", "color": "#FBAB7E"},
    {"name": "Alpha Centauri", "href": "AlphaCentauri", "color": "#FF0000"},
]


def universe_page(request) -> HttpResponse:
    links = PREDEFINED_SYSTEM_LINKS + get_sql_system_links()
    Head = '<meta charset="UTF-8" name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="../static/Icons/LogoStrip.ico" charset="UTF-8"><title>Universe Library</title>'
    galaxy = {
        "sunDistance": SUN_TO_GALACTIC_CENTRE_LY,
        "sunHeight": SUN_HEIGHT_ABOVE_PLANE_LY,
        "deepSky": DEEP_SKY,
        "galaxies": GALAXIES,
        "celestialPole": CELESTIAL_POLE_GALACTIC,
        "backgroundGalaxies": BACKGROUND_GALAXY_IMAGES,
        "credits": IMAGE_CREDITS,
        "systems": [
            dict(link, placement=GALAXY_PLACEMENT[link["href"]])
            for link in links
            if link["href"] in GALAXY_PLACEMENT
            and not GALAXY_PLACEMENT[link["href"]].get("hidden")
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
