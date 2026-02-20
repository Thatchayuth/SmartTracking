import { api } from 'src/boot/axios';
import type { LoginRequest, TokenResponse, AuthUser } from './types';

export const authApi = {
  login(data: LoginRequest) {
    return api.post<TokenResponse>('/api/auth/login', data);
  },

  refresh(refreshToken: string) {
    return api.post<TokenResponse>('/api/auth/refresh', { refreshToken });
  },

  logout(refreshToken: string) {
    return api.post('/api/auth/logout', { refreshToken });
  },

  getProfile() {
    return api.get<AuthUser>('/api/auth/me');
  },
};
