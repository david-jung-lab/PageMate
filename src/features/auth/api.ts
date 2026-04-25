import { api } from '@/lib/api';

export interface OnboardRequest {
  nickname: string;
  handle: string;
  bio?: string;
  location: string;
  genres: string[];
}

export const authApi = {
  onboard: (req: OnboardRequest) =>
    api.post('/users/me/onboard', req).then((r) => r.data.data),
};
