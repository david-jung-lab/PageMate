import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius, fontSize } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMBookCard from '../../src/components/ui/PMBookCard';
import PMBookCover from '../../src/components/ui/PMBookCover';
import PMBadge from '../../src/components/ui/PMBadge';
import { booksApi } from '../../src/features/books/api';
import { BookSummary } from '../../src/features/books/types';
import { STATUS_LABELS } from '../../src/constants';

/* ---------- TopBar ---------- */

const TopBar = () => (
  <View style={styles.topBar}>
    <Text style={styles.logo}>PageMate</Text>
    <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
      <PMIcon name="bell" size={20} color={colors.text} />
    </TouchableOpacity>
  </View>
);

/* ---------- NearBookCard (horizontal scroll용 compact 카드) ---------- */

interface NearBookCardProps {
  book: BookSummary;
  onPress: () => void;
}

const NearBookCard: React.FC<NearBookCardProps> = ({ book, onPress }) => (
  <TouchableOpacity style={styles.nearCard} onPress={onPress} activeOpacity={0.8}>
    <PMBookCover
      title={book.title}
      author={book.author}
      color={book.coverColor}
      width={108}
      height={154}
    />
    <View style={styles.nearBadge}>
      {book.distance != null && (
        <PMBadge variant="solid" size="sm">
          {book.distance < 1
            ? `${Math.round(book.distance * 1000)}m`
            : `${book.distance.toFixed(1)}km`}
        </PMBadge>
      )}
    </View>
    <Text style={styles.nearTitle} numberOfLines={2}>{book.title}</Text>
    <Text style={styles.nearAuthor} numberOfLines={1}>{book.author}</Text>
  </TouchableOpacity>
);

/* ---------- SectionHeader ---------- */

interface SectionHeaderProps {
  title: string;
  onMore?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onMore }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onMore && (
      <TouchableOpacity style={styles.sectionMore} onPress={onMore} activeOpacity={0.7}>
        <Text style={styles.sectionMoreText}>전체보기</Text>
        <PMIcon name="chevronRight" size={14} color={colors.primary} />
      </TouchableOpacity>
    )}
  </View>
);

/* ---------- HomeScreen ---------- */

export default function HomeScreen() {
  const router = useRouter();

  const { data: nearBooks, isLoading: nearLoading } = useQuery({
    queryKey: ['books', 'near'],
    queryFn: () => booksApi.getBooks({ sort: 'LATEST', size: 10 }),
  });

  const { data: recentBooks, isLoading: recentLoading } = useQuery({
    queryKey: ['books', 'recent'],
    queryFn: () => booksApi.getBooks({ sort: 'LATEST', page: 0, size: 20 }),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.screen}>
        <TopBar />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 배너 */}
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{'당신의 다음 페이지를\n찾아보세요'}</Text>
            <TouchableOpacity
              style={styles.bannerBtn}
              onPress={() => router.push('/books/new')}
              activeOpacity={0.85}
            >
              <PMIcon name="plus" size={15} color="#fff" />
              <Text style={styles.bannerBtnText}>책 등록하기</Text>
            </TouchableOpacity>
          </View>

          {/* 근처 도서 */}
          <SectionHeader title="근처 도서" onMore={() => router.push('/search')} />
          {nearLoading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={colors.primary} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nearRow}
            >
              {nearBooks?.content.map((b) => (
                <NearBookCard
                  key={b.id}
                  book={b}
                  onPress={() => router.push(`/books/${b.id}`)}
                />
              ))}
              {!nearBooks?.content.length && (
                <Text style={styles.emptyText}>등록된 도서가 없어요</Text>
              )}
            </ScrollView>
          )}

          {/* 최근 등록 */}
          <SectionHeader title="최근 등록" onMore={() => router.push('/search')} />
          {recentLoading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={colors.primary} />
          ) : (
            <View style={styles.recentList}>
              {recentBooks?.content.map((b) => (
                <PMBookCard
                  key={b.id}
                  book={b}
                  onPress={() => router.push(`/books/${b.id}`)}
                />
              ))}
              {!recentBooks?.content.length && (
                <View style={styles.emptyCard}>
                  <PMIcon name="book" size={32} color={colors.borderStrong} />
                  <Text style={styles.emptyText}>아직 등록된 도서가 없어요</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.s4,
    paddingVertical: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.primary,
    fontStyle: 'italic',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  banner: {
    marginHorizontal: spacing.s4,
    marginBottom: spacing.s6,
    padding: 20,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    gap: 16,
  },
  bannerTitle: {
    fontSize: fontSize.h3,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
  },
  bannerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.s5,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  sectionMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  nearRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.s4,
    paddingBottom: 28,
  },
  nearCard: {
    width: 108,
  },
  nearBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  nearTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
    lineHeight: 16,
    marginTop: 8,
  },
  nearAuthor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  recentList: {
    paddingHorizontal: spacing.s4,
    gap: 10,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    paddingHorizontal: spacing.s4,
  },
});
