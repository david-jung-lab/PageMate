import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radius, fontSize } from '@/theme/tokens';
import PMIcon from '@/components/ui/PMIcon';
import { chatApi } from '@/features/chat/api';
import { ChatMessage } from '@/features/chat/types';
import { useAuthStore } from '@/store/index';
import { useStompChat } from '@/hooks/useStompChat';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function SystemBubble({ content }: { content: string }) {
  return (
    <View style={bubbleStyles.systemWrap}>
      <Text style={bubbleStyles.systemText}>{content}</Text>
    </View>
  );
}

function Bubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  if (msg.messageType === 'SYSTEM') return <SystemBubble content={msg.content} />;
  return (
    <View style={[bubbleStyles.row, isMe && bubbleStyles.rowMe]}>
      {!isMe && (
        <View style={bubbleStyles.avatar}>
          <Text style={bubbleStyles.avatarText}>
            {(msg.senderNickname ?? '?')[0]}
          </Text>
        </View>
      )}
      <View style={bubbleStyles.group}>
        {!isMe && <Text style={bubbleStyles.senderName}>{msg.senderNickname}</Text>}
        <View style={bubbleStyles.bubbleRow}>
          {isMe && <Text style={bubbleStyles.time}>{formatTime(msg.createdAt)}</Text>}
          <View style={[bubbleStyles.bubble, isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleThem]}>
            <Text style={[bubbleStyles.text, isMe && bubbleStyles.textMe]}>{msg.content}</Text>
          </View>
          {!isMe && <Text style={bubbleStyles.time}>{formatTime(msg.createdAt)}</Text>}
        </View>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  rowMe: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  group: { maxWidth: '72%', gap: 3 },
  senderName: { fontSize: 11, color: colors.textTertiary, marginLeft: 2 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  bubble: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: radius.lg,
    maxWidth: '100%',
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: fontSize.body, color: colors.text, lineHeight: 20 },
  textMe: { color: '#fff' },
  time: { fontSize: 10, color: colors.textTertiary, marginBottom: 2 },
  systemWrap: {
    alignItems: 'center', marginVertical: 8,
  },
  systemText: {
    fontSize: 12, color: colors.textTertiary,
    backgroundColor: colors.surface2,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
});

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const accessToken = useAuthStore(s => s.accessToken);
  const myUserId = useAuthStore(s => s.user?.id) ?? null;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<FlatList>(null);

  // 커서 기반 무한 스크롤 (id DESC → 화면에는 역순 표시)
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading,
  } = useInfiniteQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: ({ pageParam }) =>
      chatApi.getMessages(Number(roomId), pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  // 페이지 데이터 → 평탄화 & 역순 정렬 (오래된 것이 위)
  useEffect(() => {
    if (!data) return;
    const flat = data.pages.flatMap(p => p.messages).reverse();
    setMessages(flat);
  }, [data]);

  // 읽음 처리
  useEffect(() => {
    chatApi.markAsRead(Number(roomId)).catch(() => {});
    qc.invalidateQueries({ queryKey: ['chat-rooms'] });
  }, [roomId]);

  // STOMP 실시간 수신 — 내가 보낸 메시지는 낙관적 항목을 실제 메시지로 교체
  const handleNewMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      if (msg.senderId === myUserId) {
        const optIdx = prev.map((m, i) => (m.id < 0 ? i : -1)).filter(i => i >= 0).pop();
        if (optIdx !== undefined) {
          const updated = [...prev];
          updated[optIdx] = msg;
          return updated;
        }
      }
      return [...prev, msg];
    });
    if (msg.senderId !== myUserId) {
      chatApi.markAsRead(Number(roomId)).catch(() => {});
    }
  }, [myUserId, roomId]);

  const { sendMessage, isConnected } = useStompChat({
    roomId: Number(roomId),
    token: accessToken,
    onMessage: handleNewMessage,
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    // 낙관적 업데이트 — 전송 즉시 화면에 표시
    const optimistic: ChatMessage = {
      id: -Date.now(),
      senderId: myUserId,
      senderNickname: null,
      content: text,
      messageType: 'TEXT',
      isRead: true,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    sendMessage(text);
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <PMIcon name="chevronRight" size={20} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>채팅</Text>
          {!isConnected && (
            <Text style={{ fontSize: 10, color: colors.textTertiary }}>연결 중...</Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* 메시지 목록 */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => String(m.id)}
          renderItem={({ item }) => (
            <Bubble msg={item} isMe={item.senderId === myUserId} />
          )}
          contentContainerStyle={styles.listContent}
          onStartReached={loadMore}
          onStartReachedThreshold={0.2}
          ListHeaderComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
            ) : null
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />

        {/* 입력바 */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || !isConnected) && styles.sendBtnDisabled]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!input.trim() || !isConnected}
          >
            <PMIcon name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.s4, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },

  listContent: { paddingHorizontal: spacing.s4, paddingVertical: 12, gap: 2 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: spacing.s4, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  textInput: {
    flex: 1, minHeight: 40, maxHeight: 120,
    backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: fontSize.body, color: colors.text,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: colors.borderStrong },
});
