# backend/apps/users/admin.py
from django.contrib import admin
from .models import ModuleAccess

@admin.register(ModuleAccess)
class ModuleAccessAdmin(admin.ModelAdmin):
    list_display = ('user', 'module', 'is_active', 'is_default', 'granted_by', 'created_at')
    search_fields = ('user__email', 'module')  # Optional: allows searching by user email or module
    list_filter = ('module', 'is_active')  # Optional: adds filter options for module and active status