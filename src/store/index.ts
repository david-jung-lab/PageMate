import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { AuthUser } from '@/features/auth/types';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  user: AuthUser | null;
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => Promise<void>;
  updateAccessToken: (accessToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,
  user: null,

  setAuth: async (accessToken, refreshToken, user) => {
    await Promise.all([
      storage.setAccessToken(accessToken),
      storage.setRefreshToken(refreshToken),
    ]);
    set({ accessToken, isAuthenticated: true, user });
  },

  updateAccessToken: async (accessToken) => {
    await storage.setAccessToken(accessToken);
    set({ accessToken });
  },

  clearAuth: async () => {
    await storage.clearTokens();
    set({ accessToken: null, isAuthenticated: false, user: null });
  },

  hydrate: async () => {
    const accessToken = await storage.getAccessToken();
    if (accessToken) {
      set({ accessToken, isAuthenticated: true, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));
