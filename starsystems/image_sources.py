"""
Where each info-card photograph in static/Images/DeepSky/ comes from.

Keyed by the image's file name without .jpg (views.image_slug of the object's
alias or name). Photographs are from Wikimedia Commons under a free licence or in
the public domain. Images for places from fiction are references from English
Wikipedia - mostly non-free, used there under fair use - and their licence says so.
"page" is the file's description page, which carries the full attribution. The
card prints author and licence and links to the page.

The files were fetched as 1280px or 960px renders and recompressed with ffmpeg to 960px
JPEG at -q:v 2 (see AGENTS.md, "Images"). To add one: put <slug>.jpg in the
folder and an entry here.
"""

IMAGE_SOURCES = {
    '36-ophiuchi': {
        "author": 'Dune (novel), via Wikipedia',
        "license": 'Public domain, used for reference',
        "page": 'https://commons.wikimedia.org/wiki/File:Dune_by_Frank_Herbert_first_edition_cover.jpg',
    },
    '40-eridani': {
        "author": 'Vulcan (Star Trek), via Wikipedia',
        "license": 'Public domain, used for reference',
        "page": 'https://commons.wikimedia.org/wiki/File:Spock_and_T%27Pring.jpg',
    },
    'a0620-00': {
        "author": "NASA's Goddard Space Flight Center and Scientific Visualization Studio",
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Black_Hole_X-ray_binaries.jpg',
    },
    'arches': {
        "author": 'ESO/P. Espinoza',
        "license": 'CC BY 3.0',
        "page": 'https://commons.wikimedia.org/wiki/File:ESO-Arches_Cluster.jpg',
    },
    'arcturus-station': {
        "author": 'Mass Effect 3, via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:Mass_Effect_3_Game_Cover.jpg',
    },
    'babylon-5': {
        "author": 'Babylon 5, via Wikipedia',
        "license": 'Public domain, used for reference',
        "page": 'https://commons.wikimedia.org/wiki/File:Babylon_5_1994_logo_(2).svg',
    },
    'barnard-33': {
        "author": 'ESO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Nebulosa_testa_di_cavallo_con_SPECULOOS.jpg',
    },
    'battle-of-wolf-359': {
        "author": 'The Best of Both Worlds (Star Trek: The Next Generation), via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:The_Best_of_Both_Worlds_(Star_Trek,_The_Next_Generation)_Blu_ray_cover.jpeg',
    },
    'betelgeuse': {
        "author": 'ALMA (ESO/NAOJ/NRAO)/E. O’Gorman/P. Kervella',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Betelgeuse_captured_by_ALMA.jpg',
    },
    'boomerang-nebula': {
        "author": 'ESA/NASA',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Boomerang_nebula.jpg',
    },
    'caldwell-99': {
        "author": 'ESO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Part_of_the_Coalsack_Nebula.jpg',
    },
    'canopus': {
        "author": 'Arrakis, via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:GrandPalace%2BDunes.jpg',
    },
    'cas-a': {
        "author": 'X-ray: NASA/CXC/SAO; IR: NASA/ESA/CSA/STScI; Image Processing: NASA/CXC/SAO/L. Frattare and K. Arcand',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:NASA%27s_Chandra_Releases_%27Red,_White,_and_Blue%27_Universe_for_US_250th_(Cassiopeia_A_composite).jpg',
    },
    'collector-base': {
        "author": 'List of Mass Effect characters, via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:Mass_Effect_characters.png',
    },
    'crab-pulsar': {
        "author": 'Optical: NASA/HST/ASU/J. Hester et al. X-Ray: NASA/CXC/ASU/J. Hester et al.',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Chandra-crab.jpg',
    },
    'cygnus-x-1': {
        "author": 'IMAGE: NASA, CXC, Melissa Weiss (CXC)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Black_Hole_Cygnus_X-1_(Illustration)_(4187-Image).png',
    },
    'delta-pavonis': {
        "author": 'Dune (novel), via Wikipedia',
        "license": 'Public domain, used for reference',
        "page": 'https://commons.wikimedia.org/wiki/File:Dune_by_Frank_Herbert_first_edition_cover.jpg',
    },
    'deneb': {
        "author": 'Roman Köhler',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Deneb_CLP.jpg',
    },
    'double-pulsar': {
        "author": 'Ajhum',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:Rotated_pulsar.png',
    },
    'epsilon-eridani': {
        "author": 'Halo: Reach, via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:Halo-_Reach_box_art.png',
    },
    'eta-carinae': {
        "author": 'Jon Morse (University of Colorado) &amp; NASA Hubble Space Telescope',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Eta_Carinae.jpg',
    },
    'fomalhaut': {
        "author": 'ESA, NASA, and L. Calcada (ESO for STScI)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Fomalhaut_planet.jpg',
    },
    'g1-9-0-3': {
        "author": 'NASA/CXC/NCSU/K.Borkowski et al.',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:G19_xray.tif',
    },
    'gaia-bh1': {
        "author": 'PanSTARRS &amp; Melina Thévenot',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Gaia_BH1_PanSTARRS.jpg',
    },
    'gaia-bh2': {
        "author": 'Legacy Surveys / D.Lang (Perimeter Institute) &amp; Meli thev',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Gaia_BH2_decaps_dr2.jpg',
    },
    'gaia-bh3': {
        "author": 'ESO/L. Calçada',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Artist%E2%80%99s_impression_of_the_system_with_the_most_massive_stellar_black_hole_in_our_galaxy_(eso2408a).jpg',
    },
    'gargantua-s-wormhole': {
        "author": 'Interstellar (film), via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:Interstellar_film_poster.jpg',
    },
    'geminga': {
        "author": 'NASA/CXC/PSU/B. Posselt et al; Infrared: NASA/JPL-Caltech',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Geminga_by_Chandra_and_Spitzer.jpg',
    },
    'gro-j1655-40': {
        "author": 'NASA/CXC/A.Hobart',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:GRO_J1655-40.jpg',
    },
    'hercules': {
        "author": 'Mass Effect (video game), via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:MassEffect.jpg',
    },
    'ic-1396': {
        "author": 'Ram samudrala',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Elephant%27s_Trunk_nebula.jpg',
    },
    'ic-1805': {
        "author": 'Ram samudrala',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Heart_Nebula_(2020-08-11).jpg',
    },
    'ic-1848': {
        "author": 'NASA/JPL-Caltech/Harvard-Smithsonian',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Celestial_Valentine.jpg',
    },
    'ic-2118': {
        "author": 'Sousajp7',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Starless_witch_head_stack_ks_Final_4.jpg',
    },
    'ic-2602': {
        "author": 'Tel Lekatsas',
        "license": 'CC BY 2.0',
        "page": 'https://commons.wikimedia.org/wiki/File:The_Southern_Pleiades_(IC_2602).jpg',
    },
    'ic-2944': {
        "author": 'ESO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:The_Very_Large_Telescope_Snaps_a_Stellar_Nursery_and_Celebrates_Fifteen_Years_of_Operations.jpg',
    },
    'ic-405': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:Flaming_Star_Nebula,_IC_405.png',
    },
    'ic-443': {
        "author": 'Siderevs nuncivs',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:IC443_Final_with_copyright.jpg',
    },
    'ic-5070': {
        "author": 'Miodrag Sekulic',
        "license": 'CC BY-SA 3.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Pelican_nebula_ic5070_ic5067.jpg',
    },
    'luhman-16': {
        "author": 'ESO VLT MUSE; Melina Thévenot',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Luhman_16_in_visible_light_ESO_VLT_MUSE.jpg',
    },
    'm1': {
        "author": 'NASA, ESA, J. Hester and A. Loll (Arizona State University)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Crab_Nebula.jpg',
    },
    'm10': {
        "author": 'Manfred Höcherl',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:M10_H%C3%B6cherl.jpg',
    },
    'm11': {
        "author": 'ESO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Eso1430a.jpg',
    },
    'm12': {
        "author": 'Adam Block',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:M12_Adam_Block.jpg',
    },
    'm13': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M13-Globular-Cluster.png',
    },
    'm16': {
        "author": 'ESO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Eagle_Nebula_from_ESO.jpg',
    },
    'm17': {
        "author": 'ESO/INAF-VST/OmegaCAM. Acknowledgement: OmegaCen/Astro-WISE/Kapteyn Institute',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:VST_image_of_the_spectacular_star-forming_region_Messier_17_(Omega_Nebula).jpg',
    },
    'm20': {
        "author": 'RubinObs/NOIRLab/SLAC/NSF/DOE/AURA',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Trifid_Nebula_(noirlab2521ah).jpg',
    },
    'm27': {
        "author": 'Credit: REU program/NOIRLab/NSF/AURA',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:M27_-_Noao-m27.jpg',
    },
    'm3': {
        "author": 'NASA, ESA, and A. Sarajedini (Florida Atlantic University); Processing: Gladys Kober (NASA/Catholic University of America)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:NASA%E2%80%99s_Hubble_Spots_Star-Spangled_Cosmic_Scene_(M3).jpg',
    },
    'm30': {
        "author": 'ESA/Hubble & NASA, M. Libralato, G. Piotto, A. Sarajedini',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Lessons_from_a_stellar_instructor_(potm2610a).jpg',
    },
    'm36': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M36-pinwheel-cluster.png',
    },
    'm37': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M37_Star_Cluster.png',
    },
    'm39': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M39-Star-Cluster.png',
    },
    'm41': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M41-Open-Cluster-of-Stars.png',
    },
    'm42': {
        "author": 'NASA, ESA, M. Robberto (Space Telescope Science Institute/ESA) and the Hubble Space Telescope Orion Treasury Project Team',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
    },
    'm44': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M44-Star-Cluster.png',
    },
    'm45': {
        "author": 'NASA, ESA, AURA/Caltech, Palomar Observatory The science team consists of: D. Soderblom and E. Nelan (STScI), F. Benedict and B. Arthur (U. Texas), and B. Jones',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Pleiades_large.jpg',
    },
    'm46': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M46-star-cluster.png',
    },
    'm47': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M47-Star-Cluster.png',
    },
    'm52': {
        "author": 'Unknown',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:M52atlas.jpg',
    },
    'm53': {
        "author": 'Sloan Digital Sky Survey',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Messier53_-_SDSS_DR14_(panorama).jpg',
    },
    'm54': {
        "author": 'ESA/Hubble & NASA',
        "license": 'CC BY 3.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Messier_54_HST.jpg',
    },
    'm55': {
        "author": 'ESO/J. Emerson/VISTA',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Messier_55_VISTA.jpg',
    },
    'm57': {
        "author": 'ESA/Webb, NASA, CSA, M. Barlow, N. Cox, R. Wesson',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Webb_captures_detailed_beauty_of_Ring_Nebula_(NIRCam_image)_(weic2320b).jpg',
    },
    'm6': {
        "author": 'Giuseppe Donatiello from Oria (Brindisi), Italy',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:Messier_6_-_The_Butterfly_Cluster.jpg',
    },
    'm67': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M67-Star-Cluster.png',
    },
    'm68': {
        "author": 'en:NASA, en:STScI, en:WikiSky',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Messier_68_Hubble_WikiSky.jpg',
    },
    'm7': {
        "author": 'Credit: ESO',
        "license": 'CC BY 3.0',
        "page": 'https://commons.wikimedia.org/wiki/File:The_star_cluster_Messier_7.jpg',
    },
    'm76': {
        "author": 'Göran Nilsson, Wim van Berlo & The Liverpool Telescope',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Little_Dumbbell_Nebula_M76_by_Goran_Nilsson,_Wim_van_Berlo_%26_Liverpool_Telescope.jpg',
    },
    'm8': {
        "author": 'ESO/VPHAS+ team',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:VST_images_the_Lagoon_Nebula.jpg',
    },
    'm80': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:Messier_80_Cluster.png',
    },
    'm92': {
        "author": 'en:NASA, en:STScI, en:WikiSky',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:M92_Hubble_WikiSky.jpg',
    },
    'm97': {
        "author": 'NOIRLab / NSF / AURA',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Noao-m97.tif',
    },
    'mel-111': {
        "author": 'Alberto Pisabarro',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:ASY-MB0124-Coma-Star-Cluster.jpg',
    },
    'mel-25': {
        "author": 'NASA, ESA, and STScI',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Hyades_cluster.jpg',
    },
    'melotte-20': {
        "author": 'Giuseppe Donatiello',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:Melotte_20_-_Alpha_Persei_Cluster_(55467173213).jpg',
    },
    'methuselah-star': {
        "author": 'Digitized Sky Survey (DSS), STScI/AURA, Palomar/Caltech, and UKSTU/AAO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Oldest_star_in_solar_neighbourhood.jpg',
    },
    'mz-3': {
        "author": 'NASA, ESA & the Hubble Heritage Team (STScI/AURA). Acknowledgment: R. Sahai (Jet Propulsion Lab), B. Balick (University of Washington',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Ant_Nebula.jpg',
    },
    'new-horizons': {
        "author": 'National Aeronautics and Space Administration (NASA), Applied Physics Laboratory',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:New_Horizons_spacecraft_model_1.png',
    },
    'ngc-104': {
        "author": 'Credit: NASA, ESA, and the Hubble Heritage (STScI/AURA)-ESA/Hubble Collaboration Acknowledgment: J. Mack (STScI) and G. Piotto (University of Padova, Italy)',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Heic1510a.tif',
    },
    'ngc-1499': {
        "author": 'Aroughroad',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:NCG1499CalNeb.jpg',
    },
    'ngc-1904': {
        "author": 'NASA and ESA Acknowledgement: S. Djorgovski (Caltech) and F. Ferraro (University of Bologna)',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:A_snowstorm_of_stars.jpg',
    },
    'ngc-2070': {
        "author": 'NASA, ESA, CSA, STScI, Webb ERO Production Team',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Tarantula_Nebula_by_JWST.jpg',
    },
    'ngc-2168': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M35_and_NGC_2158.png',
    },
    'ngc-2174': {
        "author": 'Tal Achituv',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:NGC-2174.tif',
    },
    'ngc-2237': {
        "author": 'Lviatour',
        "license": 'CC BY-SA 2.5',
        "page": 'https://commons.wikimedia.org/wiki/File:NGC2244-HOO-LViatour-Hamois-16-12-2022.jpg',
    },
    'ngc-2264': {
        "author": 'NASA, H. Ford (JHU), G. Illingworth (UCSC/LO), M.Clampin (STScI), G. Hartig (STScI), the ACS Science Team, and ESA The ACS Science Team: H. Ford, G. Illingworth',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Cone_Nebula_(NGC_2264)_Star-Forming_Pillar_of_Gas_and_Dust.jpg',
    },
    'ngc-2359': {
        "author": 'Kudoipenguin',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Thor%27s_Helmet.jpg',
    },
    'ngc-2419': {
        "author": 'NASA Hubble',
        "license": 'CC BY 2.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Caldwell_25.jpg',
    },
    'ngc-281': {
        "author": 'Chuck Ayoub',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:PacMan_Nebula,_NGC_281.jpg',
    },
    'ngc-3132': {
        "author": 'Image: National Aeronautics and Space Administration (a U.S. federal government agency; https://www.nasa.gov/) European space agency (https://www.esa.int/), Canadian Space Agency (https://www.asc-csa.gc.ca/eng/) Space Telescope Science Institute (https://www.stsci.edu/, science operations center for the Hubble Space Telescope)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Southern_Ring_Nebula_(NIRCam_Image).png',
    },
    'ngc-3242': {
        "author": 'Judy Schmidt',
        "license": 'CC BY 2.0',
        "page": 'https://commons.wikimedia.org/wiki/File:NGC_3242_%22Ghost_of_Jupiter%22.png',
    },
    'ngc-3372': {
        "author": 'Harel Boren',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Carina_Nebula_by_Harel_Boren_(151851961,_modified).jpg',
    },
    'ngc-3532': {
        "author": 'ESO/G. Beccari',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Eso1439a.jpg',
    },
    'ngc-3603': {
        "author": 'ESO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Stellar_nursery_NGC_3603.jpg',
    },
    'ngc-4755': {
        "author": 'ESO/Y. Beletsky',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:A_Snapshot_of_the_Jewel_Box_cluster_with_the_ESO_VLT.jpg',
    },
    'ngc-5139': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:Omega_Centauri_Stars.png',
    },
    'ngc-5904': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:M5-Messier-5.png',
    },
    'ngc-6121': {
        "author": 'ESO Imaging Survey',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Globular_star_cluster_Messier_4.jpg',
    },
    'ngc-6302': {
        "author": 'NASA, ESA and the Hubble SM4 ERO Team',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:NGC_6302_Hubble_2009.full.jpg',
    },
    'ngc-6334': {
        "author": 'NASA and the Space Telescope Science Institute (STScI)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:NGC-6334-JWST-NIRCam.jpg',
    },
    'ngc-6397': {
        "author": 'NASA/ESA and the Hubble Heritage Team (AURA/STScI)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:P0321a.jpg',
    },
    'ngc-6543': {
        "author": 'ESA/Hubble &amp; NASA, Z. Tsvetanov',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Looking_at_the_Cat%E2%80%99s_Eye_Nebula_with_Hubble_(potm2602b).jpg',
    },
    'ngc-6656': {
        "author": 'ESA/Hubble &amp; NASA',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:The_crammed_centre_of_Messier_22.jpg',
    },
    'ngc-6752': {
        "author": 'en:NASA, en:STScI, en:WikiSky',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:NGC_6752_Hubble_WikiSky.jpg',
    },
    'ngc-6888': {
        "author": 'Chuck Ayoub',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:NGC_6888.png',
    },
    'ngc-6960': {
        "author": 'Ken Crawford',
        "license": 'CC BY-SA 3.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Veil_Nebula_-_NGC6960.jpg',
    },
    'ngc-7000': {
        "author": 'gjdonatiello',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:NGC_7000_%2B_IC_5070.jpg',
    },
    'ngc-7023': {
        "author": 'Andreigusan This is a featured picture on the Persian language Wikipedia (نگاره\u200cهای برگزیده) and is considered one of the finest images. See its nomination here',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Iris_Nebula_-_NGC_7023_-_Caldwell_4.jpg',
    },
    'ngc-7078': {
        "author": 'Ngc1535',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:M15_Globular_Cluster_from_the_Mount_Lemmon_SkyCenter_Schulman_Telescope_courtesy_Adam_Block.jpg',
    },
    'ngc-7089': {
        "author": 'Credit: ESA/Hubble &amp; NASA, G. Piotto et al.',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Messier2_-_HST_-_Potw1913a.jpg',
    },
    'ngc-7293': {
        "author": "NASA, ESA, C.R. O'Dell (Vanderbilt University), M. Meixner and P. McCullough (STScI)",
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:NGC7293_(2004).jpg',
    },
    'ngc-7380': {
        "author": 'Chuck Ayoub',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Wizard_Nebula,_NGC_7380.jpg',
    },
    'ngc-7635': {
        "author": 'NASA, ESA, Hubble Heritage Team',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:The_Bubble_Nebula_-_NGC_7635_-_Heic1608a.jpg',
    },
    'ngc-869': {
        "author": 'Genuson',
        "license": 'CC BY-SA 3.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Double_Cluster.jpg',
    },
    'pioneer-10': {
        "author": 'NASA on The Commons',
        "license": 'No restrictions',
        "page": 'https://commons.wikimedia.org/wiki/File:Pioneer_10_(18427352949).jpg',
    },
    'pioneer-11': {
        "author": 'NASA/Don Davis',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:An_artist%27s_impression_of_a_Pioneer_spacecraft_on_its_way_to_interstellar_space.jpg',
    },
    'pistol-star': {
        "author": 'Don F. Figer (UCLA) and NASA',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Pistol_star_and_nebula.jpg',
    },
    'przybylski-s-star': {
        "author": 'Vizzualizer',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Przybylski%27s_Star.jpg',
    },
    'psr-j0437-4715': {
        "author": 'Ngc1535',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:PSR_J0437-4517_Cropped.jpg',
    },
    'puppis-a': {
        "author": 'Chandra: NASA/CXC/GSFC/U.Hwang et al.; ROSAT: NASA/GSFC/S.Snowden et al.',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Puppis_A_Chandra_%2B_ROSAT.jpg',
    },
    'quintuplet': {
        "author": 'ESA/Hubble & NASA',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Uncovering_the_secrets_of_the_Quintuplet_Cluster.jpg',
    },
    'r136a1': {
        "author": 'ESO/P. Crowther/C.J. Evans',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:The_young_cluster_R136.jpg',
    },
    'rho-oph': {
        "author": 'NASA, ESA, CSA, STScI, K. Pontoppidan (STScI), A. Pagan (STScI)',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Rho_Ophiuchi_cloud_complex_(weic2316a).jpg',
    },
    'rigel': {
        "author": 'Giuseppe Donatiello from Oria (Brindisi), Italy',
        "license": 'CC0',
        "page": 'https://commons.wikimedia.org/wiki/File:Rigel_and_IC_2118_-_The_Witch_Head_Nebula_-_Flickr_-_gjdonatiello.jpg',
    },
    'rx-j1856-5-3754': {
        "author": 'NASA/SAO/CXC/J.Drake et al.',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:RX_J1856.5-3754.jpg',
    },
    'sagittarius-a': {
        "author": 'EHT Collaboration',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:EHT_Sagittarius_A_black_hole.tif',
    },
    'sahrabarik': {
        "author": 'Mass Effect 2, via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:MassEffect2_cover.PNG',
    },
    'sgr-1806-20': {
        "author": 'Unknown',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:SGR_1806-20_108685main_SRB1806_20rev2.jpg',
    },
    'simeis-147': {
        "author": 'Georges Attard',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:S147_SH2-240_GeorgesAttard_Apod1012020.jpg',
    },
    'sn-1006': {
        "author": 'X-ray: NASA/CXC/Rutgers/G.Cassam-Chenaï, J.Hughes et al.; Radio: NRAO/AUI/NSF/GBT/VLA/Dyer, Maddalena & Cornwell; Optical: Middlebury College/F.Winkler, NOAO/AURA/NSF/CTIO Schmidt & DSS',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Supernova_Remnant_SN_1006.jpg',
    },
    'sn-1572': {
        "author": 'NASA/CXC/Rutgers/J.Warren &amp; J.Hughes et al.',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Tycho-supernova-xray.jpg',
    },
    'sn-1604': {
        "author": 'NASA/ESA/JHU/R.Sankrit &amp; W.Blair',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Keplers_supernova.jpg',
    },
    'sn-185': {
        "author": 'CTIO/NOIRLab/DOE/NSF/AURA T.A. Rector (University of Alaska Anchorage/NSF’s NOIRLab), J. Miller (Gemini Observatory/NSF’s NOIRLab), M. Zamani & D. de Martin (NSF’s NOIRLab)',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:RCW_86_-_Noirlab2307a.jpg',
    },
    'ss-433': {
        "author": 'NRAO/AUI/NSF, K. Golap, M. Goss; NASA’s Wide Field Survey Explorer (WISE)',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:W50_medium.jpg',
    },
    'stephenson-2-18': {
        "author": '2MASS',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Stephenson_2-18_zoomed_in,_2MASS_survey,_2003.png',
    },
    'tabby-s-star': {
        "author": 'Infrared: IPAC/NASA Ultraviolet: STScI (NASA)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:KIC_8462852_in_IR_and_UV.png',
    },
    'terminus': {
        "author": 'Foundation (Asimov novel), via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:Foundation_-_Isaac_Asimov_(Gnome_1951).jpg',
    },
    'terzan-5': {
        "author": 'NASA/ESA/Hubble/F. Ferraro',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:The_unusual_cluster_Terzan.jpg',
    },
    'the-monolith-at-jupiter': {
        "author": 'Monolith (Space Odyssey), via Wikipedia',
        "license": 'CC BY-SA 4.0, used for reference',
        "page": 'https://commons.wikimedia.org/wiki/File:ENS_2001_Monolith_below.jpg',
    },
    'trantor': {
        "author": 'Foundation and Empire, via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:Foundation_and_empire.jpg',
    },
    'trumpler-14': {
        "author": 'NASA & ESA, Jesús Maíz Apellániz (Centro de Astrobiología, CSIC-INTA, Spain)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Trumpler_14_by_Hubble.jpg',
    },
    'utopia': {
        "author": 'Mass Effect (video game), via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:MassEffect.jpg',
    },
    'uy-scuti': {
        "author": 'PanSTARRS DR1',
        "license": 'CC BY 3.0',
        "page": 'https://commons.wikimedia.org/wiki/File:UY_Scuti_PanSTARRS_DR1.png',
    },
    'v404-cygni': {
        "author": 'Andrew Beardmore (Univ. of Leicester) and NASA/Swift',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:V404Cyg_XRT_halo_fullsize.jpg',
    },
    'van-maanen-s-star': {
        "author": 'SDSS & Melina Thévenot',
        "license": 'CC BY-SA 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Van_Maanen%27s_Star_SDSS.jpg',
    },
    'vega': {
        "author": 'Contact (1997 American film), via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:Contact_ver2.jpg',
    },
    'vela-pulsar': {
        "author": 'NASA/CXC/PSU/G.Pavlov et al.',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Vela_Pulsar_jet.jpg',
    },
    'vela-snr': {
        "author": '(Credit) ESO/TIMER survey',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Vela_supernova_-_VST_-_Eso2214a.jpg',
    },
    'voyager-1': {
        "author": 'National Aeronautics and Space Administration (NASA)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Voyager_spacecraft_model.png',
    },
    'voyager-2': {
        "author": 'National Aeronautics and Space Administration (NASA)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Voyager_spacecraft_model.png',
    },
    'vy-canis-majoris': {
        "author": 'Haktarfone',
        "license": 'CC BY-SA 3.0',
        "page": 'https://commons.wikimedia.org/wiki/File:VY_Canis_Majoris,_Rutherford_Observatory,_07_September_2014.jpeg',
    },
    'w51': {
        "author": 'NASA/JPL-Caltech',
        "license": 'Public domain (NASA/JPL-Caltech)',
        "page": 'https://commons.wikimedia.org/wiki/File:PIA23865-W51Nebula-StarFactory-20200825.jpg',
    },
    'wd-1': {
        "author": 'ESA/Webb, NASA &amp; CSA, M. Zamani (ESA/Webb), M. G. Guarcello (INAF-OAPA) and the EWOCS team',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:The_exotic_stellar_population_of_Westerlund_1_(potm2409a).jpg',
    },
    'westerlund-2': {
        "author": 'NASA, ESA, the Hubble Heritage Team (STScI/AURA), A. Nota (ESA/STScI), and the Westerlund 2 Science Team',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:NASA_Unveils_Celestial_Fireworks_as_Official_Hubble_25th_Anniversary_Image.jpg',
    },
    'widow': {
        "author": 'Citadel (Mass Effect), via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:CitadelMassEffect.jpg',
    },
    'wr-104': {
        "author": 'Télescope Keck',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Wr104_sslkeck_big.jpg',
    },
    'zeta-reticuli': {
        "author": 'Aliens (film), via Wikipedia',
        "license": 'Fair use, used for reference',
        "page": 'https://en.wikipedia.org/wiki/File:Aliens_poster.jpg',
    },
}
