import { useEffect, useRef, useCallback, useState } from 'react';
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
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new WebSocket(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/chat/${roomId}`, (frame) => {
          try {
            const msg: ChatMessage = JSON.parse(frame.body);
            onMessageRef.current(msg);
          } catch {}
        });
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => {
        console.error('[STOMP] error:', frame.headers['message']);
        setIsConnected(false);
      },
      onWebSocketError: (e) => {
        console.error('[STOMP] ws error:', e);
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [roomId, token]);

  const sendMessage = useCallback((content: string) => {
    if (!clientRef.current?.connected) return false;
    clientRef.current.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify({ content }),
    });
    return true;
  }, [roomId]);

  return { sendMessage, isConnected };
}
