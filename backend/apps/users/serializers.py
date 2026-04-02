from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, ModuleAccess, AuditLog, Role, Permission


class ModuleAccessSerializer(serializers.ModelSerializer):
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    granted_by_email = serializers.EmailField(source='granted_by.email', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ModuleAccess
        fields = [
            'id', 'user', 'user_email', 'module', 'module_display', 
            'is_active', 'is_default', 'granted_by', 'granted_by_email', 
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RoleSerializer(serializers.ModelSerializer):
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'name_display', 'description', 
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PermissionSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Permission
        fields = [
            'id', 'codename', 'category', 'category_display',
            'description', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'user_name', 'action', 
            'action_display', 'model_name', 'object_id', 'changes',
            'ip_address', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name()
        return None


class UserSerializer(serializers.ModelSerializer):
    module_accesses = ModuleAccessSerializer(many=True, read_only=True)
    allowed_modules = serializers.SerializerMethodField()
    default_module = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'is_active', 'phone', 'department',
            'module_accesses', 'allowed_modules', 'default_module',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_allowed_modules(self, obj):
        return obj.get_allowed_modules()

    def get_default_module(self, obj):
        return obj.get_default_module()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    module = serializers.ChoiceField(
        choices=['trading', 'commission'],
        write_only=True,
        required=False,
        default='trading',
    )

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm', 'module']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        module = validated_data.pop('module', 'trading')
        validated_data.pop('password_confirm')

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )

        # Assign selected module automatically on registration
        ModuleAccess.objects.create(
            user=user,
            module=module,
            is_active=True,
            is_default=True,
        )

        return user