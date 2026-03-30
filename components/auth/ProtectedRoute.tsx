'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
  requiredRole?: string[];
}

/**
 * ProtectedRoute component - wraps pages to enforce authentication and module access
 * Usage:
 * <ProtectedRoute requiredModule="trading">
 *   <YourComponent />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredModule,
  requiredRole 
}) => {
  const router = useRouter();
  const { user, is_authenticated, is_hydrated } = useSelector((state: RootState) => state.auth);
  const [isAuthorized, setIsAuthorized] = React.useState(false);

  useEffect(() => {
    if (!is_hydrated) return; // Wait for auth to be loaded

    // Check authentication
    if (!is_authenticated || !user) {
      router.push('/login');
      return;
    }

    // Check module access
    if (requiredModule) {
      const hasModuleAccess = user.allowed_modules?.includes(requiredModule);
      if (!hasModuleAccess && !user.role?.includes('admin')) {
        router.push('/dashboard');
        return;
      }
    }

    // Check role
    if (requiredRole) {
      const hasRole = requiredRole.includes(user.role);
      if (!hasRole && user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    }

    setIsAuthorized(true);
  }, [is_authenticated, is_hydrated, user, requiredModule, requiredRole, router]);

  if (!is_hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Hook to check if user has access to a specific module
 */
export const useModuleAccess = (module?: string) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  if (!module) return true;
  
  return user?.allowed_modules?.includes(module) || user?.role?.includes('admin') || false;
};

/**
 * Hook to check if user has a specific role
 */
export const useRole = (roles: string[]) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  if (!user) return false;
  
  return roles.includes(user.role);
};

/**
 * Hook to get current user info
 */
export const useAuth = () => {
  const { user, is_authenticated, is_hydrated, access_token } = useSelector((state: RootState) => state.auth);
  
  return {
    user,
    is_authenticated,
    is_hydrated,
    access_token,
    can_access_module: (module: string) => user?.allowed_modules?.includes(module) || user?.role?.includes('admin') || false,
  };
};

/**
 * Component to conditionally render based on module access
 */
export const IfModuleAccess: React.FC<{ 
  module: string; 
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ module, children, fallback = null }) => {
  const hasAccess = useModuleAccess(module);
  
  if (!hasAccess) return <>{fallback}</>;
  
  return <>{children}</>;
};

/**
 * Component to conditionally render based on role
 */
export const IfRole: React.FC<{ 
  roles: string[]; 
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ roles, children, fallback = null }) => {
  const hasRole = useRole(roles);
  
  if (!hasRole) return <>{fallback}</>;
  
  return <>{children}</>;
};
