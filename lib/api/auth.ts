import client from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
  module?: 'trading' | 'commission'; // ← added so register page doesn't show red
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

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
  phone: string;
  department: string;
  created_at: string;
  updated_at: string;
  module_accesses: ModuleAccess[];
  allowed_modules: string[];
  default_module: string | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await client.post<LoginResponse>('auth/token/', credentials);
    return response.data;
  },

  register: async (data: SignupData) => {
    const response = await client.post<User>('users/', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await client.get<User>('users/me/');
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await client.patch<User>('users/me/', data);
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string, newPasswordConfirm: string) => {
    const response = await client.post('users/change_password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await client.post<AuthTokens>('auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};

export default authAPI;