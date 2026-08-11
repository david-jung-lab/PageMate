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
      // 서버가 인증/인가 실패로 프레임을 거부한 경우 재연결 루프를 멈춘다.
      // 토큰이 갱신되면 token prop 변경으로 이 effect 가 다시 실행되어 재연결된다.
      onStompError: () => {
        setIsConnected(false);
        client.deactivate();
      },
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
