"""
Where each info-card photograph in static/Images/DeepSky/ comes from.

Keyed by the image's file name without .jpg (views.image_slug of the object's
alias or name). Every image is from Wikimedia Commons under a free licence or in
the public domain; "page" is its Commons description page, which carries the full
attribution. The card prints author and licence and links to the page.

The files were fetched as 1280px or 960px renders and recompressed with ffmpeg to 640px
JPEG at -q:v 2 (see AGENTS.md, "Images"). To add one: put <slug>.jpg in the
folder and an entry here.
"""

IMAGE_SOURCES = {
    'a0620-00': {
        "author": "NASA's Goddard Space Flight Center and Scientific Visualization Studio",
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Black_Hole_X-ray_binaries.jpg',
    },
    'barnard-33': {
        "author": 'ESO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Nebulosa_testa_di_cavallo_con_SPECULOOS.jpg',
    },
    'betelgeuse': {
        "author": 'ALMA (ESO/NAOJ/NRAO)/E. O’Gorman/P. Kervella',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Betelgeuse_captured_by_ALMA.jpg',
    },
    'cas-a': {
        "author": 'X-ray: NASA/CXC/SAO; IR: NASA/ESA/CSA/STScI; Image Processing: NASA/CXC/SAO/L. Frattare and K. Arcand',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:NASA%27s_Chandra_Releases_%27Red,_White,_and_Blue%27_Universe_for_US_250th_(Cassiopeia_A_composite).jpg',
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
    'deneb': {
        "author": 'Roman Köhler',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Deneb_CLP.jpg',
    },
    'eta-carinae': {
        "author": 'Jon Morse (University of Colorado) &amp; NASA Hubble Space Telescope',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Eta_Carinae.jpg',
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
    'm1': {
        "author": 'NASA, ESA, J. Hester and A. Loll (Arizona State University)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Crab_Nebula.jpg',
    },
    'm11': {
        "author": 'ESO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Eso1430a.jpg',
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
    'm7': {
        "author": 'Credit: ESO',
        "license": 'CC BY 3.0',
        "page": 'https://commons.wikimedia.org/wiki/File:The_star_cluster_Messier_7.jpg',
    },
    'm8': {
        "author": 'ESO/VPHAS+ team',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:VST_images_the_Lagoon_Nebula.jpg',
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
    'methuselah-star': {
        "author": 'Digitized Sky Survey (DSS), STScI/AURA, Palomar/Caltech, and UKSTU/AAO',
        "license": 'CC BY 4.0',
        "page": 'https://commons.wikimedia.org/wiki/File:Oldest_star_in_solar_neighbourhood.jpg',
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
    'sgr-1806-20': {
        "author": 'Unknown',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:SGR_1806-20_108685main_SRB1806_20rev2.jpg',
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
    'tabby-s-star': {
        "author": 'Infrared: IPAC/NASA Ultraviolet: STScI (NASA)',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:KIC_8462852_in_IR_and_UV.png',
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
    'wr-104': {
        "author": 'Télescope Keck',
        "license": 'Public domain',
        "page": 'https://commons.wikimedia.org/wiki/File:Wr104_sslkeck_big.jpg',
    },
}
