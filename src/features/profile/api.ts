import { api } from '../../lib/api';
import { Profile, ProfileUpdateParams } from './types';
import { BookPage } from '../books/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const profileApi = {
  getMyProfile: async (): Promise<Profile> => {
    const res = await api.get<ApiResponse<Profile>>('/v1/users/me');
    return res.data.data;
  },

  updateMyProfile: async (params: ProfileUpdateParams): Promise<Profile> => {
    const form = new FormData();
    if (params.nickname) form.append('nickname', params.nickname);
    if (params.bio !== undefined) form.append('bio', params.bio ?? '');
    if (params.location !== undefined) form.append('location', params.location ?? '');
    if (params.avatarColor) form.append('avatarColor', params.avatarColor);
    if (params.tags) form.append('tags', JSON.stringify(params.tags));
    if (params.image) {
      form.append('image', params.image as any);
    }
    const res = await api.patch<ApiResponse<Profile>>('/v1/users/me', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  getUserProfile: async (id: number): Promise<Profile> => {
    const res = await api.get<ApiResponse<Profile>>(`/v1/users/${id}`);
    return res.data.data;
  },

  getMyBooks: async (page = 0, size = 10): Promise<BookPage> => {
    const res = await api.get<ApiResponse<BookPage>>('/v1/users/me/books', {
      params: { page, size },
    });
    return res.data.data;
  },

  getUserBooks: async (id: number, page = 0, size = 20): Promise<BookPage> => {
    const res = await api.get<ApiResponse<BookPage>>(`/v1/users/${id}/books`, {
      params: { page, size },
    });
    return res.data.data;
  },
};
