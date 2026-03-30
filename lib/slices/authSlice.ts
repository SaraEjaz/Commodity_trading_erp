import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

export interface ModuleAccess {
  id: number;
  module: string;
  module_display: string;
  is_default: boolean;
  is_active: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  phone?: string;
  department?: string;
  module_accesses?: ModuleAccess[];
  allowed_modules?: string[];
  default_module?: string | null;
}

interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  is_authenticated: boolean;
  is_hydrated: boolean;
  loading: boolean;
  error: string | null;
  current_module: string | null; // Track current module
}

const initialState: AuthState = {
  user: null,
  access_token: null,
  refresh_token: null,
  is_authenticated: false,
  is_hydrated: false,
  loading: false,
  error: null,
  current_module: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.is_authenticated = true;
      state.error = null;
      // Auto-set current module to default or first allowed
      if (action.payload.default_module) {
        state.current_module = action.payload.default_module;
      } else if (action.payload.allowed_modules && action.payload.allowed_modules.length > 0) {
        state.current_module = action.payload.allowed_modules[0];
      }
    },
    setTokens(state, action: PayloadAction<{ access: string; refresh: string; user?: User }>) {
      state.access_token = action.payload.access;
      state.refresh_token = action.payload.refresh;
      state.is_authenticated = true;
      if (action.payload.user) {
        state.user = action.payload.user;
        // Set current module if available
        if (action.payload.user.default_module) {
          state.current_module = action.payload.user.default_module;
        } else if (action.payload.user.allowed_modules && action.payload.user.allowed_modules.length > 0) {
          state.current_module = action.payload.user.allowed_modules[0];
        }
      } else {
        // Fallback to JWT decode if user not in payload
        try {
          const decoded: any = jwtDecode(action.payload.access);
          state.user = {
            ...decoded,
            id: decoded.user_id || decoded.id,
          };
          state.current_module = decoded.default_module || (decoded.allowed_modules?.[0] || null);
        } catch (err) {
          console.error('Invalid token:', err);
        }
      }
    },
    setCurrentModule(state, action: PayloadAction<string>) {
      // Verify user has access to this module
      if (state.user?.allowed_modules?.includes(action.payload)) {
        state.current_module = action.payload;
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
      state.current_module = null;
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
          state.user = {
            ...decoded,
            id: decoded.user_id || decoded.id,
          };
          state.current_module = decoded.default_module || (decoded.allowed_modules?.[0] || null);
        } catch (err) {
          console.error('Invalid stored token:', err);
        }
      }
      state.is_hydrated = true;
    },
  },
});

export const { setUser, setTokens, setCurrentModule, setLoading, setError, logout, hydrate } = authSlice.actions;
export default authSlice.reducer;
