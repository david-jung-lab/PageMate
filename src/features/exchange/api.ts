import { api } from '../../lib/api';
import { Exchange, ExchangePage, ExchangeStatus } from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const exchangeApi = {
  createExchange: async (requestedBookId: number, offeredBookId: number): Promise<Exchange> => {
    const res = await api.post<ApiResponse<Exchange>>('/v1/exchanges', {
      requestedBookId,
      offeredBookId,
    });
    return res.data.data;
  },

  getMyExchanges: async (status?: ExchangeStatus, page = 0, size = 20): Promise<ExchangePage> => {
    const res = await api.get<ApiResponse<ExchangePage>>('/v1/exchanges', {
      params: { status, page, size },
    });
    return res.data.data;
  },

  getExchange: async (id: number): Promise<Exchange> => {
    const res = await api.get<ApiResponse<Exchange>>(`/v1/exchanges/${id}`);
    return res.data.data;
  },

  acceptExchange: async (id: number): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/v1/exchanges/${id}/accept`);
    return res.data.data;
  },

  rejectExchange: async (id: number): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/v1/exchanges/${id}/reject`);
    return res.data.data;
  },

  completeExchange: async (id: number): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/v1/exchanges/${id}/complete`);
    return res.data.data;
  },

  cancelExchange: async (id: number): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/v1/exchanges/${id}/cancel`);
    return res.data.data;
  },
};
