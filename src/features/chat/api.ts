import { api } from '@/lib/api';
import { ChatRoom, ExchangeSummary, MessageCursorResponse } from './types';

export const chatApi = {
  createRoom: (bookId: number) =>
    api.post<{ data: ChatRoom }>('/chat/rooms', { bookId }).then(r => r.data.data),

  getRooms: () =>
    api.get<{ data: ChatRoom[] }>('/chat/rooms').then(r => r.data.data),

  getMessages: (roomId: number, cursor?: number, size = 30) =>
    api.get<{ data: MessageCursorResponse }>(`/chat/rooms/${roomId}/messages`, {
      params: { cursor, size },
    }).then(r => r.data.data),

  markAsRead: (roomId: number) =>
    api.patch(`/chat/rooms/${roomId}/read`),

  getRoomExchange: (roomId: number) =>
    api.get<{ data: ExchangeSummary | null }>(`/chat/rooms/${roomId}/exchange`).then(r => r.data.data),
};
