# Generated migration for masters app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
from decimal import Decimal


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('commodities', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BankAccount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('account_code', models.CharField(db_index=True, max_length=50, unique=True)),
                ('account_name', models.CharField(max_length=200)),
                ('account_type', models.CharField(choices=[('bank', 'Bank Account'), ('cash', 'Cash Account'), ('check', 'Check Account')], max_length=50)),
                ('bank_name', models.CharField(blank=True, max_length=200)),
                ('account_number', models.CharField(blank=True, max_length=50)),
                ('iban', models.CharField(blank=True, max_length=100, verbose_name='IBAN')),
                ('swift_code', models.CharField(blank=True, max_length=20)),
                ('branch', models.CharField(blank=True, max_length=200)),
                ('opening_balance', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('current_balance', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('is_active', models.BooleanField(default=True)),
                ('is_default', models.BooleanField(default=False, help_text='Default account for payments')),
                ('remarks', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['account_code'],
            },
        ),
        migrations.CreateModel(
            name='Party',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('party_code', models.CharField(db_index=True, max_length=50, unique=True)),
                ('party_name', models.CharField(max_length=200)),
                ('party_type', models.CharField(choices=[('supplier', 'Supplier'), ('buyer', 'Buyer'), ('broker', 'Broker'), ('agent', 'Agent'), ('receiver', 'Receiver'), ('other', 'Other')], max_length=50)),
                ('business_line_tag', models.CharField(choices=[('trading', 'Trading (Warehouse Inventory)'), ('commission', 'Commission (Back-to-Back)'), ('both', 'Both Trading & Commission')], default='both', max_length=50)),
                ('contact_person', models.CharField(blank=True, max_length=150)),
                ('mobile', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('phone', models.CharField(blank=True, max_length=20, validators=[django.core.validators.RegexValidator(regex='^\\+?1?\\d{9,15}$')])),
                ('address', models.TextField(blank=True)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('country', models.CharField(default='Pakistan', max_length=100)),
                ('ntn', models.CharField(blank=True, max_length=50, verbose_name='NTN (Tax ID)')),
                ('strn', models.CharField(blank=True, max_length=50, verbose_name='STRN (Sales Tax Registration)')),
                ('cpr_applicable', models.BooleanField(default=False, verbose_name='CPR/Withholding Applicable')),
                ('cpr_percentage', models.DecimalField(decimal_places=2, default=0, max_digits=5, validators=[django.core.validators.MinValueValidator(0)], verbose_name='CPR Percentage')),
                ('payment_terms', models.CharField(blank=True, help_text='e.g., Net 30 Days', max_length=200)),
                ('credit_limit', models.DecimalField(decimal_places=2, default=0, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('is_active', models.BooleanField(default=True)),
                ('opening_balance', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('remarks', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_parties', to=settings.AUTH_USER_MODEL)),
                ('default_bank_account', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='masters.bankaccount')),
            ],
            options={
                'ordering': ['party_code'],
            },
        ),
        migrations.CreateModel(
            name='Warehouse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('warehouse_code', models.CharField(db_index=True, max_length=50, unique=True)),
                ('warehouse_name', models.CharField(max_length=200)),
                ('location', models.TextField(blank=True)),
                ('address', models.TextField(blank=True)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('total_capacity_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('current_stock_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('is_active', models.BooleanField(default=True)),
                ('remarks', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('manager', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='managed_warehouses', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['warehouse_code'],
            },
        ),
        migrations.CreateModel(
            name='CommissionRule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rule_name', models.CharField(max_length=200)),
                ('valid_from', models.DateField()),
                ('valid_to', models.DateField(blank=True, null=True)),
                ('commission_type', models.CharField(choices=[('per_mt', 'Per MT'), ('percentage', 'Percentage'), ('fixed', 'Fixed Amount')], max_length=50)),
                ('rate_or_amount', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('payer_type', models.CharField(choices=[('buyer', 'Buyer'), ('seller', 'Seller'), ('both', 'Both (split)')], default='buyer', max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                ('remarks', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('commodity', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='commodities.commodity')),
                ('party', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='commission_rules', to='masters.party')),
            ],
            options={
                'ordering': ['-valid_from', 'rule_name'],
            },
        ),
        migrations.AddIndex(
            model_name='warehouse',
            index=models.Index(fields=['warehouse_code'], name='masters_ware_warehou_idx'),
        ),
        migrations.AddIndex(
            model_name='warehouse',
            index=models.Index(fields=['is_active'], name='masters_ware_is_acti_idx'),
        ),
        migrations.AddIndex(
            model_name='party',
            index=models.Index(fields=['party_code'], name='masters_part_party_c_idx'),
        ),
        migrations.AddIndex(
            model_name='party',
            index=models.Index(fields=['party_type'], name='masters_part_party_t_idx'),
        ),
        migrations.AddIndex(
            model_name='party',
            index=models.Index(fields=['is_active'], name='masters_part_is_acti_idx'),
        ),
        migrations.AddIndex(
            model_name='commissionrule',
            index=models.Index(fields=['party'], name='masters_comm_party_i_idx'),
        ),
        migrations.AddIndex(
            model_name='commissionrule',
            index=models.Index(fields=['commodity'], name='masters_comm_commodit_idx'),
        ),
        migrations.AddIndex(
            model_name='commissionrule',
            index=models.Index(fields=['is_active'], name='masters_comm_is_acti_idx'),
        ),
    ]
