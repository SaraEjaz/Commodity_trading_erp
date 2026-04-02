import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout } from '@/lib/slices/authSlice';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, is_authenticated, access_token, loading } = useSelector(
    (state: RootState) => state.auth
  );

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return {
    user,
    isAuthenticated: is_authenticated,
    accessToken: access_token,
    loading,
    logout: handleLogout,
  };
}