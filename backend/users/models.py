from django.db import models

class Users(models.Model):
    id = models.UUIDField(primary_key=True)
    email = models.CharField(max_length=255)
    picture = models.JSONField(blank=True, null=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'
