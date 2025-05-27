from django.db import models
from properties.models import Properties

class Sales(models.Model):
    id = models.UUIDField(primary_key=True)
    property = models.ForeignKey(Properties, models.DO_NOTHING, blank=True, null=True)
    buyer = models.ForeignKey('users.Users', models.DO_NOTHING, blank=True, null=True)
    seller = models.ForeignKey('users.Users', models.DO_NOTHING, related_name='sales_seller_set', blank=True, null=True)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    sale_date = models.DateField(blank=True, null=True)
    deed_file = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sales'
