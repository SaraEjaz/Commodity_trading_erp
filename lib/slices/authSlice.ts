import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  is_authenticated: boolean;
  is_hydrated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  access_token: null,
  refresh_token: null,
  is_authenticated: false,
  is_hydrated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.is_authenticated = true;
      state.error = null;
    },
    setTokens(state, action: PayloadAction<{ access: string; refresh: string }>) {
      state.access_token = action.payload.access;
      state.refresh_token = action.payload.refresh;
      state.is_authenticated = true;
      try {
        const decoded: any = jwtDecode(action.payload.access);
        state.user = decoded;
      } catch (err) {
        console.error('Invalid token:', err);
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.access_token = null;
      state.refresh_token = null;
      state.is_authenticated = false;
      state.error = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    hydrate(state) {
      const access_token = localStorage.getItem('access_token');
      const refresh_token = localStorage.getItem('refresh_token');
      if (access_token && refresh_token) {
        state.access_token = access_token;
        state.refresh_token = refresh_token;
        state.is_authenticated = true;
        try {
          const decoded: any = jwtDecode(access_token);
          state.user = decoded;
        } catch (err) {
          console.error('Invalid stored token:', err);
        }
      }
      state.is_hydrated = true;
    },
  },
});

export const { setUser, setTokens, setLoading, setError, logout, hydrate } = authSlice.actions;
export default authSlice.reducer;
