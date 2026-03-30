from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    """Role definition with optional module restrictions"""
    ROLE_CHOICES = [
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
    
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.get_name_display()}"


class Permission(models.Model):
    """Granular permissions for features and actions"""
    CATEGORIES = [
        ('view', 'View'),
        ('create', 'Create'),
        ('edit', 'Edit'),
        ('delete', 'Delete'),
        ('approve', 'Approve'),
        ('admin', 'Admin Only'),
    ]
    
    codename = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'codename']
        verbose_name_plural = 'Permissions'
    
    def __str__(self):
        return self.codename


class ModuleAccess(models.Model):
    """Maps users to business line modules they can access"""
    MODULE_CHOICES = [
        ('trading', 'Trading (Warehouse Inventory)'),
        ('commission', 'Commission (Back-to-Back)'),
        ('admin', 'Admin Panel'),
    ]
    
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='module_accesses')
    module = models.CharField(max_length=50, choices=MODULE_CHOICES)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text="Default landing module after login")
    granted_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='granted_module_accesses')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'module']
        ordering = ['module']
    
    def __str__(self):
        return f"{self.user.email} → {self.get_module_display()}"


class User(AbstractUser):
    """Extended user model with role + module access"""
    # Keep ROLE_CHOICES for backward compatibility, but use Role model for definitions
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('trader', 'Trader'),
        ('analyst', 'Analyst'),
        ('manager', 'Manager'),
        ('accountant', 'Accountant'),
        ('viewer', 'Viewer'),
    ]
    
    username = None
    email = models.EmailField(unique=True)
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$')],
        blank=True
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    department = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"
    
    def get_allowed_modules(self):
        """Get list of modules user can access"""
        modules = self.module_accesses.filter(is_active=True).values_list('module', flat=True)
        return list(modules)
    
    def has_module_access(self, module):
        """Check if user can access a specific module"""
        return self.module_accesses.filter(module=module, is_active=True).exists()
    
    def get_default_module(self):
        """Get user's default landing module"""
        default = self.module_accesses.filter(is_default=True, is_active=True).first()
        if default:
            return default.module
        # Fallback to first active module
        first_module = self.module_accesses.filter(is_active=True).first()
        if first_module:
            return first_module.module
        return None


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile of {self.user.email}"


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('login', 'Login'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField()
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [models.Index(fields=['user', '-timestamp'])]
    
    def __str__(self):
        return f"{self.action} - {self.model_name} by {self.user}"
