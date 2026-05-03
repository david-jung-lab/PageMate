import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, StatusBar, ActivityIndicator,
  Modal, FlatList, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMBookCover from '../../src/components/ui/PMBookCover';
import Svg, { Path, Circle } from 'react-native-svg';
import PMBadge from '../../src/components/ui/PMBadge';
import PMAvatar from '../../src/components/ui/PMAvatar';
import { booksApi } from '../../src/features/books/api';
import { profileApi } from '../../src/features/profile/api';
import { exchangeApi } from '../../src/features/exchange/api';
import { CONDITION_LABELS, STATUS_LABELS } from '../../src/constants';
import { BookSummary, CoverColor } from '../../src/features/books/types';
import { useAuthStore } from '../../src/store';

/* 커버 컬러 → 연한 파스텔 (히어로 그라데이션 시작 색) */
const COVER_PASTEL: Record<string, string> = {
  blue: '#DDE8F5', orange: '#FDE9D4', sage: '#DDE8DC',
  plum: '#EBE0EF', sand: '#F0E8DC', ink: '#CDD0D6',
};

/* 더미 도서 (다른 책 섹션 자리 채우기) */
type MiniBook = { id: number; title: string; author: string; coverColor: CoverColor; imageUrl: string | null };
const DUMMY_BOOKS: MiniBook[] = [
  { id: -1, title: '소년이 온다', author: '한강', coverColor: 'ink', imageUrl: null },
  { id: -2, title: '흰', author: '한강', coverColor: 'sand', imageUrl: null },
  { id: -3, title: '채식주의자', author: '한강', coverColor: 'sage', imageUrl: null },
];

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const myUserId = useAuthStore((s) => s.user?.id);
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => booksApi.getBook(Number(id)),
    enabled: !!id,
  });

  const { data: ownerBooksData } = useQuery({
    queryKey: ['userBooks', book?.owner.id],
    queryFn: () => profileApi.getUserBooks(book!.owner.id, 0, 10),
    enabled: !!book?.owner.id,
  });

  const { data: myBooksData, isLoading: myBooksLoading } = useQuery({
    queryKey: ['myBooks', 'available'],
    queryFn: () => profileApi.getMyBooks(0, 50, 'AVAILABLE'),
    enabled: modalVisible,
  });

  const otherBooks: MiniBook[] = (ownerBooksData?.content ?? [])
    .filter(b => b.id !== Number(id))
    .slice(0, 6)
    .map(b => ({ id: b.id, title: b.title, author: b.author, coverColor: b.coverColor, imageUrl: b.imageUrl }));
  const myAvailableBooks = (myBooksData?.content ?? []).filter(
    b => b.id !== Number(id)
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
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>도서를 찾을 수 없어요</Text>
      </View>
    );
  }

  const topPad = insets.top + 8;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* 플로팅 상단 버튼 */}
      <View style={[styles.topBar, { top: topPad }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.floatBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <PMIcon name="chevronLeft" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatBtn} activeOpacity={0.85}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={6} cy={12} r={2.2} stroke={colors.text} strokeWidth={1.8} />
            <Circle cx={17} cy={6} r={2.2} stroke={colors.text} strokeWidth={1.8} />
            <Circle cx={17} cy={18} r={2.2} stroke={colors.text} strokeWidth={1.8} />
            <Path d="M8.3 10.7 14.8 7.3M8.3 13.3 14.8 16.7" stroke={colors.text} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 커버 히어로 */}
        <View style={[styles.heroContainer, { paddingTop: topPad + 44 }]}>
          {/* 블러 배경 (overflow:hidden 적용) */}
          <View style={styles.heroBgClip}>
            {book.imageUrl ? (
              <Image
                source={{ uri: book.imageUrl }}
                style={styles.heroBgImage}
                blurRadius={28}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroBgColor, { backgroundColor: COVER_PASTEL[book.coverColor] ?? '#EFE7F0' }]} />
            )}
          </View>
          {/* 하단 페이드 — 컨테이너 아래로 연장 */}
          <LinearGradient
            colors={['rgba(250,250,248,0)', 'rgba(250,250,248,0.55)', 'rgba(250,250,248,0.85)', '#FAFAF8']}
            locations={[0, 0.45, 0.72, 1]}
            style={styles.heroFade}
          />
          {/* 책 표지 */}
          <View style={styles.coverShadow}>
            <View style={styles.coverClip}>
              {book.imageUrl ? (
                <Image source={{ uri: book.imageUrl }} style={styles.coverImg} resizeMode="cover" />
              ) : (
                <PMBookCover
                  title={book.title}
                  author={book.author}
                  color={book.coverColor}
                  width={195}
                  height={282}
                />
              )}
            </View>
          </View>
        </View>

        {/* 제목 블록 */}
        <View style={styles.titleBlock}>
          <View style={styles.badgeRow}>
            <PMBadge variant="primary" size="sm">{book.genre}</PMBadge>
          </View>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.authorItalic}>by {book.author}</Text>
        </View>

        {/* 통계 pills */}
        <View style={styles.statRow}>
          {[
            { label: '출판사', value: book.publisher ?? '—' },
            { label: '연도', value: '—' },
            { label: '쪽수', value: '—' },
          ].map((s) => (
            <View key={s.label} style={styles.statPill}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* 보유자 */}
        <SectionTitle>보유자</SectionTitle>
        <View style={styles.sectionPad}>
          <View style={styles.card}>
            <View style={styles.ownerRow}>
              <PMAvatar
                name={book.owner.nickname}
                imageUrl={book.owner.profileImage ?? undefined}
                color="blue"
                size={52}
              />
              <View style={styles.ownerMeta}>
                <View style={styles.ownerNameRow}>
                  <Text style={styles.ownerName}>{book.owner.nickname}</Text>
                  {book.owner.handle && (
                    <Text style={styles.ownerHandle}>{book.owner.handle}</Text>
                  )}
                </View>
                {book.owner.bio ? (
                  <Text style={styles.ownerBio} numberOfLines={2}>{book.owner.bio}</Text>
                ) : null}
              </View>
            </View>

            {book.owner.tags?.length > 0 && (
              <View style={styles.tagsRow}>
                {book.owner.tags.map((t) => (
                  <PMBadge key={t} variant="primary" size="sm"># {t}</PMBadge>
                ))}
              </View>
            )}

            <View style={styles.ownerStatsDivider} />
            <View style={styles.ownerStats}>
              {[
                { label: '보유 도서', value: String(book.owner.bookCount) },
                { label: '교환 횟수', value: String(book.owner.exchangeCount) },
                { label: '평점', value: book.owner.rating != null ? String(book.owner.rating) : '—', icon: true },
              ].map(({ label, value, icon }, i) => (
                <View key={label} style={[styles.ownerStatItem, i > 0 && styles.ownerStatBorder]}>
                  <View style={styles.ownerStatValueRow}>
                    {icon && <PMIcon name="star" size={12} color={colors.secondary} />}
                    <Text style={styles.ownerStatValue}>{value}</Text>
                  </View>
                  <Text style={styles.ownerStatLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.profileBtn}
              activeOpacity={0.75}
              onPress={() => router.push(`/users/${book.owner.id}` as any)}
            >
              <Text style={styles.profileBtnText}>프로필 보기</Text>
              <PMIcon name="chevronRight" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 소개 */}
        {book.description && (
          <>
            <SectionTitle>한줄 소개</SectionTitle>
            <View style={styles.sectionPad}>
              <View style={styles.introBlock}>
                <Text style={styles.introText}>{book.description}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* 하단 고정 CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity
          style={[styles.likeBtn, liked && styles.likeBtnActive]}
          onPress={() => setLiked(!liked)}
          activeOpacity={0.8}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"
              stroke={liked ? colors.secondary : colors.text}
              fill={liked ? colors.secondary : 'none'}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        {book.owner.id !== myUserId && (
          <TouchableOpacity
            style={[styles.exchangeBtn, book.status !== 'AVAILABLE' && styles.exchangeBtnDisabled]}
            activeOpacity={0.85}
            disabled={book.status !== 'AVAILABLE'}
            onPress={() => setModalVisible(true)}
          >
            <PMIcon name="swap" size={18} color="#fff" />
            <Text style={styles.exchangeBtnText}>
              {book.status === 'AVAILABLE' ? '교환 요청하기' : '교환 불가'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 교환 요청 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalSafe}>
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

          {myBooksLoading ? (
            <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
          ) : myAvailableBooks.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={styles.emptyText}>제안할 수 있는 책이 없어요</Text>
              <Text style={styles.emptyHint}>내 책 중 교환 가능한 책이 있어야{'\n'}교환 요청을 보낼 수 있어요</Text>
            </View>
          ) : (
            <FlatList
              data={myAvailableBooks}
              keyExtractor={b => String(b.id)}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }: { item: BookSummary }) => (
                <TouchableOpacity
                  style={[styles.bookItem, selectedBookId === item.id && styles.bookItemSelected]}
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
        </View>
      </Modal>
    </View>
  );
}

/* ---------- Section Title ---------- */
function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitleText}>{children}</Text>
      {sub && <Text style={styles.sectionSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: colors.textTertiary },
  scroll: { flex: 1 },

  /* 플로팅 상단 바 */
  topBar: {
    position: 'absolute',
    left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  floatBtn: {
    width: 40, height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { backdropFilter: 'blur(8px)' },
    }),
  },

  /* 커버 히어로 */
  heroContainer: {
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 380,
  },
  heroBgClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  heroBgImage: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
  },
  heroBgColor: {
    ...StyleSheet.absoluteFillObject,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '28%',
    bottom: -100,
  },
  coverShadow: {
    width: 195,
    height: 282,
    borderRadius: radius.md,
    shadowColor: '#1A1D24',
    shadowOffset: { width: 2, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 24,
  },
  coverClip: {
    width: 195,
    height: 282,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  coverImg: { width: '100%', height: '100%' },

  /* 제목 블록 */
  titleBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.s5,
    paddingTop: 24,
    paddingBottom: 18,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 36,
    textAlign: 'center',
  },
  authorItalic: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  /* stat pills */
  statRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.s5,
    paddingBottom: 20,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.1,
  },

  /* section */
  sectionTitleWrap: { paddingHorizontal: spacing.s5, paddingBottom: 12 },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionPad: { paddingHorizontal: spacing.s5, paddingBottom: 24 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },

  /* 책 상태 */
  conditionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  conditionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  conditionLabelText: { fontSize: 13, fontWeight: '600', color: colors.text },
  meter: { flexDirection: 'row', gap: 3 },
  meterBar: { width: 14, height: 4, borderRadius: 2 },
  conditionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    letterSpacing: -0.1,
  },

  /* 보유자 */
  ownerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  ownerMeta: { flex: 1, minWidth: 0 },
  ownerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  ownerName: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  ownerHandle: { fontSize: 11, color: colors.textTertiary, fontFamily: 'monospace' },
  ownerBio: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  ownerStatsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 14,
    marginBottom: 14,
  },
  ownerStats: { flexDirection: 'row' },
  ownerStatItem: { flex: 1, alignItems: 'center' },
  ownerStatBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
  ownerStatValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ownerStatValue: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.1 },
  ownerStatLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  profileBtn: {
    marginTop: 14,
    height: 38,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  profileBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },

  /* 소개 */
  introBlock: {
    backgroundColor: colors.surface2,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 16,
    paddingLeft: 18,
  },
  introText: {
    fontSize: 14,
    lineHeight: 23,
    letterSpacing: -0.1,
    color: colors.text,
  },
  introAttrib: {
    marginTop: 10,
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  /* 다른 책 */
  otherBooksRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.s5,
    paddingBottom: 32,
  },
  otherBookCard: { width: 110, gap: 8 },
  otherCoverImg: { width: 110, height: 156, borderRadius: radius.sm },
  otherBookTitle: {
    fontSize: 12, fontWeight: '600', color: colors.text,
    letterSpacing: -0.1, lineHeight: 17,
  },
  otherBookAuthor: { fontSize: 11, color: colors.textSecondary },

  /* 하단 CTA */
  bottomCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.s4,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  likeBtn: {
    width: 52, height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  likeBtnActive: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
  },
  exchangeBtn: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  exchangeBtnDisabled: { backgroundColor: colors.borderStrong },
  exchangeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },

  /* 모달 */
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
    fontSize: 13, color: colors.textSecondary,
    paddingHorizontal: spacing.s4, paddingVertical: 12, lineHeight: 20,
  },
  modalBookTitle: { fontWeight: '700', color: colors.text },
  modalList: { paddingHorizontal: spacing.s4, paddingBottom: 20, gap: 10 },
  modalEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  emptyHint: { fontSize: 12, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: 40 },

  bookItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  bookItemSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  bookItemInfo: { flex: 1 },
  bookItemTitle: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },
  bookItemAuthor: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  modalFooter: {
    padding: spacing.s4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    height: 52, backgroundColor: colors.primary,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: colors.borderStrong },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
