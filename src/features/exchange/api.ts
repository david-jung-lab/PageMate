import { api } from '../../lib/api';
import { Exchange, ExchangeBookInfo, ExchangePage, ExchangeStatus } from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const exchangeApi = {
  createExchange: async (targetBookId: number): Promise<Exchange> => {
    const res = await api.post<ApiResponse<Exchange>>('/exchanges', { targetBookId });
    return res.data.data;
  },

  getMyExchanges: async (status?: ExchangeStatus, page = 0, size = 20): Promise<ExchangePage> => {
    const res = await api.get<ApiResponse<ExchangePage>>('/exchanges', {
      params: { status, page, size },
    });
    return res.data.data;
  },

  getExchange: async (id: number): Promise<Exchange> => {
    const res = await api.get<ApiResponse<Exchange>>(`/exchanges/${id}`);
    return res.data.data;
  },

  getRequesterBooks: async (id: number): Promise<ExchangeBookInfo[]> => {
    const res = await api.get<ApiResponse<ExchangeBookInfo[]>>(`/exchanges/${id}/requester-books`);
    return res.data.data;
  },

  respond: async (
    id: number,
    action: 'ACCEPT' | 'REJECT',
    selectedBookId?: number
  ): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/exchanges/${id}/respond`, {
      action,
      selectedBookId,
    });
    return res.data.data;
  },

  completeExchange: async (id: number): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/exchanges/${id}/complete`);
    return res.data.data;
  },

  cancelExchange: async (id: number): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/exchanges/${id}/cancel`);
    return res.data.data;
  },
};
