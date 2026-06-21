import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../../src/theme/tokens';
import PMIcon from '../../../src/components/ui/PMIcon';
import PMBookCover from '../../../src/components/ui/PMBookCover';
import { exchangeApi } from '../../../src/features/exchange/api';
import { ExchangeBookInfo } from '../../../src/features/exchange/types';

export default function RespondScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const exchangeId = Number(id);

  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  const { data: exchange, isLoading: exchangeLoading } = useQuery({
    queryKey: ['exchange', id],
    queryFn: () => exchangeApi.getExchange(exchangeId),
    enabled: !!id,
  });

  const { data: requesterBooks, isLoading: booksLoading } = useQuery({
    queryKey: ['exchange', id, 'requester-books'],
    queryFn: () => exchangeApi.getRequesterBooks(exchangeId),
    enabled: !!id,
  });

  const respondMutation = useMutation({
    mutationFn: ({ action, selectedBookId }: { action: 'ACCEPT' | 'REJECT'; selectedBookId?: number }) =>
      exchangeApi.respond(exchangeId, action, selectedBookId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      if (result.status === 'ACCEPTED' && result.chatRoomId) {
        router.replace(`/chat/${result.chatRoomId}` as any);
      } else {
        router.back();
      }
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error?.code;
      const msg =
        code === 'BOOK_NOT_AVAILABLE' ? '선택한 책이 교환 불가 상태예요.' :
        '처리에 실패했어요. 다시 시도해 주세요.';
      Alert.alert('오류', msg);
    },
  });

  const handleAccept = () => {
    if (!selectedBookId) {
      Alert.alert('책 선택', '교환할 내 책을 선택해 주세요.');
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm('이 책으로 교환을 수락하시겠어요?')) {
        respondMutation.mutate({ action: 'ACCEPT', selectedBookId });
      }
    } else {
      Alert.alert('교환 수락', '이 책으로 교환을 수락하시겠어요?', [
        { text: '취소', style: 'cancel' },
        { text: '수락', onPress: () => respondMutation.mutate({ action: 'ACCEPT', selectedBookId }) },
      ]);
    }
  };

  const handleReject = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('교환 요청을 거절하시겠어요?')) {
        respondMutation.mutate({ action: 'REJECT' });
      }
    } else {
      Alert.alert('교환 거절', '교환 요청을 거절하시겠어요?', [
        { text: '취소', style: 'cancel' },
        { text: '거절', style: 'destructive', onPress: () => respondMutation.mutate({ action: 'REJECT' }) },
      ]);
    }
  };

  const isLoading = exchangeLoading || booksLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!exchange) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>교환 요청을 찾을 수 없어요</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <PMIcon name="chevronLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>교환 요청 확인</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={requesterBooks ?? []}
        keyExtractor={b => String(b.id)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* 요청 받은 책 정보 */}
            <View style={styles.requestedSection}>
              <Text style={styles.sectionLabel}>상대방이 원하는 책</Text>
              <View style={styles.requestedCard}>
                <PMBookCover
                  title={exchange.requestedBook.title}
                  author={exchange.requestedBook.author}
                  color={exchange.requestedBook.coverColor as any}
                  imageUrl={exchange.requestedBook.imageUrl ?? undefined}
                  width={64}
                  height={90}
                />
                <View style={styles.requestedInfo}>
                  <Text style={styles.requesterName}>{exchange.requester.nickname}</Text>
                  <Text style={styles.requestedTitle} numberOfLines={2}>
                    {exchange.requestedBook.title}
                  </Text>
                  <Text style={styles.requestedAuthor}>{exchange.requestedBook.author}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>교환할 내 책 선택</Text>
            {(requesterBooks ?? []).length === 0 && (
              <View style={styles.emptyBooks}>
                <Text style={styles.emptyText}>상대방이 교환 가능한 책이 없어요</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }: { item: ExchangeBookInfo }) => (
          <TouchableOpacity
            style={[styles.bookItem, selectedBookId === item.id && styles.bookItemSelected]}
            onPress={() => setSelectedBookId(item.id)}
            activeOpacity={0.75}
          >
            <PMBookCover
              title={item.title}
              author={item.author}
              color={item.coverColor as any}
              imageUrl={item.imageUrl ?? undefined}
              width={52}
              height={74}
            />
            <View style={styles.bookItemInfo}>
              <Text style={styles.bookItemTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.bookItemAuthor} numberOfLines={1}>{item.author}</Text>
            </View>
            {selectedBookId === item.id && (
              <PMIcon name="check" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
        ListFooterComponent={<View style={{ height: 120 }} />}
      />

      {/* 하단 액션 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={handleReject}
          disabled={respondMutation.isPending}
          activeOpacity={0.75}
        >
          <Text style={styles.rejectBtnText}>거절하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.acceptBtn,
            (!selectedBookId || respondMutation.isPending) && styles.acceptBtnDisabled,
          ]}
          onPress={handleAccept}
          disabled={!selectedBookId || respondMutation.isPending}
          activeOpacity={0.85}
        >
          {respondMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.acceptBtnText}>교환 수락하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: colors.textTertiary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },

  content: { padding: spacing.s4 },

  requestedSection: {
    marginBottom: spacing.s4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  requestedCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
  },
  requestedInfo: { flex: 1, gap: 4 },
  requesterName: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  requestedTitle: { fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 21 },
  requestedAuthor: { fontSize: 12, color: colors.textSecondary },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.s4,
  },

  emptyBooks: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.textTertiary },

  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  bookItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  bookItemInfo: { flex: 1 },
  bookItemTitle: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },
  bookItemAuthor: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: spacing.s4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  rejectBtn: {
    flex: 1,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { fontSize: 15, fontWeight: '700', color: colors.text },
  acceptBtn: {
    flex: 2,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnDisabled: { backgroundColor: colors.borderStrong },
  acceptBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
