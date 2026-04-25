import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  setTokens: (accessToken) => set({ accessToken, isAuthenticated: true }),
  clearAuth: () => set({ accessToken: null, isAuthenticated: false }),
}));
