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

