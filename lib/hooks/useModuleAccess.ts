import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

/**
 * Returns true if the logged-in user has access to the given module.
 * Usage: const hasAccess = useModuleAccess('commission');
 */
export function useModuleAccess(module: string): boolean {
  const { user } = useSelector((state: RootState) => state.auth);
  if (!user) return false;
  const allowed = user.allowed_modules ?? [];
  return allowed.includes(module);
}