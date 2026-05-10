import { api } from '../../lib/api';
import { Review, UserReviews } from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const reviewApi = {
  createReview: async (exchangeId: number, rating: number, comment?: string): Promise<Review> => {
    const res = await api.post<ApiResponse<Review>>(`/exchanges/${exchangeId}/reviews`, { rating, comment });
    return res.data.data;
  },

  hasReviewed: async (exchangeId: number): Promise<boolean> => {
    const res = await api.get<ApiResponse<boolean>>(`/exchanges/${exchangeId}/reviews/status`);
    return res.data.data;
  },

  getUserReviews: async (userId: number): Promise<UserReviews> => {
    const res = await api.get<ApiResponse<UserReviews>>(`/v1/users/${userId}/reviews`);
    return res.data.data;
  },
};
