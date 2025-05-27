from django.db import models

class Applications(models.Model):
    id = models.UUIDField(primary_key=True)
    property = models.ForeignKey('Properties', models.DO_NOTHING, blank=True, null=True)
    applicant = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    documents = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'applications'

