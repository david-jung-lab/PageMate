export type NotificationType =
  | 'EXCHANGE_REQUEST'
  | 'EXCHANGE_ACCEPTED'
  | 'EXCHANGE_REJECTED'
  | 'EXCHANGE_COMPLETED'
  | 'CHAT_MESSAGE'
  | 'PLEDGE_REQUESTED'
  | 'SECOND_DUE'
  | 'REVIEW_REQUESTED';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  content: string;
  isRead: boolean;
  referenceId: number | null;
  createdAt: string;
}

export interface NotificationListResponse {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  unreadCount: number;
}
