import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from './auth.api';
import type { AuthUser } from './types';
import { LocalStorage } from 'quasar';

export const useAuthStore = defineStore('auth', () => {
  // ─── State ───
  const accessToken = ref<string | null>(LocalStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(LocalStorage.getItem('refreshToken'));
  const user = ref<AuthUser | null>(null);

  // ─── Getters ───
  const isAuthenticated = computed(() => !!accessToken.value);
  const roles = computed(() => user.value?.roles ?? []);
  const isAdmin = computed(() => roles.value.includes('Admin'));
  const isManager = computed(() => roles.value.includes('Manager'));
  const isSale = computed(() => roles.value.includes('Sale'));
  const fullName = computed(() => user.value?.fullName ?? '');

  // ─── Actions ───
  async function login(employeeCode: string, password: string) {
    const { data } = await authApi.login({ employeeCode, password });
    setTokens(data.accessToken, data.refreshToken);
    await fetchProfile();
  }

  async function fetchProfile() {
    const { data } = await authApi.getProfile();
    user.value = data;
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) throw new Error('No refresh token');
    const { data } = await authApi.refresh(refreshToken.value);
    setTokens(data.accessToken, data.refreshToken);
  }

  async function logout() {
    try {
      if (refreshToken.value) {
        await authApi.logout(refreshToken.value);
      }
    } catch {
      // Ignore logout API errors
    } finally {
      clearTokens();
    }
  }

  function setTokens(access: string, refresh: string) {
    accessToken.value = access;
    refreshToken.value = refresh;
    LocalStorage.set('accessToken', access);
    LocalStorage.set('refreshToken', refresh);
  }

  function clearTokens() {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    LocalStorage.remove('accessToken');
    LocalStorage.remove('refreshToken');
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    roles,
    isAdmin,
    isManager,
    isSale,
    fullName,
    login,
    fetchProfile,
    refreshAccessToken,
    logout,
  };
});
