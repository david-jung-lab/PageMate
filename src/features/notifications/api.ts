import { api } from '@/lib/api';
import type { NotificationItem, NotificationListResponse } from './types';

export const notificationApi = {
  /** 알림 목록 조회 (unreadCount 포함) */
  getNotifications: (page = 0, size = 20) =>
    api
      .get<{ data: NotificationListResponse }>('/v1/notifications', { params: { page, size } })
      .then((r) => r.data.data),

  /** 단건 읽음 처리 */
  markAsRead: (id: number) =>
    api
      .patch<{ data: NotificationItem }>(`/notifications/${id}/read`)
      .then((r) => r.data.data),

  /** 전체 읽음 처리 */
  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
};
