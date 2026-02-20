import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from 'src/modules/auth/auth.store';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const api = axios.create({
  baseURL: '', // Use Quasar devServer proxy (/api → backend)
  timeout: 30000,
});

export default boot(({ router }) => {
  // Request interceptor — attach JWT token
  api.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore();
      if (authStore.accessToken) {
        config.headers.Authorization = `Bearer ${authStore.accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor — handle 401 + token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const authStore = useAuthStore();

        try {
          await authStore.refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
          return api(originalRequest);
        } catch {
          authStore.logout();
          router.push({ name: 'login' });
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );
});

export { api };
