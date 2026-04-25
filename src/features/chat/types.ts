export type MessageType = 'TEXT' | 'SYSTEM';

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
