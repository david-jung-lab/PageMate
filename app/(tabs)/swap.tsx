import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, Platform,
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
  FIRST_EXCHANGED: '반납 대기',
  REJECTED: '거절됨',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

type BadgeVariant = 'warning' | 'primary' | 'danger' | 'success' | 'default';
const STATUS_VARIANT: Record<ExchangeStatus, BadgeVariant> = {
  PENDING: 'warning',
  ACCEPTED: 'primary',
  FIRST_EXCHANGED: 'warning',
  REJECTED: 'danger',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

type Tab = 'active' | 'done';

export default function SwapScreen() {
  const [tab, setTab] = useState<Tab>('active');
  const [periodModal, setPeriodModal] = useState<{ exchangeId: number } | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const queryClient = useQueryClient();
  const router = useRouter();
  const myUserId = useAuthStore((s) => s.user?.id);

  const activeStatuses: ExchangeStatus[] = ['PENDING', 'ACCEPTED', 'FIRST_EXCHANGED'];
  const doneStatuses: ExchangeStatus[] = ['REJECTED', 'COMPLETED', 'CANCELLED'];

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['exchanges', 'active'],
    queryFn: () => exchangeApi.getMyExchanges(undefined, 0, 50),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, durationDays }: { id: number; durationDays: number }) =>
      exchangeApi.completeExchange(id, durationDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      setPeriodModal(null);
    },
    onError: () => Alert.alert('오류', '완료 처리에 실패했어요.'),
  });

  const completeSecondMutation = useMutation({
    mutationFn: exchangeApi.completeSecondExchange,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exchanges'] }),
    onError: () => Alert.alert('오류', '반납 완료 처리에 실패했어요.'),
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

  const handleComplete = (id: number) => {
    setSelectedDays(7);
    setPeriodModal({ exchangeId: id });
  };

  const handleSecondComplete = (id: number) => {
    Alert.alert('반납 완료', '책을 돌려받으셨나요?', [
      { text: '취소', style: 'cancel' },
      { text: '완료', onPress: () => completeSecondMutation.mutate(id) },
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
        {item.selectedBook ? (
          <BookMini
            title={item.selectedBook.title}
            author={item.selectedBook.author}
            imageUrl={item.selectedBook.imageUrl}
            coverColor={item.selectedBook.coverColor}
            label="내 책"
          />
        ) : (
          <View style={styles.bookMini}>
            <Text style={styles.bookMiniLabel}>내 책</Text>
            <View style={styles.bookMiniPlaceholder}>
              <PMIcon name="swap" size={20} color={colors.borderStrong} />
            </View>
            <Text style={styles.bookMiniTitle}>선택 대기 중</Text>
          </View>
        )}
        <PMIcon name="swap" size={20} color={colors.textTertiary} />
        <BookMini
          title={item.requestedBook.title}
          author={item.requestedBook.author}
          imageUrl={item.requestedBook.imageUrl}
          coverColor={item.requestedBook.coverColor}
          label="원하는 책"
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
          {item.respondent.id === myUserId ? (
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => router.push(`/exchanges/${item.id}/respond` as any)}
            >
              <Text style={styles.btnPrimaryText}>요청 확인하기</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnDanger} onPress={() => handleCancel(item.id)}>
              <Text style={styles.btnDangerText}>요청 취소</Text>
            </TouchableOpacity>
          )}
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
            <Text style={styles.btnPrimaryText}>1차 교환 완료</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'FIRST_EXCHANGED' && (
        <>
          {item.dueDate && (
            <View style={styles.dueDateRow}>
              <Text style={styles.dueDateLabel}>반납 기한</Text>
              <Text style={styles.dueDateValue}>{item.dueDate}</Text>
            </View>
          )}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => handleSecondComplete(item.id)}>
              <Text style={styles.btnPrimaryText}>반납 완료</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const dueDate = periodModal
    ? new Date(Date.now() + selectedDays * 86400000).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* 기간 선택 바텀시트 */}
      <Modal
        visible={!!periodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPeriodModal(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPeriodModal(null)} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>몇 일 후에 책을{'\n'}돌려드릴까요?</Text>
          <Text style={styles.sheetSub}>7일을 권장해요.</Text>

          {/* 슬라이더 (터치 기반 스텝 버튼) */}
          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setSelectedDays(d => Math.max(1, d - 1))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.daysDisplay}>
              <Text style={styles.daysNumber}>{selectedDays}</Text>
              <Text style={styles.daysUnit}>일</Text>
              {selectedDays === 7 && <Text style={styles.recommendBadge}>권장 기간 ✓</Text>}
            </View>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setSelectedDays(d => Math.min(30, d + 1))}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stepTrack}>
            {[1, 7, 14, 21, 30].map(v => (
              <TouchableOpacity key={v} onPress={() => setSelectedDays(v)} style={styles.stepChip}>
                <Text style={[styles.stepChipText, selectedDays === v && styles.stepChipActive]}>{v}일</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.dueDatePreview}>
            <Text style={styles.dueDatePreviewLabel}>완료 시 자동 계산: 2차 교환 기한 →</Text>
            <Text style={styles.dueDatePreviewValue}>{dueDate}</Text>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, styles.sheetConfirmBtn, completeMutation.isPending && { opacity: 0.6 }]}
            disabled={completeMutation.isPending}
            onPress={() => periodModal && completeMutation.mutate({ id: periodModal.exchangeId, durationDays: selectedDays })}
          >
            <Text style={styles.btnPrimaryText}>완료</Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
  bookMiniPlaceholder: {
    width: 72,
    height: 100,
    backgroundColor: colors.surface2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
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

  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dueDateLabel: { fontSize: 12, color: colors.textSecondary },
  dueDateValue: { fontSize: 12, fontWeight: '700', color: colors.primary },

  // 바텀시트
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 16,
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  sheetSub: { fontSize: 14, color: colors.textSecondary, marginTop: -8 },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  stepBtn: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, color: colors.text, lineHeight: 26 },
  daysDisplay: { flex: 1, alignItems: 'center', gap: 2 },
  daysNumber: { fontSize: 40, fontWeight: '700', color: colors.primary, lineHeight: 46 },
  daysUnit: { fontSize: 14, color: colors.textSecondary },
  recommendBadge: { fontSize: 11, color: colors.primary, fontWeight: '600' },

  stepTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepChip: {
    flex: 1,
    height: 34,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  stepChipActive: { color: colors.primary },

  dueDatePreview: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  dueDatePreviewLabel: { fontSize: 12, color: colors.textSecondary },
  dueDatePreviewValue: { fontSize: 14, fontWeight: '700', color: colors.text },

  sheetConfirmBtn: { height: 52, borderRadius: radius.lg },
});
