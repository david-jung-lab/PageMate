import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, radius, spacing } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import { notificationApi } from '../../src/features/notifications/api';
import { NotificationItem, NotificationType } from '../../src/features/notifications/types';

const TYPE_LABEL: Record<NotificationType, string> = {
  EXCHANGE_REQUEST: '교환 요청',
  EXCHANGE_ACCEPTED: '교환 수락',
  EXCHANGE_REJECTED: '교환 거절',
  EXCHANGE_COMPLETED: '교환 완료',
  CHAT_MESSAGE: '새 메시지',
};

const TYPE_ICON: Record<NotificationType, 'swap' | 'chat'> = {
  EXCHANGE_REQUEST: 'swap',
  EXCHANGE_ACCEPTED: 'swap',
  EXCHANGE_REJECTED: 'swap',
  EXCHANGE_COMPLETED: 'swap',
  CHAT_MESSAGE: 'chat',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await notificationApi.getNotifications(0, 50);
      setItems(res.content);
    } catch {
      // 에러 무시 (비로그인 등)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePress = async (item: NotificationItem) => {
    if (!item.isRead) {
      await notificationApi.markAsRead(item.id).catch(() => {});
      setItems(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    }
    if (item.type === 'CHAT_MESSAGE' && item.referenceId) {
      router.push(`/chat/${item.referenceId}`);
    } else if (item.referenceId && item.type !== 'CHAT_MESSAGE') {
      router.push(`/books/${item.referenceId}`);
    }
  };

  const handleMarkAll = async () => {
    await notificationApi.markAllAsRead().catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <PMIcon name="chevronLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        {items.some(n => !n.isRead) ? (
          <TouchableOpacity onPress={handleMarkAll} activeOpacity={0.7}>
            <Text style={styles.markAllBtn}>모두 읽음</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          contentContainerStyle={items.length === 0 && styles.emptyContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>알림이 없어요</Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, !item.isRead && styles.itemUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, !item.isRead && styles.iconWrapUnread]}>
                <PMIcon
                  name={TYPE_ICON[item.type]}
                  size={18}
                  color={item.isRead ? colors.textSecondary : colors.primary}
                />
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemType}>{TYPE_LABEL[item.type]}</Text>
                <Text style={styles.itemContent} numberOfLines={2}>{item.content}</Text>
                <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.isRead && <View style={styles.dot} />}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.s4, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  markAllBtn: { fontSize: 13, fontWeight: '600', color: colors.primary, width: 60, textAlign: 'right' },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: spacing.s4, paddingVertical: 14,
    backgroundColor: colors.bg,
  },
  itemUnread: { backgroundColor: colors.primarySoft },
  iconWrap: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, flexShrink: 0,
  },
  iconWrapUnread: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  itemBody: { flex: 1 },
  itemType: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  itemContent: { fontSize: 13, color: colors.text, lineHeight: 18, letterSpacing: -0.1 },
  itemTime: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary, marginTop: 6, flexShrink: 0,
  },
  separator: { height: 1, backgroundColor: colors.border },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: colors.textTertiary },
});
