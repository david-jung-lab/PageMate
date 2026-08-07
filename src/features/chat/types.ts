export type MessageType = 'TEXT' | 'SYSTEM' | 'IMAGE';

export interface ChatMessage {
  id: number;
  senderId: number | null;
  senderNickname: string | null;
  content: string;
  messageType: MessageType;
  isRead: boolean;
  createdAt: string;
}

export interface ChatRoom {
  id: number;
  bookId: number;
  bookTitle: string;
  bookCoverColor: string;
  bookImageUrl: string | null;
  partnerId: number;
  partnerNickname: string;
  partnerProfileImage: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageCursorResponse {
  messages: ChatMessage[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface ExchangeSummary {
  exchangeId: number;
  status: string;
  firstExchangeDate: string | null;
  firstExchangePlace: string | null;
  /** 반납(2차 교환) 기한 — 1차 교환 완료 시 설정 */
  secondExchangeDueDate: string | null;
}
