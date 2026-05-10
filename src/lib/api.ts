import axios from 'axios';
import { router } from 'expo-router';
import { API_BASE_URL } from '../constants';
import { useAuthStore } from '../store';
import { storage } from './storage';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) throw new Error('no refresh token');

        const res = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, { refreshToken });
        const newAccessToken: string = res.data.data.accessToken;

        await useAuthStore.getState().updateAccessToken(newAccessToken);
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch {
        await useAuthStore.getState().clearAuth();
        router.replace('/(auth)/login');
      }
    }
    return Promise.reject(error);
  },
);
