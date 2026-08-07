import { api } from '@/lib/api';
import { DEMO_LOGIN_KEY } from '@/constants';
import type { AuthResponse, RefreshResponse } from './types';

interface ApiWrapper<T> {
  success: boolean;
  data: T;
}

export interface OnboardRequest {
  nickname: string;
  handle: string;
  bio?: string;
  location: string;
  genres: string[];
}

export const authApi = {
  loginWithGoogle: (authorizationCode: string, redirectUri: string) =>
    api.post<ApiWrapper<AuthResponse>>('/v1/auth/oauth/google', { authorizationCode, redirectUri }),

  loginWithKakao: (authorizationCode: string, redirectUri: string) =>
    api.post<ApiWrapper<AuthResponse>>('/v1/auth/oauth/kakao', { authorizationCode, redirectUri }),

  // Apple App Store 심사관용 데모 로그인 (체험 계정)
  loginDemo: () =>
    api.post<ApiWrapper<AuthResponse>>('/v1/auth/demo', undefined, {
      headers: { 'X-Demo-Key': DEMO_LOGIN_KEY },
    }),

  refresh: (refreshToken: string) =>
    api.post<ApiWrapper<RefreshResponse>>('/v1/auth/refresh', { refreshToken }),

  logout: () =>
    api.post('/v1/auth/logout'),

  onboard: (req: OnboardRequest) =>
    api.post('/users/me/onboard', req).then((r) => r.data.data),
};
