from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('commission', '0001_initial'),
        ('masters', '0002_unitofmeasure'),
    ]

    operations = [
        migrations.AddField(
            model_name='commissiondeal',
            name='total_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=18),
        ),
        migrations.AddField(
            model_name='commissiondeal',
            name='uof',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='masters.unitofmeasure'),
        ),
        migrations.RemoveField(
            model_name='commissiondeal',
            name='seller_rate_per_mt',
        ),
        migrations.RemoveField(
            model_name='commissiondeal',
            name='buyer_rate_per_mt',
        ),
        migrations.RemoveField(
            model_name='commissiondeal',
            name='unit',
        ),
    ]
