"""
Custom permission classes for module and role-based access control
"""
from rest_framework import permissions


class HasModuleAccess(permissions.BasePermission):
    """
    Custom permission to check if user has access to a specific module.
    Usage: permission_classes = [HasModuleAccess]
    Pass module in view context: self.module = 'trading'
    """
    message = "You do not have access to this module."
    
    def has_permission(self, request, view):
        # Allow superuser/admin
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        
        # Get module from view
        module = getattr(view, 'module', None)
        if not module:
            # If no module specified, allow for non-module-specific endpoints
            return True
        
        # Check if user has access to the module
        return request.user.has_module_access(module)


class IsTradingUser(permissions.BasePermission):
    """Permission to access trading module"""
    message = "You do not have access to the Trading module."
    
    def has_permission(self, request, view):
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        return request.user.has_module_access('trading')


class IsCommissionUser(permissions.BasePermission):
    """Permission to access commission module"""
    message = "You do not have access to the Commission module."
    
    def has_permission(self, request, view):
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        return request.user.has_module_access('commission')


class IsAdminOrTrading(permissions.BasePermission):
    """Permission for admin or trading users"""
    message = "You do not have permission to perform this action."
    
    def has_permission(self, request, view):
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        return request.user.has_module_access('trading')


class IsAdminOrCommission(permissions.BasePermission):
    """Permission for admin or commission users"""
    message = "You do not have permission to perform this action."
    
    def has_permission(self, request, view):
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        return request.user.has_module_access('commission')


class CanApproveOverrides(permissions.BasePermission):
    """Permission for manager-level approval actions"""
    message = "You do not have permission to approve this action."
    
    def has_permission(self, request, view):
        # Only superuser, admin, and manager roles can approve
        if request.user.is_superuser:
            return True
        return request.user.role in ['admin', 'manager', 'trading_manager', 'commission_manager']


class IsAccountsUser(permissions.BasePermission):
    """Permission for accounting/finance users"""
    message = "You do not have access to accounting features."
    
    def has_permission(self, request, view):
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        return request.user.role in ['accountant', 'accounts_user'] or request.user.has_module_access('commission')
