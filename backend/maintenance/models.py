from django.db import models

class MaintenanceTickets(models.Model):
    id = models.UUIDField(primary_key=True)
    property = models.ForeignKey('Properties', models.DO_NOTHING, blank=True, null=True)
    raised_by = models.ForeignKey('Users', models.DO_NOTHING, db_column='raised_by', blank=True, null=True)
    assigned_to = models.ForeignKey('Users', models.DO_NOTHING, db_column='assigned_to', related_name='maintenancetickets_assigned_to_set', blank=True, null=True)
    issue_type = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    priority = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'maintenance_tickets'
