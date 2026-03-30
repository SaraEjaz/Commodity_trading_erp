# Generated migration for commission app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('commodities', '0001_initial'),
        ('masters', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CommissionDeal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('deal_id', models.CharField(db_index=True, max_length=50, unique=True)),
                ('deal_date', models.DateField(auto_now_add=True)),
                ('total_quantity_mt', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('unit', models.CharField(default='MT', max_length=10)),
                ('delivery_period_from', models.DateField()),
                ('delivery_period_to', models.DateField()),
                ('commercial_rate', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('seller_rate_per_mt', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('buyer_rate_per_mt', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('commission_applicable', models.BooleanField(default=True)),
                ('commission_basis', models.CharField(choices=[('per_mt', 'Per MT'), ('percentage', 'Percentage'), ('fixed', 'Fixed Amount')], default='per_mt', max_length=50)),
                ('commission_payer', models.CharField(choices=[('buyer', 'Buyer'), ('seller', 'Seller'), ('both', 'Both')], default='buyer', max_length=50)),
                ('buyer_side_commission_rate', models.DecimalField(decimal_places=2, default=0, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('seller_side_commission_rate', models.DecimalField(decimal_places=2, default=0, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('quantity_lifted_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('quantity_remaining_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('total_buyer_commission', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('total_seller_commission', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('commission_received', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('commission_outstanding', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('terms', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('open', 'Open'), ('partially_executed', 'Partially Executed'), ('closed', 'Closed'), ('cancelled', 'Cancelled'), ('suspended', 'Suspended')], db_index=True, default='open', max_length=50)),
                ('remarks', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('commodity', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='commodities.commodity')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('principal_buyer_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='bought_commission_deals', to='masters.party')),
                ('seller_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='sold_commission_deals', to='masters.party')),
            ],
            options={
                'ordering': ['-deal_date'],
            },
        ),
        migrations.CreateModel(
            name='CommissionLifting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('lifting_id', models.CharField(db_index=True, max_length=50, unique=True)),
                ('lifting_date', models.DateField(auto_now_add=True)),
                ('quantity_mt', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('vehicle_no', models.CharField(blank=True, max_length=100)),
                ('weighbridge_reference', models.CharField(blank=True, max_length=100)),
                ('buyer_commission', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('seller_commission', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('payment_status', models.CharField(choices=[('pending', 'Pending'), ('paid', 'Paid'), ('partially_paid', 'Partially Paid'), ('disputed', 'Disputed')], default='pending', max_length=50)),
                ('posting_reference', models.CharField(blank=True, max_length=100)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('deal', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='liftings', to='commission.commissiondeal')),
                ('invoice_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='commission_invoiced_liftings', to='masters.party')),
                ('payment_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='commission_payment_liftings', to='masters.party')),
                ('principal_buyer', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='received_liftings', to='masters.party')),
                ('receiver_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='commission_liftings', to='masters.party')),
            ],
            options={
                'ordering': ['-lifting_date'],
            },
        ),
        migrations.CreateModel(
            name='CommissionDealReceiver',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('expected_quantity_mt', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('lifted_quantity_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('remaining_quantity_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('remarks', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('deal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='receivers', to='commission.commissiondeal')),
                ('invoice_party', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='commission_invoices', to='masters.party')),
                ('payment_responsibility_party', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='commission_payment_responsibility', to='masters.party')),
                ('receiver_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='masters.party')),
            ],
            options={
                'ordering': ['receiver_party'],
            },
        ),
        migrations.CreateModel(
            name='CommissionAllocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('allocated_quantity_mt', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('executed_quantity_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('remaining_quantity_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('status', models.CharField(choices=[('allocated', 'Allocated'), ('partially_executed', 'Partially Executed'), ('fully_executed', 'Fully Executed'), ('cancelled', 'Cancelled')], default='allocated', max_length=50)),
                ('remarks', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('purchase_deal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='allocation_source', to='commission.commissiondeal')),
                ('sales_deals', models.ManyToManyField(related_name='allocation_targets', to='commission.commissiondeal')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='commissionlifting',
            index=models.Index(fields=['lifting_id'], name='commission_commiss_lifting_idx'),
        ),
        migrations.AddIndex(
            model_name='commissionlifting',
            index=models.Index(fields=['deal'], name='commission_commiss_deal_idx'),
        ),
        migrations.AddIndex(
            model_name='commissionlifting',
            index=models.Index(fields=['-lifting_date'], name='commission_commiss_lifting_date_idx'),
        ),
        migrations.AddIndex(
            model_name='commissiondeal',
            index=models.Index(fields=['deal_id'], name='commission_commiss_deal_id_idx'),
        ),
        migrations.AddIndex(
            model_name='commissiondeal',
            index=models.Index(fields=['status'], name='commission_commiss_status_idx'),
        ),
        migrations.AddIndex(
            model_name='commissiondeal',
            index=models.Index(fields=['-deal_date'], name='commission_commiss_deal_date_idx'),
        ),
    ]
