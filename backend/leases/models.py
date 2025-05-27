from django.db import models

class Leases(models.Model):
    id = models.UUIDField(primary_key=True)
    property = models.ForeignKey('properties.Properties', models.DO_NOTHING, blank=True, null=True)
    tenant = models.ForeignKey('users.Users', models.DO_NOTHING, blank=True, null=True)
    owner = models.ForeignKey('users.Users', models.DO_NOTHING, related_name='leases_owner_set', blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    agreement_file = models.CharField(max_length=255, blank=True, null=True)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_signed = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'leases'

