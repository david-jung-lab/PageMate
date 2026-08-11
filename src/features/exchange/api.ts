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

  // WF7: 약속문 동의
  pledgeExchange: async (id: number): Promise<Exchange> => {
    const res = await api.post<ApiResponse<Exchange>>(`/exchanges/${id}/pledge`);
    return res.data.data;
  },

  // WF8: 일정 확정
  scheduleExchange: async (id: number, exchangeDate: string, place: string): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/exchanges/${id}/schedule`, {
      exchangeDate,
      place,
    });
    return res.data.data;
  },

  // WF9: 1차 교환 완료
  completeExchange: async (id: number, durationDays: number): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/exchanges/${id}/complete`, { durationDays });
    return res.data.data;
  },

  // WF11: 2차 교환 완료
  completeSecondExchange: async (id: number): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/exchanges/${id}/complete-second`);
    return res.data.data;
  },

  cancelExchange: async (id: number): Promise<Exchange> => {
    const res = await api.patch<ApiResponse<Exchange>>(`/exchanges/${id}/cancel`);
    return res.data.data;
  },
};
