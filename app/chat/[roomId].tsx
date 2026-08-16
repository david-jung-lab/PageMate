import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, Image, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radius, fontSize } from '@/theme/tokens';
import PMIcon from '@/components/ui/PMIcon';
import { chatApi } from '@/features/chat/api';
import { ChatMessage, ExchangeSummary } from '@/features/chat/types';
import { useAuthStore } from '@/store/index';
import { useStompChat } from '@/hooks/useStompChat';
import SafetyMenuButton from '@/components/SafetyMenuButton';
import ReportSheet from '@/components/ReportSheet';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function dDayLabel(dateStr: string): string {
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return days > 0 ? `D-${days}` : days === 0 ? 'D-day' : '기한 초과';
}

// 진행 단계에 맞는 상단 배너 문구. 표시할 일정이 없으면 null.
function buildExchangeBanner(e: ExchangeSummary | null | undefined): string | null {
  if (!e) return null;
  const place = e.firstExchangePlace ? ` · ${e.firstExchangePlace}` : '';
  // 1차 교환 완료 후: 반납(2차 교환) 기한 우선 표시
  if (e.secondExchangeDueDate) {
    return `📅 2차 교환(반납) ${dDayLabel(e.secondExchangeDueDate)}${place}`;
  }
  // 일정 확정 후 1차 교환 전
  if (e.firstExchangeDate) {
    return `📅 1차 교환 ${dDayLabel(e.firstExchangeDate)}${place}`;
  }
  return null;
}

function SystemBubble({ content }: { content: string }) {
  return (
    <View style={bubbleStyles.systemWrap}>
      <Text style={bubbleStyles.systemText}>{content}</Text>
    </View>
  );
}

function Bubble({ msg, isMe, onReport }: {
  msg: ChatMessage; isMe: boolean; onReport?: (msg: ChatMessage) => void;
}) {
  if (msg.messageType === 'SYSTEM') return <SystemBubble content={msg.content} />;
  // 상대 메시지는 길게 눌러 신고할 수 있다
  const handleLongPress = isMe || !onReport ? undefined : () => onReport(msg);
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
          <Pressable onLongPress={handleLongPress} delayLongPress={400}>
            {msg.messageType === 'IMAGE' ? (
              <Image source={{ uri: msg.content }} style={bubbleStyles.image} resizeMode="cover" />
            ) : (
              <View style={[bubbleStyles.bubble, isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleThem]}>
                <Text style={[bubbleStyles.text, isMe && bubbleStyles.textMe]}>{msg.content}</Text>
              </View>
            )}
          </Pressable>
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
  image: {
    width: 200, height: 250,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const myUserId = useAuthStore(s => s.accessToken)
    ? Number(JSON.parse(atob(accessToken!.split('.')[1])).sub)
    : null;

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

  // 상단 고정 배너용 교환 정보
  const { data: exchangeSummary } = useQuery({
    queryKey: ['chat-exchange', roomId],
    queryFn: () => chatApi.getRoomExchange(Number(roomId)),
    staleTime: 60 * 1000,
  });
  const banner = buildExchangeBanner(exchangeSummary);

  // 헤더의 신고·차단 메뉴에 쓸 상대 정보
  const { data: rooms } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatApi.getRooms,
    staleTime: 60 * 1000,
  });
  const room = rooms?.find(r => r.id === Number(roomId));

  // 길게 눌러 신고할 메시지
  const [reportMessage, setReportMessage] = useState<ChatMessage | null>(null);

  // 읽음 처리
  useEffect(() => {
    chatApi.markAsRead(Number(roomId)).catch(() => {});
    qc.invalidateQueries({ queryKey: ['chat-rooms'] });
  }, [roomId]);

  // STOMP 실시간 수신
  const handleNewMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
    if (msg.senderId !== myUserId) {
      chatApi.markAsRead(Number(roomId)).catch(() => {});
    }
  }, [myUserId, roomId]);

  const { sendMessage, isConnected } = useStompChat({
    roomId: Number(roomId),
    token: accessToken,
    onMessage: handleNewMessage,
  });

  const { mutate: sendRest } = useMutation({
    mutationFn: (content: string) => chatApi.createRoom(Number(roomId)).then(() =>
      Promise.reject('use ws')).catch(() =>
      // WS 발신으로만 처리, REST fallback 불필요
      Promise.resolve()),
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  };

  // 이미지 선택 → Cloudinary 업로드 → 서버가 WebSocket으로 브로드캐스트(=구독으로 표시)
  const [imageUploading, setImageUploading] = useState(false);
  const handlePickImage = async () => {
    if (imageUploading) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '사진을 보내려면 사진 접근 권한을 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setImageUploading(true);
    try {
      await chatApi.sendImage(Number(roomId), {
        uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName ?? undefined,
      });
    } catch {
      Alert.alert('전송 실패', '사진을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setImageUploading(false);
    }
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
        <Text style={styles.headerTitle}>{room?.partnerNickname ?? '채팅'}</Text>
        {room ? (
          <SafetyMenuButton
            targetType="USER"
            targetId={room.partnerId}
            targetLabel={room.partnerNickname}
            blockUserId={room.partnerId}
            blockUserName={room.partnerNickname}
            onBlocked={() => router.back()}
          />
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* 교환 일정 고정 배너 */}
      {banner && (
        <View style={styles.exchangeBanner}>
          <Text style={styles.exchangeBannerText} numberOfLines={1}>{banner}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* 메시지 목록 — inverted: 최신 메시지가 항상 하단에 고정 */}
        <FlatList
          data={[...messages].reverse()}
          inverted
          keyExtractor={m => String(m.id)}
          renderItem={({ item }) => (
            <Bubble
              msg={item}
              isMe={item.senderId === myUserId}
              onReport={setReportMessage}
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />

        {/* 입력바 */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handlePickImage}
            activeOpacity={0.7}
            disabled={imageUploading}
          >
            {imageUploading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <PMIcon name="plus" size={22} color={colors.textSecondary} />}
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={isConnected ? '메시지를 입력하세요' : '연결 중...'}
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

      {/* 메시지를 길게 눌렀을 때 뜨는 신고 시트 */}
      <ReportSheet
        visible={!!reportMessage}
        targetType="MESSAGE"
        targetId={reportMessage?.id ?? 0}
        targetLabel={reportMessage?.senderNickname ?? undefined}
        onClose={() => setReportMessage(null)}
      />
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

  exchangeBanner: {
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.s4,
    paddingVertical: 10,
  },
  exchangeBannerText: { fontSize: 13, fontWeight: '600', color: colors.primary, letterSpacing: -0.2 },

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
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: colors.borderStrong },
});
