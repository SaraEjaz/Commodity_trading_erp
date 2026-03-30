from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, AuditLog, Role, Permission, ModuleAccess

User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'codename', 'category', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class ModuleAccessSerializer(serializers.ModelSerializer):
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    granted_by_email = serializers.CharField(source='granted_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = ModuleAccess
        fields = [
            'id', 'user', 'module', 'module_display', 'is_active', 'is_default',
            'granted_by', 'granted_by_email', 'created_at'
        ]
        read_only_fields = ['created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['avatar', 'bio', 'preferences', 'last_login_ip', 'created_at', 'updated_at']


class UserModuleAccessDetailSerializer(serializers.ModelSerializer):
    """Nested serializer for module access in user response"""
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    
    class Meta:
        model = ModuleAccess
        fields = ['id', 'module', 'module_display', 'is_default', 'is_active']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    module_accesses = UserModuleAccessDetailSerializer(many=True, read_only=True)
    allowed_modules = serializers.SerializerMethodField()
    default_module = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone', 'role', 
            'department', 'is_active', 'profile', 'module_accesses', 
            'allowed_modules', 'default_module', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'module_accesses', 'allowed_modules', 'default_module']
    
    def get_allowed_modules(self, obj):
        """Get list of modules user can access"""
        return obj.get_allowed_modules()
    
    def get_default_module(self, obj):
        """Get user's default module"""
        return obj.get_default_module()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm', 'phone', 'role']
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'department']


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data.pop('new_password_confirm'):
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user_email', 'action', 'model_name', 'object_id', 'changes', 'ip_address', 'timestamp']
