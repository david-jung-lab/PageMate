import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { API_BASE_URL } from '@/constants';
import { ChatMessage } from '@/features/chat/types';

const WS_URL = API_BASE_URL.replace(/^http/, 'ws') + '/ws-native';

interface Options {
  roomId: number;
  token: string | null;
  onMessage: (msg: ChatMessage) => void;
}

export function useStompChat({ roomId, token, onMessage }: Options) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/chat/${roomId}`, (frame) => {
          try {
            const msg: ChatMessage = JSON.parse(frame.body);
            onMessage(msg);
          } catch {}
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [roomId, token]);

  const sendMessage = useCallback((content: string) => {
    clientRef.current?.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify({ content }),
    });
  }, [roomId]);

  return { sendMessage };
}
