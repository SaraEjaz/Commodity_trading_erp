"""
Django management command to populate test users with module access
Usage: python manage.py populate_test_data
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from apps.users.models import Role, Permission, ModuleAccess

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate test users with proper module access for demonstration'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Populating test data...'))
        
        # Create Roles
        self.stdout.write('Creating roles...')
        role_data = [
            ('super_admin', 'Super Administrator'),
            ('admin', 'Administrator'),
            ('trading_manager', 'Trading Manager'),
            ('trading_user', 'Trading User'),
            ('commission_manager', 'Commission Manager'),
            ('commission_user', 'Commission User'),
            ('accounts_user', 'Accounts User'),
            ('manager', 'General Manager'),
            ('viewer', 'Viewer'),
        ]
        
        roles = {}
        for name, display in role_data:
            role, created = Role.objects.get_or_create(name=name)
            if created:
                self.stdout.write(f'  ✓ Created role: {display}')
            roles[name] = role
        
        # Create Permissions
        self.stdout.write('Creating permissions...')
        permission_data = [
            ('view_trading_deal', 'view', 'View trading deals'),
            ('create_trading_deal', 'create', 'Create trading deals'),
            ('edit_trading_deal', 'edit', 'Edit trading deals'),
            ('approve_override_rate', 'approve', 'Approve rate overrides'),
            ('view_commission_deal', 'view', 'View commission deals'),
            ('create_commission_deal', 'create', 'Create commission deals'),
            ('post_lifting', 'create', 'Post lifting/dispatch'),
            ('view_ledger', 'view', 'View party ledger'),
            ('receive_payment', 'create', 'Record payment received'),
            ('approve_settlement', 'approve', 'Approve settlements'),
            ('admin_panel', 'admin', 'Access admin panel'),
        ]
        
        permissions = {}
        for codename, category, description in permission_data:
            perm, created = Permission.objects.get_or_create(
                codename=codename,
                defaults={'category': category, 'description': description}
            )
            if created:
                self.stdout.write(f'  ✓ Created permission: {codename}')
            permissions[codename] = perm
        
        # Create test users
        self.stdout.write('Creating test users...')
        
        test_users = [
            {
                'email': 'admin@example.com',
                'password': 'demopass123',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'modules': ['trading', 'commission', 'admin'],
                'default_module': 'admin',
            },
            {
                'email': 'trading@example.com',
                'password': 'demopass123',
                'first_name': 'Trading',
                'last_name': 'User',
                'role': 'trading_user',
                'modules': ['trading'],
                'default_module': 'trading',
            },
            {
                'email': 'commission@example.com',
                'password': 'demopass123',
                'first_name': 'Commission',
                'last_name': 'User',
                'role': 'commission_user',
                'modules': ['commission'],
                'default_module': 'commission',
            },
            {
                'email': 'manager@example.com',
                'password': 'demopass123',
                'first_name': 'Manager',
                'last_name': 'User',
                'role': 'manager',
                'modules': ['trading', 'commission'],
                'default_module': 'trading',
            },
            {
                'email': 'accounts@example.com',
                'password': 'demopass123',
                'first_name': 'Accounts',
                'last_name': 'User',
                'role': 'accounts_user',
                'modules': ['commission'],
                'default_module': 'commission',
            },
        ]
        
        for user_data in test_users:
            email = user_data['email']
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'role': user_data['role'],
                    'is_active': True,
                }
            )
            
            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(f'  ✓ Created user: {email}')
            else:
                self.stdout.write(f'  → User exists: {email}')
            
            # Assign modules
            for module in user_data['modules']:
                module_access, created = ModuleAccess.objects.get_or_create(
                    user=user,
                    module=module,
                    defaults={
                        'is_active': True,
                        'is_default': module == user_data.get('default_module'),
                    }
                )
                if created:
                    self.stdout.write(f'    ✓ Granted access: {module}')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Test data population complete!\n'))
        self.stdout.write('Test login credentials:')
        self.stdout.write('  Admin:       admin@example.com / demopass123')
        self.stdout.write('  Trading:     trading@example.com / demopass123')
        self.stdout.write('  Commission:  commission@example.com / demopass123')
        self.stdout.write('  Manager:     manager@example.com / demopass123')
        self.stdout.write('  Accounts:    accounts@example.com / demopass123')
