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
  PLEDGE_REQUESTED: '약속문 동의',
  SECOND_DUE: '반납 기한 알림',
  REVIEW_REQUESTED: '평가 요청',
};

const TYPE_ICON: Record<NotificationType, 'swap' | 'chat'> = {
  EXCHANGE_REQUEST: 'swap',
  EXCHANGE_ACCEPTED: 'swap',
  EXCHANGE_REJECTED: 'swap',
  EXCHANGE_COMPLETED: 'swap',
  CHAT_MESSAGE: 'chat',
  PLEDGE_REQUESTED: 'swap',
  SECOND_DUE: 'swap',
  REVIEW_REQUESTED: 'swap',
};

type Tab = 'all' | 'exchange' | 'message' | 'system';

const EXCHANGE_TYPES: NotificationType[] = [
  'EXCHANGE_REQUEST', 'EXCHANGE_ACCEPTED', 'EXCHANGE_REJECTED', 'EXCHANGE_COMPLETED',
  'PLEDGE_REQUESTED', 'SECOND_DUE', 'REVIEW_REQUESTED',
];
const MESSAGE_TYPES: NotificationType[] = ['CHAT_MESSAGE'];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function filterByTab(items: NotificationItem[], tab: Tab): NotificationItem[] {
  if (tab === 'exchange') return items.filter(n => EXCHANGE_TYPES.includes(n.type));
  if (tab === 'message') return items.filter(n => MESSAGE_TYPES.includes(n.type));
  if (tab === 'system') return items.filter(n => !EXCHANGE_TYPES.includes(n.type) && !MESSAGE_TYPES.includes(n.type));
  return items;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('all');

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
    } else if (item.type === 'EXCHANGE_REQUEST' && item.referenceId) {
      router.push(`/exchanges/${item.referenceId}/respond` as any);
    } else if (item.type === 'EXCHANGE_ACCEPTED' && item.referenceId) {
      router.push(`/exchanges/${item.referenceId}/agreement` as any);
    } else if (item.type === 'EXCHANGE_COMPLETED' && item.referenceId) {
      router.push(`/exchanges/${item.referenceId}/review` as any);
    } else if (item.type === 'PLEDGE_REQUESTED' && item.referenceId) {
      router.push(`/exchanges/${item.referenceId}/agreement` as any);
    } else if (item.type === 'REVIEW_REQUESTED' && item.referenceId) {
      router.push(`/exchanges/${item.referenceId}/review` as any);
    } else if (item.type === 'SECOND_DUE' && item.referenceId) {
      router.push('/(tabs)/swap' as any);
    } else if (item.type === 'EXCHANGE_REJECTED') {
      router.push('/(tabs)/swap' as any);
    } else {
      // 미정의 타입 또는 referenceId 없음 → 교환 탭으로 안전하게 이동
      router.push('/(tabs)/swap' as any);
    }
  };

  const handleMarkAll = async () => {
    await notificationApi.markAllAsRead().catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const displayed = filterByTab(items, tab);
  const hasUnread = items.some(n => !n.isRead);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'exchange', label: '교환' },
    { key: 'message', label: '메시지' },
    { key: 'system', label: '시스템' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <PMIcon name="chevronLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        {hasUnread ? (
          <TouchableOpacity onPress={handleMarkAll} activeOpacity={0.7}>
            <Text style={styles.markAllBtn}>모두 읽음</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          contentContainerStyle={displayed.length === 0 ? styles.emptyContainer : undefined}
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
              {!item.isRead && <View style={styles.unreadIndicator} />}
              <View style={[styles.iconWrap, !item.isRead && styles.iconWrapUnread]}>
                <PMIcon
                  name={TYPE_ICON[item.type]}
                  size={18}
                  color={item.isRead ? colors.textSecondary : colors.primary}
                />
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemType, item.isRead && styles.itemTypeRead]}>
                  {TYPE_LABEL[item.type]}
                </Text>
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

  // 탭
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.s4,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: 20,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textTertiary },
  tabTextActive: { color: colors.primary },

  // 알림 아이템
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: spacing.s4,
    paddingVertical: 14,
    backgroundColor: colors.bg,
    position: 'relative',
  },
  itemUnread: { backgroundColor: colors.primarySoft },
  // 좌측 파란 인디케이터 (설계서 SCR-018: 좌측 #4F86C6 3px)
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.primary,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, flexShrink: 0,
  },
  iconWrapUnread: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  itemBody: { flex: 1 },
  itemType: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  itemTypeRead: { color: colors.textTertiary },
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
