from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import UserProfile, AuditLog, Role, Permission, ModuleAccess
from .serializers import (
    UserSerializer, UserRegistrationSerializer, PasswordChangeSerializer,
    AuditLogSerializer, UserProfileSerializer, UserUpdateSerializer,
    RoleSerializer, PermissionSerializer, ModuleAccessSerializer
)

User = get_user_model()


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for roles (admin only)"""
    queryset = Role.objects.filter(is_active=True)
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permission() for permission in self.permission_classes]
        # Only admin can modify
        return [permissions.IsAdminUser()]


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for permissions (admin only)"""
    queryset = Permission.objects.filter(is_active=True)
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """Filter by category if specified"""
        queryset = Permission.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class ModuleAccessViewSet(viewsets.ModelViewSet):
    """CRUD for module access assignments"""
    queryset = ModuleAccess.objects.all()
    serializer_class = ModuleAccessSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['user', 'module', 'is_active']
    
    def get_queryset(self):
        """Admin can see all, users can see their own"""
        if self.request.user.is_superuser or self.request.user.role == 'admin':
            return ModuleAccess.objects.all()
        # Users can see their own module access
        return ModuleAccess.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set granted_by to current user"""
        serializer.save(granted_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_modules(self, request):
        """Get current user's accessible modules"""
        modules = request.user.module_accesses.filter(is_active=True).all()
        serializer = self.get_serializer(modules, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAdminUser()]
        return [permission() for permission in self.permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Admin sees all, users can see their profile"""
        if self.request.user.is_superuser or self.request.user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(pk=self.request.user.pk)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile with module access"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            if not request.user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'old_password': 'Wrong password.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'detail': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        output = UserSerializer(user, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['user', 'action', 'model_name']
    search_fields = ['action', 'model_name']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        # Users can only see their own audit logs unless they're admin
        if self.request.user.is_superuser or self.request.user.role == 'admin':
            return AuditLog.objects.all()
        return AuditLog.objects.filter(user=self.request.user)
