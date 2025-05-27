from django.db import models
from properties.models import Properties

class Reviews(models.Model):
    id = models.UUIDField(primary_key=True)
    reviewer = models.ForeignKey('users.Users', models.DO_NOTHING, blank=True, null=True)
    property = models.ForeignKey(Properties, models.DO_NOTHING, blank=True, null=True)
    rating = models.IntegerField(blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'reviews'




