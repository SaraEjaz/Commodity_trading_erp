# Generated migration for warehouse inventory trading models (Phase 4b)

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('trading', '0001_initial'),
        ('masters', '0002_party_warehouse_bankaccount_commissionrule'),
        ('commodities', '0001_initial'),
        ('users', '0003_roles_permissions_moduleaccess'),
    ]

    operations = [
        # Purchase Model
        migrations.CreateModel(
            name='Purchase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('purchase_id', models.CharField(db_index=True, max_length=50, unique=True)),
                ('purchase_date', models.DateField()),
                ('quantity_mt', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('rate_per_mt', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('total_value', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('landed_cost_per_mt', models.DecimalField(decimal_places=2, default=0, max_digits=12, help_text='Cost per MT including all charges')),
                ('total_landed_cost', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('confirmed', 'Confirmed'), ('received', 'Received'), ('invoiced', 'Invoiced'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], db_index=True, default='draft', max_length=20)),
                ('remarks', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('broker_agent_party', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='brokered_purchases', to='masters.party')),
                ('commodity', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='commodities.commodity')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='users.user')),
                ('supplier_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='warehouse_purchases', to='masters.party')),
                ('warehouse', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='purchases', to='masters.warehouse')),
            ],
            options={
                'ordering': ['-purchase_date'],
            },
        ),
        
        # PurchaseCost Model
        migrations.CreateModel(
            name='PurchaseCost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cost_type', models.CharField(choices=[('freight', 'Freight'), ('insurance', 'Insurance'), ('handling', 'Handling'), ('inspection', 'Inspection'), ('customs', 'Customs'), ('other', 'Other')], max_length=50)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('purchase', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cost_components', to='trading.purchase')),
            ],
            options={
                'ordering': ['cost_type'],
            },
        ),
        
        # Lot Model
        migrations.CreateModel(
            name='Lot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('lot_id', models.CharField(db_index=True, max_length=50, unique=True)),
                ('original_quantity_mt', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('sold_quantity_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('balance_quantity_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('inward_rate_per_mt', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('landed_cost_per_mt', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('total_cost', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('cost_per_mt_current', models.DecimalField(decimal_places=2, default=0, max_digits=12, help_text='Updated cost per MT as part quantity is sold')),
                ('status', models.CharField(choices=[('active', 'Active'), ('partially_sold', 'Partially Sold'), ('fully_sold', 'Fully Sold'), ('obsolete', 'Obsolete')], db_index=True, default='active', max_length=20)),
                ('remarks', models.TextField(blank=True)),
                ('inward_date', models.DateField(auto_now_add=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('commodity', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='lots', to='commodities.commodity')),
                ('purchase', models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name='created_lot', to='trading.purchase')),
                ('supplier_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='supplied_lots', to='masters.party')),
                ('warehouse', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='lots', to='masters.warehouse')),
            ],
            options={
                'ordering': ['-inward_date'],
            },
        ),
        
        # LotMovement Model
        migrations.CreateModel(
            name='LotMovement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('movement_date', models.DateField()),
                ('movement_type', models.CharField(choices=[('inward', 'Inward (Purchase)'), ('outward', 'Outward (Sale)'), ('transfer', 'Transfer'), ('adjustment', 'Adjustment')], max_length=20)),
                ('quantity_mt', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('reference_id', models.CharField(blank=True, max_length=100)),
                ('remarks', models.TextField(blank=True)),
                ('lot', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='movements', to='trading.lot')),
            ],
            options={
                'ordering': ['-movement_date'],
            },
        ),
        
        # Sale Model
        migrations.CreateModel(
            name='Sale',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sale_id', models.CharField(db_index=True, max_length=50, unique=True)),
                ('sale_date', models.DateField()),
                ('total_quantity_mt', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('sale_rate_per_mt', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('total_revenue', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('total_cost', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('gross_profit', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('confirmed', 'Confirmed'), ('delivered', 'Delivered'), ('invoiced', 'Invoiced'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], db_index=True, default='draft', max_length=20)),
                ('remarks', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('buyer_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='warehouse_purchases_as_buyer', to='masters.party')),
                ('commodity', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='commodities.commodity')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='users.user')),
                ('warehouse', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='sales', to='masters.warehouse')),
            ],
            options={
                'ordering': ['-sale_date'],
            },
        ),
        
        # SaleLot Model
        migrations.CreateModel(
            name='SaleLot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity_taken_mt', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('lot_cost_per_mt', models.DecimalField(decimal_places=2, max_digits=12)),
                ('total_cost', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('sale_rate_per_mt', models.DecimalField(decimal_places=2, max_digits=12)),
                ('total_revenue', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('profit', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('lot', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='trading.lot')),
                ('sale', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sale_lots', to='trading.sale')),
            ],
            options={
                'ordering': ['lot'],
            },
        ),
        
        # BrokeragePayable Model
        migrations.CreateModel(
            name='BrokeragePayable',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('brokerage_type', models.CharField(choices=[('per_mt', 'Per MT'), ('percentage', 'Percentage'), ('fixed', 'Fixed')], max_length=50)),
                ('brokerage_rate', models.DecimalField(decimal_places=4, max_digits=10, validators=[django.core.validators.MinValueValidator(0)])),
                ('total_quantity_mt', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('gross_amount', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('paid_amount', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('outstanding_amount', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('status', models.CharField(choices=[('outstanding', 'Outstanding'), ('partially_paid', 'Partially Paid'), ('paid', 'Paid'), ('cancelled', 'Cancelled')], default='outstanding', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('broker_party', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='brokerage_payables', to='masters.party')),
                ('purchase', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='brokerage_payables', to='trading.purchase')),
                ('sale', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='brokerage_payables', to='trading.sale')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # Add indexes for performance
        migrations.AddIndex(
            model_name='purchase',
            index=models.Index(fields=['purchase_id'], name='trading_purchase_id_idx'),
        ),
        migrations.AddIndex(
            model_name='purchase',
            index=models.Index(fields=['status'], name='trading_purchase_status_idx'),
        ),
        migrations.AddIndex(
            model_name='purchase',
            index=models.Index(fields=['-purchase_date'], name='trading_purchase_date_idx'),
        ),
        migrations.AddIndex(
            model_name='lot',
            index=models.Index(fields=['lot_id'], name='trading_lot_id_idx'),
        ),
        migrations.AddIndex(
            model_name='lot',
            index=models.Index(fields=['commodity'], name='trading_lot_commodity_idx'),
        ),
        migrations.AddIndex(
            model_name='lot',
            index=models.Index(fields=['warehouse'], name='trading_lot_warehouse_idx'),
        ),
        migrations.AddIndex(
            model_name='lot',
            index=models.Index(fields=['status'], name='trading_lot_status_idx'),
        ),
        migrations.AddIndex(
            model_name='sale',
            index=models.Index(fields=['sale_id'], name='trading_sale_id_idx'),
        ),
        migrations.AddIndex(
            model_name='sale',
            index=models.Index(fields=['status'], name='trading_sale_status_idx'),
        ),
        migrations.AddIndex(
            model_name='sale',
            index=models.Index(fields=['-sale_date'], name='trading_sale_date_idx'),
        ),
    ]
