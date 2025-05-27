# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models

class AccountTransactions(models.Model):
    id = models.UUIDField(primary_key=True)
    account = models.ForeignKey('Accounts', models.DO_NOTHING, blank=True, null=True)
    type = models.CharField(max_length=20, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    property = models.ForeignKey('Properties', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'account_transactions'


class Accounts(models.Model):
    id = models.UUIDField(primary_key=True)
    user = models.OneToOneField('Users', models.DO_NOTHING, blank=True, null=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'accounts'


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


class Leases(models.Model):
    id = models.UUIDField(primary_key=True)
    property = models.ForeignKey('Properties', models.DO_NOTHING, blank=True, null=True)
    tenant = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    owner = models.ForeignKey('Users', models.DO_NOTHING, related_name='leases_owner_set', blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    agreement_file = models.CharField(max_length=255, blank=True, null=True)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_signed = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'leases'


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


class Reviews(models.Model):
    id = models.UUIDField(primary_key=True)
    reviewer = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    property = models.ForeignKey(Properties, models.DO_NOTHING, blank=True, null=True)
    rating = models.IntegerField(blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'reviews'









