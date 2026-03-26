import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

email = 'admin@example.com'
password = 'demopass123'

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(
        email=email,
        password=password,
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    print(f"Superuser {email} created.")
else:
    print(f"User {email} already exists.")
