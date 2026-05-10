import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radius, fontSize } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMBookCover from '../../src/components/ui/PMBookCover';
import PMBadge from '../../src/components/ui/PMBadge';
import PMAvatar from '../../src/components/ui/PMAvatar';
import { booksApi } from '../../src/features/books/api';
import { exchangeApi } from '../../src/features/exchange/api';
import { STATUS_LABELS, GENRE_LABELS } from '../../src/constants';
import Svg, { Path } from 'react-native-svg';

const statusVariant = (s: string) => {
  if (s === 'AVAILABLE') return 'success' as const;
  if (s === 'IN_PROGRESS') return 'primary' as const;
  return 'default' as const;
};

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => booksApi.getBook(Number(id)),
    enabled: !!id,
  });

  const exchangeMutation = useMutation({
    mutationFn: () => exchangeApi.createExchange(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
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
    Alert.alert('교환 요청', `"${book?.title}"에 교환 요청을 보내시겠어요?`, [
      { text: '취소', style: 'cancel' },
      { text: '요청하기', onPress: () => exchangeMutation.mutate() },
    ]);
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
              <PMBadge variant="default" size="sm">{GENRE_LABELS[book.genre] ?? book.genre}</PMBadge>
            </View>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
            {book.publisher && (
              <Text style={styles.publisher}>{book.publisher}</Text>
            )}
            {book.neighborhood && (
              <View style={styles.distanceRow}>
                <PMIcon name="location" size={13} color={colors.textSecondary} />
                <Text style={styles.distanceText}>{book.neighborhood}</Text>
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
              <View style={styles.ownerRatingRow}>
                <Svg width={13} height={13} viewBox="0 0 24 24">
                  <Path
                    d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
                    fill="#F4A261" stroke="#F4A261" strokeWidth="1" strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.ownerRating}>
                  {book.owner.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.ownerRatingCount}>({book.owner.reviewCount})</Text>
              </View>
              <View style={styles.ownerStats}>
                <Text style={styles.ownerStat}>등록 {book.owner.bookCount}권</Text>
                <Text style={styles.ownerStatDot}>·</Text>
                <Text style={styles.ownerStat}>교환 {book.owner.exchangeCount}회</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            activeOpacity={0.75}
            onPress={() => router.push(`/users/${book.owner.id}`)}
          >
            <Text style={styles.profileBtnText}>프로필 보기</Text>
            <PMIcon name="chevronRight" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 교환 요청 버튼 */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.exchangeBtn,
              (book.status !== 'AVAILABLE' || exchangeMutation.isPending) && styles.exchangeBtnDisabled,
            ]}
            activeOpacity={0.85}
            disabled={book.status !== 'AVAILABLE' || exchangeMutation.isPending}
            onPress={handleRequestExchange}
          >
            {exchangeMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <PMIcon name="swap" size={18} color="#fff" />
                <Text style={styles.exchangeBtnText}>
                  {book.status === 'AVAILABLE' ? '교환 요청하기' : '교환 불가'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileBtn: {
    marginTop: 4,
    height: 38,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  profileBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  ownerInfo: { flex: 1, gap: 2 },
  ownerName: { fontSize: 15, fontWeight: '700', color: colors.text },
  ownerRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ownerRating: { fontSize: 13, fontWeight: '700', color: colors.text },
  ownerRatingCount: { fontSize: 12, color: colors.textTertiary },
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
});
