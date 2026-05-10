import { api } from '../../lib/api';
import { BookDetail, BookPage, KakaoBookSearchResult } from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const booksApi = {
  getBooks: async (params?: {
    keyword?: string;
    genre?: string;
    neighborhood?: string;
    sort?: string;
    page?: number;
    size?: number;
  }) => {
    const res = await api.get<ApiResponse<BookPage>>('/books', { params });
    return res.data.data;
  },

  getBook: async (id: number) => {
    const res = await api.get<ApiResponse<BookDetail>>(`/books/${id}`);
    return res.data.data;
  },

  searchKakao: async (query: string, page = 1, size = 10) => {
    const res = await api.get<ApiResponse<KakaoBookSearchResult>>('/books/search/kakao', {
      params: { query, page, size },
    });
    return res.data.data;
  },

  createBook: async (data: {
    title: string;
    author: string;
    publisher?: string;
    isbn?: string;
    genre: string;
    description?: string;
    coverColor?: string;
    kakaoThumbnailUrl?: string;
    neighborhood?: string;
  }) => {
    const res = await api.post<ApiResponse<BookDetail>>('/books', data);
    return res.data.data;
  },

  deleteBook: async (id: number) => {
    await api.delete(`/books/${id}`);
  },
};
