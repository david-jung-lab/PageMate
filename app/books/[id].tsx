import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  Modal, FlatList, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radius, fontSize } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMBookCover from '../../src/components/ui/PMBookCover';
import PMBadge from '../../src/components/ui/PMBadge';
import PMAvatar from '../../src/components/ui/PMAvatar';
import { booksApi } from '../../src/features/books/api';
import { profileApi } from '../../src/features/profile/api';
import { exchangeApi } from '../../src/features/exchange/api';
import { CONDITION_LABELS, STATUS_LABELS } from '../../src/constants';
import { BookSummary } from '../../src/features/books/types';

const statusVariant = (s: string) => {
  if (s === 'AVAILABLE') return 'success' as const;
  if (s === 'IN_PROGRESS') return 'primary' as const;
  return 'default' as const;
};

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => booksApi.getBook(Number(id)),
    enabled: !!id,
  });

  const { data: myBooksData } = useQuery({
    queryKey: ['myBooks', 'available'],
    queryFn: () => profileApi.getMyBooks(0, 50),
    enabled: modalVisible,
  });

  const myAvailableBooks = (myBooksData?.content ?? []).filter(
    b => b.status === 'AVAILABLE' && b.id !== Number(id)
  );

  const exchangeMutation = useMutation({
    mutationFn: ({ offeredBookId }: { offeredBookId: number }) =>
      exchangeApi.createExchange(Number(id), offeredBookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      setModalVisible(false);
      Alert.alert('교환 요청 완료', '상대방의 수락을 기다려 주세요.');
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error?.code;
      const msg =
        code === 'DUPLICATE_REQUEST' ? '이미 요청한 도서예요.' :
        code === 'BOOK_NOT_AVAILABLE' ? '교환할 수 없는 상태의 책이에요.' :
        '교환 요청에 실패했어요.';
      Alert.alert('오류', msg);
    },
  });

  const handleRequestExchange = () => {
    if (!selectedBookId) {
      Alert.alert('책 선택', '제안할 책을 선택해 주세요.');
      return;
    }
    exchangeMutation.mutate({ offeredBookId: selectedBookId });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>도서를 찾을 수 없어요</Text>
        </View>
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
        <Text style={styles.headerTitle}>도서 상세</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 커버 + 기본정보 */}
        <View style={styles.heroSection}>
          <View style={styles.coverWrap}>
            {book.imageUrl ? (
              <Image source={{ uri: book.imageUrl }} style={styles.coverImg} resizeMode="cover" />
            ) : (
              <PMBookCover
                title={book.title}
                author={book.author}
                color={book.coverColor}
                width={140}
                height={200}
              />
            )}
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.badges}>
              <PMBadge variant={statusVariant(book.status)} size="sm">
                {STATUS_LABELS[book.status]}
              </PMBadge>
              <PMBadge variant="default" size="sm">{book.genre}</PMBadge>
            </View>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
            {book.publisher && (
              <Text style={styles.publisher}>{book.publisher}</Text>
            )}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>상태</Text>
              <Text style={styles.conditionValue}>{CONDITION_LABELS[book.condition]}</Text>
            </View>
            {book.distance != null && (
              <View style={styles.distanceRow}>
                <PMIcon name="location" size={13} color={colors.textSecondary} />
                <Text style={styles.distanceText}>
                  {book.distance < 1
                    ? `${Math.round(book.distance * 1000)}m 거리`
                    : `${book.distance.toFixed(1)}km 거리`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 소개 */}
        {book.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>한줄 소개</Text>
            <Text style={styles.description}>{book.description}</Text>
          </View>
        )}

        {/* 소유자 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>등록한 사람</Text>
          <View style={styles.ownerCard}>
            <PMAvatar name={book.owner.nickname} color="blue" size={48} />
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{book.owner.nickname}</Text>
              {book.owner.handle && (
                <Text style={styles.ownerHandle}>{book.owner.handle}</Text>
              )}
              <View style={styles.ownerStats}>
                <Text style={styles.ownerStat}>등록 {book.owner.bookCount}권</Text>
                <Text style={styles.ownerStatDot}>·</Text>
                <Text style={styles.ownerStat}>교환 {book.owner.exchangeCount}회</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 교환 요청 버튼 */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.exchangeBtn,
              book.status !== 'AVAILABLE' && styles.exchangeBtnDisabled,
            ]}
            activeOpacity={0.85}
            disabled={book.status !== 'AVAILABLE'}
            onPress={() => setModalVisible(true)}
          >
            <PMIcon name="swap" size={18} color="#fff" />
            <Text style={styles.exchangeBtnText}>
              {book.status === 'AVAILABLE' ? '교환 요청하기' : '교환 불가'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 교환 요청 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>제안할 책 선택</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <PMIcon name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            <Text style={styles.modalBookTitle}>"{book.title}"</Text>
            {' '}와(과) 교환할 내 책을 선택해 주세요
          </Text>

          {myAvailableBooks.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={styles.emptyText}>교환 가능한 책이 없어요</Text>
              <Text style={styles.emptyHint}>AVAILABLE 상태인 책이 있어야 교환 요청이 가능해요</Text>
            </View>
          ) : (
            <FlatList
              data={myAvailableBooks}
              keyExtractor={b => String(b.id)}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }: { item: BookSummary }) => (
                <TouchableOpacity
                  style={[
                    styles.bookItem,
                    selectedBookId === item.id && styles.bookItemSelected,
                  ]}
                  onPress={() => setSelectedBookId(item.id)}
                  activeOpacity={0.75}
                >
                  <PMBookCover
                    title={item.title}
                    author={item.author}
                    color={item.coverColor}
                    imageUrl={item.imageUrl ?? undefined}
                    width={56}
                    height={78}
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
            />
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!selectedBookId || exchangeMutation.isPending) && styles.confirmBtnDisabled,
              ]}
              onPress={handleRequestExchange}
              disabled={!selectedBookId || exchangeMutation.isPending}
            >
              {exchangeMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>교환 요청 보내기</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  heroSection: {
    flexDirection: 'row',
    gap: 18,
    padding: spacing.s5,
  },
  coverWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    flexShrink: 0,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  coverImg: { width: 140, height: 200, borderRadius: radius.md },
  heroInfo: { flex: 1, justifyContent: 'flex-start', gap: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  title: {
    fontSize: fontSize.h3,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 26,
    marginTop: 4,
  },
  author: { fontSize: 14, color: colors.textSecondary },
  publisher: { fontSize: 12, color: colors.textTertiary },
  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  conditionLabel: { fontSize: 12, color: colors.textTertiary },
  conditionValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: 12, color: colors.textSecondary },

  section: {
    marginHorizontal: spacing.s4,
    marginBottom: spacing.s5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    letterSpacing: -0.1,
  },

  ownerCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ownerInfo: { flex: 1, gap: 2 },
  ownerName: { fontSize: 15, fontWeight: '700', color: colors.text },
  ownerHandle: { fontSize: 11, color: colors.textTertiary, fontFamily: 'monospace' },
  ownerStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ownerStat: { fontSize: 12, color: colors.textSecondary },
  ownerStatDot: { fontSize: 12, color: colors.textTertiary },

  actionSection: {
    paddingHorizontal: spacing.s4,
    marginTop: spacing.s2,
  },
  exchangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
  },
  exchangeBtnDisabled: {
    backgroundColor: colors.borderStrong,
  },
  exchangeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },

  // 모달
  modalSafe: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: spacing.s4,
    paddingVertical: 12,
    lineHeight: 20,
  },
  modalBookTitle: { fontWeight: '700', color: colors.text },
  modalList: { paddingHorizontal: spacing.s4, paddingBottom: 20, gap: 10 },
  modalEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  emptyHint: { fontSize: 12, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: 40 },

  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  bookItemInfo: { flex: 1 },
  bookItemTitle: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },
  bookItemAuthor: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  modalFooter: {
    padding: spacing.s4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: colors.borderStrong },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
