export type ExchangeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface ExchangeBookInfo {
  id: number;
  title: string;
  author: string;
  imageUrl: string | null;
  coverColor: string;
  status: string;
}

export interface ExchangeUserInfo {
  id: number;
  nickname: string;
  handle: string | null;
  profileImage: string | null;
  avatarColor: string | null;
}

export interface Exchange {
  id: number;
  requestedBook: ExchangeBookInfo;
  selectedBook: ExchangeBookInfo | null;
  requester: ExchangeUserInfo;
  respondent: ExchangeUserInfo;
  status: ExchangeStatus;
  chatRoomId: number | null;
  createdAt: string;
}

export interface ExchangePage {
  content: Exchange[];
  totalElements: number;
  totalPages: number;
  number: number;
  last: boolean;
}
