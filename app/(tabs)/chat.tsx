import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius, fontSize } from '@/theme/tokens';
import PMBookCover from '@/components/ui/PMBookCover';
import { chatApi } from '@/features/chat/api';
import { ChatRoom } from '@/features/chat/types';

function timeLabel(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  return `${Math.floor(diffH / 24)}일 전`;
}

function RoomItem({ room, onPress }: { room: ChatRoom; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
      {/* 책 커버 */}
      <View style={styles.coverWrap}>
        {room.bookImageUrl ? (
          <Image source={{ uri: room.bookImageUrl }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <PMBookCover title={room.bookTitle} author="" color={room.bookCoverColor as any} width={44} height={62} />
        )}
      </View>

      {/* 내용 */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.partnerName} numberOfLines={1}>{room.partnerNickname}</Text>
          <Text style={styles.timeText}>{timeLabel(room.lastMessageAt)}</Text>
        </View>
        <Text style={styles.bookTitle} numberOfLines={1}>『{room.bookTitle}』</Text>
        <Text style={styles.lastMsg} numberOfLines={1}>
          {room.lastMessage ?? '대화를 시작해보세요'}
        </Text>
      </View>

      {/* 안읽은 뱃지 */}
      {room.unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{room.unreadCount > 99 ? '99+' : room.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ChatListScreen() {
  const router = useRouter();
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatApi.getRooms,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.topBar}>
        <Text style={styles.title}>메시지</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : !rooms?.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 채팅이 없어요</Text>
          <Text style={styles.emptySubText}>교환 요청을 하면 채팅이 시작돼요</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={r => String(r.id)}
          renderItem={({ item }) => (
            <RoomItem
              room={item}
              onPress={() => router.push(`/chat/${item.id}` as any)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    paddingHorizontal: spacing.s4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s4,
    paddingVertical: 14,
    gap: 12,
  },
  coverWrap: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  coverImg: { width: 44, height: 62, borderRadius: radius.sm },
  content: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  partnerName: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  timeText: { fontSize: 11, color: colors.textTertiary },
  bookTitle: { fontSize: 11, color: colors.primary, fontWeight: '600', letterSpacing: -0.1 },
  lastMsg: { fontSize: 13, color: colors.textSecondary, letterSpacing: -0.1 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.s4 + 44 + 12 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },
  emptySubText: { fontSize: fontSize.small, color: colors.textTertiary },
});
