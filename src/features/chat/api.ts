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

  /** 이미지 메시지 전송 (multipart). 성공 시 서버가 WebSocket으로 브로드캐스트. */
  sendImage: (roomId: number, asset: { uri: string; mimeType?: string; fileName?: string }) => {
    const form = new FormData();
    form.append('image', {
      uri: asset.uri,
      name: asset.fileName ?? `chat_${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    } as any);
    return api.post(`/chat/rooms/${roomId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getRoomExchange: (roomId: number) =>
    api.get<{ data: ExchangeSummary | null }>(`/chat/rooms/${roomId}/exchange`).then(r => r.data.data),
};
