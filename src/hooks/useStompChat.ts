import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { Platform } from 'react-native';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '@/constants';
import { ChatMessage } from '@/features/chat/types';

const WS_URL = API_BASE_URL.replace(/^http/, 'ws') + '/ws-native';
const SOCKJS_URL = API_BASE_URL + '/ws';

interface Options {
  roomId: number;
  token: string | null;
  onMessage: (msg: ChatMessage) => void;
}

export function useStompChat({ roomId, token, onMessage }: Options) {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      ...(Platform.OS === 'web'
        ? { webSocketFactory: () => new SockJS(SOCKJS_URL) }
        : { brokerURL: WS_URL }),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/chat/${roomId}`, (frame) => {
          try {
            const msg: ChatMessage = JSON.parse(frame.body);
            onMessage(msg);
          } catch {}
        });
      },
      onDisconnect: () => setIsConnected(false),
      onWebSocketError: () => setIsConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      setIsConnected(false);
      client.deactivate();
    };
  }, [roomId, token]);

  const sendMessage = useCallback((content: string) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    client.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify({ content }),
    });
  }, [roomId]);

  return { sendMessage, isConnected };
}
