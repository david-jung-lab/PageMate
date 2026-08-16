import { api } from '../../lib/api';
import { BlockedUser, ReportRequest } from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const safetyApi = {
  /** 사용자·도서·채팅 메시지·후기 신고 */
  report: async (req: ReportRequest): Promise<void> => {
    await api.post('/v1/reports', req);
  },

  blockUser: async (targetId: number): Promise<void> => {
    await api.post(`/v1/users/${targetId}/block`);
  },

  unblockUser: async (targetId: number): Promise<void> => {
    await api.delete(`/v1/users/${targetId}/block`);
  },

  getBlockedUsers: async (): Promise<BlockedUser[]> => {
    const res = await api.get<ApiResponse<BlockedUser[]>>('/v1/users/me/blocks');
    return res.data.data;
  },
};
