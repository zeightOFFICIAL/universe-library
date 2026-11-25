from django.db import models


class ObjectTypes(models.Model):
    type_name = models.TextField(db_column='type_NAME')  

    class Meta:
        managed = False
        db_table = 'object_types'


class Objects(models.Model):
    div_id_name = models.TextField(db_column='div_id_NAME')  
    system = models.ForeignKey('Systems', models.DO_NOTHING, db_column='system_ID', blank=True, null=True)  
    parent = models.ForeignKey('self', models.DO_NOTHING, db_column='parent_ID', blank=True, null=True)  
    name_name = models.TextField(db_column='name_NAME')  
    type = models.ForeignKey(ObjectTypes, models.DO_NOTHING, db_column='type_ID')  
    size_int = models.IntegerField(db_column='size_INT')  
    prime_color_any = models.TextField(db_column='prime_color_ANY')  
    second_color_any = models.TextField(db_column='second_color_ANY')  
    shadow_color_any = models.TextField(db_column='shadow_color_ANY')  
    shadow_power_int_px = models.IntegerField(db_column='shadow_power_INT_PX')  
    orbit_size_int_vmin = models.IntegerField(db_column='orbit_size_INT_VMIN')  
    orbit_time_int_s = models.IntegerField(db_column='orbit_time_INT_S')  

    class Meta:
        managed = False
        db_table = 'objects'


class PanelTypes(models.Model):
    name_name = models.TextField(db_column='name_NAME')  
    args_len_int = models.IntegerField(db_column='args_len_INT')  

    class Meta:
        managed = False
        db_table = 'panel_types'


class Panels(models.Model):
    div_id_name = models.TextField(db_column='div_id_NAME')  
    type = models.ForeignKey(PanelTypes, models.DO_NOTHING, db_column='type_ID')  
    values = models.ForeignKey('ValueRow', models.DO_NOTHING, db_column='values_ID')  
    parent_object = models.ForeignKey(Objects, models.DO_NOTHING, db_column='parent_object_ID', blank=True, null=True)  
    parent_system = models.ForeignKey('Systems', models.DO_NOTHING, db_column='parent_system_ID', blank=True, null=True)  

    class Meta:
        managed = False
        db_table = 'panels'


class Systems(models.Model):
    name_name = models.TextField(db_column='name_NAME')  
    prime_color_any = models.TextField(db_column='prime_color_ANY', blank=True, null=True)  
    second_color_any = models.TextField(db_column='second_color_ANY', blank=True, null=True)  
    shadow_color_any = models.TextField(db_column='shadow_color_ANY', blank=True, null=True)  
    univ_thumbnail_text_url = models.TextField(db_column='univ_thumbnail_TEXT_URL', blank=True, null=True)  
    icon_path_text_url = models.TextField(db_column='icon_path_TEXT_URL', blank=True, null=True)  
    short_desc_text = models.TextField(db_column='short_desc_TEXT', blank=True, null=True)  

    class Meta:
        managed = False
        db_table = 'systems'


class ValueRow(models.Model):
    title_plain = models.TextField(db_column='title_PLAIN', blank=True, null=True)  
    text_plain = models.TextField(db_column='text_PLAIN', blank=True, null=True)  
    img_src_plain = models.TextField(db_column='img_src_PLAIN', blank=True, null=True)  
    color_a_plain = models.TextField(db_column='color_a_PLAIN', blank=True, null=True)  
    color_b_plain = models.TextField(db_column='color_b_PLAIN', blank=True, null=True)  
    color_c_plain = models.TextField(db_column='color_c_PLAIN', blank=True, null=True)  
    is_slider_bool = models.TextField(db_column='is_slider_BOOL', blank=True, null=True)  
    h_color_a_plain = models.TextField(db_column='h_color_a_PLAIN', blank=True, null=True)  
    h_color_b_plain = models.TextField(db_column='h_color_b_PLAIN', blank=True, null=True)  
    h_color_c_plain = models.TextField(db_column='h_color_c_PLAIN', blank=True, null=True)  
    close_button_bool = models.TextField(db_column='close_button_BOOL', blank=True, null=True)  
    extra_args = models.TextField(db_column='extra_ARGS', blank=True, null=True)  
    layout_int = models.IntegerField(db_column='layout_INT')  

    class Meta:
        managed = False
        db_table = 'value_row'


# ---------- the galaxy map's places (tables made 2026-11-24; see AGENTS.md) ----------
# Plain column names, unlike the system-page tables. Empty columns are NULL and are
# left out of what the page receives, so the map tells "not set" from zero.


class GalaxyPlacement(models.Model):
    href = models.TextField(primary_key=True)
    label = models.TextField(blank=True, null=True)
    l = models.FloatField(blank=True, null=True)
    b = models.FloatField(blank=True, null=True)
    d = models.FloatField(blank=True, null=True)
    x = models.FloatField(blank=True, null=True)
    z = models.FloatField(blank=True, null=True)
    fictional = models.IntegerField(default=0)
    source = models.TextField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    hidden = models.IntegerField(default=0)
    sort = models.IntegerField()
    # the star or stars drawn when you fly there: "temperature K:radius in Suns", comma-separated
    stars = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'galaxy_placement'


class DeepSky(models.Model):
    name = models.TextField()
    alias = models.TextField(blank=True, null=True)
    kind = models.TextField()
    l = models.FloatField(blank=True, null=True)
    b = models.FloatField(blank=True, null=True)
    d = models.FloatField(blank=True, null=True)
    radius = models.FloatField(blank=True, null=True)
    about = models.TextField(blank=True, null=True)
    size = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'deep_sky'


class PlanetarySystem(models.Model):
    name = models.TextField()
    note = models.TextField(blank=True, null=True)
    l = models.FloatField()
    b = models.FloatField()
    d = models.FloatField()
    # as galaxy_placement.stars, or "pulsar"
    stars = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'planetary_systems'


class Territory(models.Model):
    """A nation's or faction's space, for the map's territories layer (empty until the
    owner adds rows; the layer's switch appears only when there is one).

    sectors: sector names, space-separated ("K16 K17 L16"), filled as squares.
    points:  a polygon instead, "X,Y; X,Y; ..." in the readout's galactocentric kly.
    members: names of places on the map it owns, comma-separated; their dots take its colour.
    """

    name = models.TextField()
    color = models.TextField(default="#c7a6ff")
    source = models.TextField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    sectors = models.TextField(blank=True, null=True)
    points = models.TextField(blank=True, null=True)
    members = models.TextField(blank=True, null=True)
    fictional = models.IntegerField(default=1)
    hidden = models.IntegerField(default=0)
    sort = models.IntegerField(default=0)

    class Meta:
        managed = False
        db_table = 'territories'


class FictionPlace(models.Model):
    type = models.TextField()
    name = models.TextField()
    source = models.TextField()
    note = models.TextField(blank=True, null=True)
    anchor = models.TextField(blank=True, null=True)
    l = models.FloatField(blank=True, null=True)
    b = models.FloatField(blank=True, null=True)
    d = models.FloatField(blank=True, null=True)
    x = models.FloatField(blank=True, null=True)
    z = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'fiction_places'


class Spacecraft(models.Model):
    name = models.TextField()
    note = models.TextField(blank=True, null=True)
    about = models.TextField(blank=True, null=True)
    l = models.FloatField()
    b = models.FloatField()
    au = models.FloatField()

    class Meta:
        managed = False
        db_table = 'spacecraft'


class StellarObject(models.Model):
    name = models.TextField()
    kind = models.TextField()
    note = models.TextField(blank=True, null=True)
    about = models.TextField(blank=True, null=True)
    l = models.FloatField()
    b = models.FloatField()
    d = models.FloatField()
    mass = models.FloatField(blank=True, null=True)
    radius = models.FloatField(blank=True, null=True)
    radius_km = models.FloatField(blank=True, null=True)
    temperature = models.FloatField(blank=True, null=True)
    luminosity = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'stellar_objects'
