# Generated migration for roles, permissions, and module access

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_initial'),
    ]

    operations = [
        # Create Role model
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(choices=[('super_admin', 'Super Administrator'), ('admin', 'Administrator'), ('trading_manager', 'Trading Manager'), ('trading_user', 'Trading User'), ('commission_manager', 'Commission Manager'), ('commission_user', 'Commission User'), ('accounts_user', 'Accounts User'), ('manager', 'General Manager'), ('viewer', 'Viewer')], max_length=50, unique=True)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        
        # Create Permission model
        migrations.CreateModel(
            name='Permission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codename', models.CharField(max_length=100, unique=True)),
                ('category', models.CharField(choices=[('view', 'View'), ('create', 'Create'), ('edit', 'Edit'), ('delete', 'Delete'), ('approve', 'Approve'), ('admin', 'Admin Only')], max_length=20)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name_plural': 'Permissions',
                'ordering': ['category', 'codename'],
            },
        ),
        
        # Create ModuleAccess model
        migrations.CreateModel(
            name='ModuleAccess',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('module', models.CharField(choices=[('trading', 'Trading (Warehouse Inventory)'), ('commission', 'Commission (Back-to-Back)'), ('admin', 'Admin Panel')], max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                ('is_default', models.BooleanField(default=False, help_text='Default landing module after login')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('granted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='granted_module_accesses', to='users.user')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='module_accesses', to='users.user')),
            ],
            options={
                'ordering': ['module'],
                'unique_together': {('user', 'module')},
            },
        ),
    ]
