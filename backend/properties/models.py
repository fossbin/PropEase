from django.db import models

class Properties(models.Model):
    id = models.UUIDField(primary_key=True)
    owner = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    pricing_type = models.CharField(max_length=20, blank=True, null=True)
    capacity = models.IntegerField(blank=True, null=True)
    photos = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'properties'

class PropertyLocations(models.Model):
    id = models.UUIDField(primary_key=True)
    property = models.ForeignKey(Properties, models.DO_NOTHING, blank=True, null=True)
    address_line = models.TextField()
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    zipcode = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'property_locations'

