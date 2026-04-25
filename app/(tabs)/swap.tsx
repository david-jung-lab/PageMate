import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, fontSize } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMAvatar from '../../src/components/ui/PMAvatar';
import PMBookCover from '../../src/components/ui/PMBookCover';
import PMBadge from '../../src/components/ui/PMBadge';
import { exchangeApi } from '../../src/features/exchange/api';
import { Exchange, ExchangeStatus } from '../../src/features/exchange/types';
import { useAuthStore } from '../../src/store';

const STATUS_LABELS: Record<ExchangeStatus, string> = {
  PENDING: '요청 중',
  ACCEPTED: '교환 중',
  REJECTED: '거절됨',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

type BadgeVariant = 'warning' | 'primary' | 'danger' | 'success' | 'default';
const STATUS_VARIANT: Record<ExchangeStatus, BadgeVariant> = {
  PENDING: 'warning',
  ACCEPTED: 'primary',
  REJECTED: 'danger',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

type Tab = 'active' | 'done';

export default function SwapScreen() {
  const [tab, setTab] = useState<Tab>('active');
  const queryClient = useQueryClient();
  const router = useRouter();
  const myUserId = useAuthStore((s) => s.user?.id);

  const activeStatuses: ExchangeStatus[] = ['PENDING', 'ACCEPTED'];
  const doneStatuses: ExchangeStatus[] = ['REJECTED', 'COMPLETED', 'CANCELLED'];

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['exchanges', 'active'],
    queryFn: () => exchangeApi.getMyExchanges(undefined, 0, 50),
  });

  const acceptMutation = useMutation({
    mutationFn: exchangeApi.acceptExchange,
    onSuccess: (exchange) => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      if (exchange.chatRoomId) {
        router.push(`/chat/${exchange.chatRoomId}` as any);
      }
    },
    onError: () => Alert.alert('오류', '수락에 실패했어요.'),
  });

  const rejectMutation = useMutation({
    mutationFn: exchangeApi.rejectExchange,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exchanges'] }),
    onError: () => Alert.alert('오류', '거절에 실패했어요.'),
  });

  const completeMutation = useMutation({
    mutationFn: exchangeApi.completeExchange,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exchanges'] }),
    onError: () => Alert.alert('오류', '완료 처리에 실패했어요.'),
  });

  const cancelMutation = useMutation({
    mutationFn: exchangeApi.cancelExchange,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exchanges'] }),
    onError: () => Alert.alert('오류', '취소에 실패했어요.'),
  });

  const allExchanges = activeData?.content ?? [];
  const displayed = allExchanges.filter(e =>
    tab === 'active'
      ? activeStatuses.includes(e.status)
      : doneStatuses.includes(e.status)
  );

  const handleAccept = (id: number) => {
    Alert.alert('교환 수락', '교환 요청을 수락하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '수락', onPress: () => acceptMutation.mutate(id) },
    ]);
  };

  const handleReject = (id: number) => {
    Alert.alert('교환 거절', '교환 요청을 거절하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '거절', style: 'destructive', onPress: () => rejectMutation.mutate(id) },
    ]);
  };

  const handleComplete = (id: number) => {
    Alert.alert('교환 완료', '교환이 완료됐나요?', [
      { text: '취소', style: 'cancel' },
      { text: '완료', onPress: () => completeMutation.mutate(id) },
    ]);
  };

  const handleCancel = (id: number) => {
    Alert.alert('요청 취소', '교환 요청을 취소할까요?', [
      { text: '아니요', style: 'cancel' },
      { text: '취소하기', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
    ]);
  };

  const renderExchange = ({ item }: { item: Exchange }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <PMBadge variant={STATUS_VARIANT[item.status]} size="sm">
          {STATUS_LABELS[item.status]}
        </PMBadge>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
        </Text>
      </View>

      <View style={styles.booksRow}>
        <BookMini
          title={item.offeredBook.title}
          author={item.offeredBook.author}
          imageUrl={item.offeredBook.imageUrl}
          coverColor={item.offeredBook.coverColor}
          label="내 책"
        />
        <PMIcon name="swap" size={20} color={colors.textTertiary} />
        <BookMini
          title={item.requestedBook.title}
          author={item.requestedBook.author}
          imageUrl={item.requestedBook.imageUrl}
          coverColor={item.requestedBook.coverColor}
          label="상대 책"
        />
      </View>

      <View style={styles.partnerRow}>
        <PMAvatar
          name={item.respondent.nickname}
          color={item.respondent.avatarColor ?? 'blue'}
          size={28}
          imageUrl={item.respondent.profileImage ?? undefined}
        />
        <Text style={styles.partnerName}>{item.respondent.nickname}</Text>
        <Text style={styles.partnerLabel}>와(과) 교환</Text>
      </View>

      {item.status === 'PENDING' && (
        <View style={styles.actions}>
          <ActionButtons
            onAccept={() => handleAccept(item.id)}
            onReject={() => handleReject(item.id)}
            onCancel={() => handleCancel(item.id)}
            isRespondent={item.respondent.id === myUserId}
          />
        </View>
      )}

      {item.status === 'ACCEPTED' && (
        <View style={styles.actions}>
          {item.chatRoomId && (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => router.push(`/chat/${item.chatRoomId}` as any)}
            >
              <Text style={styles.btnSecondaryText}>채팅방 이동</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.btnPrimary} onPress={() => handleComplete(item.id)}>
            <Text style={styles.btnPrimaryText}>교환 완료</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.topBar}>
        <Text style={styles.title}>교환</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>진행 중</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'done' && styles.tabActive]}
          onPress={() => setTab('done')}
        >
          <Text style={[styles.tabText, tab === 'done' && styles.tabTextActive]}>완료·거절</Text>
        </TouchableOpacity>
      </View>

      {activeLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : displayed.length === 0 ? (
        <View style={styles.empty}>
          <PMIcon name="swap" size={40} color={colors.borderStrong} />
          <Text style={styles.emptyText}>
            {tab === 'active' ? '진행 중인 교환이 없어요' : '완료된 교환이 없어요'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={e => String(e.id)}
          renderItem={renderExchange}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function BookMini({
  title, author, imageUrl, coverColor, label,
}: {
  title: string; author: string; imageUrl: string | null; coverColor: string; label: string;
}) {
  return (
    <View style={styles.bookMini}>
      <Text style={styles.bookMiniLabel}>{label}</Text>
      <PMBookCover
        title={title}
        author={author}
        color={coverColor as any}
        imageUrl={imageUrl ?? undefined}
        width={72}
        height={100}
      />
      <Text style={styles.bookMiniTitle} numberOfLines={2}>{title}</Text>
    </View>
  );
}

function ActionButtons({
  onAccept, onReject, onCancel, isRespondent,
}: {
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  isRespondent: boolean;
}) {
  if (isRespondent) {
    return (
      <>
        <TouchableOpacity style={styles.btnSecondary} onPress={onReject}>
          <Text style={styles.btnSecondaryText}>거절</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={onAccept}>
          <Text style={styles.btnPrimaryText}>수락</Text>
        </TouchableOpacity>
      </>
    );
  }
  return (
    <TouchableOpacity style={styles.btnDanger} onPress={onCancel}>
      <Text style={styles.btnDangerText}>요청 취소</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    paddingHorizontal: spacing.s4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },

  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.s4,
    gap: 24,
  },
  tab: { paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textTertiary, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: colors.textTertiary },

  list: { padding: spacing.s4, gap: 12 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 12, color: colors.textTertiary },

  booksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bookMini: { flex: 1, alignItems: 'center', gap: 6 },
  bookMiniLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '600' },
  bookMiniTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
  },

  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 10,
  },
  partnerName: { fontSize: 13, fontWeight: '700', color: colors.text },
  partnerLabel: { fontSize: 13, color: colors.textSecondary },

  actions: { flexDirection: 'row', gap: 8 },
  btnPrimary: {
    flex: 1,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  btnSecondary: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '700', color: colors.text },
  btnDanger: {
    flex: 1,
    height: 40,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDangerText: { fontSize: 13, fontWeight: '700', color: colors.danger },
});
