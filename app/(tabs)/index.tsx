import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, Circle } from 'react-native-svg';
import { booksApi } from '../../src/features/books/api';
import { CoverColor } from '../../src/features/books/types';
import { useAuthStore } from '../../src/store';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#1A1D24',
  text2: '#5C6270',
  text3: '#9097A3',
  line: '#ECEEF2',
  line2: '#F0F2F6',
  primary: '#4A6CF7',
} as const;

// ─── Cover palettes ───────────────────────────────────────────────────────────
const MINI_COVER: Record<CoverColor, { bg: string; fg: string }> = {
  blue:   { bg: '#2C3E6B', fg: '#FFFFFF' },
  orange: { bg: '#EFE4D0', fg: '#6B5230' },
  sage:   { bg: '#355238', fg: '#E8DDB0' },
  plum:   { bg: '#7A4F6A', fg: '#FFFFFF' },
  sand:   { bg: '#F4F1E8', fg: '#1A1D24' },
  ink:    { bg: '#3A3E59', fg: '#FFFFFF' },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const BellIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke={C.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke={C.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PinIcon = ({ size = 12, color = C.text2 }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={2} />
  </Svg>
);

const SearchIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={C.text3} strokeWidth={2} />
    <Path d="m20 20-3.5-3.5" stroke={C.text3} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ChevronRight = ({ size = 12, color = C.text2 }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="m9 6 6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Near book card (image + title + location) ────────────────────────────────
const NearBookCard = ({
  title, author, imageUrl, color, distance, ownerNickname, onPress,
}: {
  title: string; author: string; imageUrl: string | null;
  color: CoverColor; distance: number | null; ownerNickname: string; onPress: () => void;
}) => {
  const { bg, fg } = MINI_COVER[color] ?? MINI_COVER.blue;
  return (
    <TouchableOpacity style={nearCardSt.card} onPress={onPress} activeOpacity={0.85}>
      <View style={nearCardSt.imageArea}>
        {/* 그림자용 outer, overflow:hidden용 inner 분리 */}
        <View style={nearCardSt.bookShadow}>
          <View style={nearCardSt.bookInner}>
            {imageUrl
              ? <Image source={{ uri: imageUrl }} style={nearCardSt.bookImage} resizeMode="cover" />
              : <View style={[nearCardSt.bookPlaceholder, { backgroundColor: bg }]}>
                  <Text style={[nearCardSt.bookPTitle, { color: fg }]} numberOfLines={3}>{title}</Text>
                  <Text style={[nearCardSt.bookPAuthor, { color: fg }]} numberOfLines={2}>{author}</Text>
                </View>
            }
          </View>
        </View>
      </View>
      <View style={nearCardSt.meta}>
        <Text style={nearCardSt.title} numberOfLines={1}>{title}</Text>
        <Text style={nearCardSt.author} numberOfLines={1}>{author}</Text>
        <View style={nearCardSt.locRow}>
          <PinIcon size={10} color={C.text3} />
          <Text style={nearCardSt.locText}>{formatDist(distance)} · {ownerNickname}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const nearCardSt = StyleSheet.create({
  card: {
    width: 155,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  // 회색 배경 영역 (전체)
  imageArea: {
    height: 200,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: C.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 그림자 (overflow 없음)
  bookShadow: {
    width: 104,
    height: 155,
    borderRadius: 8,
    shadowColor: '#1A1D24',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  // 실제 클리핑
  bookInner: {
    width: 104,
    height: 155,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bookImage: { width: '100%', height: '100%' },
  // 이미지 없을 때 컬러 플레이스홀더
  bookPlaceholder: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  bookPTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, lineHeight: 21 },
  bookPAuthor: { fontSize: 11, opacity: 0.8, letterSpacing: -0.2 },
  meta: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 4 },
  title: { fontSize: 14, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  author: { fontSize: 12, color: C.text2, letterSpacing: -0.2, marginBottom: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 12, color: C.text3 },
});

// ─── Recent book cover (square image) ────────────────────────────────────────
const RecentCover = ({
  title, imageUrl, color,
}: {
  title: string; imageUrl: string | null; color: CoverColor;
}) => {
  const { bg, fg } = MINI_COVER[color] ?? MINI_COVER.blue;
  return imageUrl
    ? <Image source={{ uri: imageUrl }} style={recentCoverSt.img} resizeMode="cover" />
    : <View style={[recentCoverSt.placeholder, { backgroundColor: bg }]}>
        <Text style={[recentCoverSt.text, { color: fg }]} numberOfLines={4}>{title}</Text>
      </View>;
};

const recentCoverSt = StyleSheet.create({
  img: { width: 56, height: 80, borderRadius: 6, flexShrink: 0 },
  placeholder: {
    width: 56,
    height: 80,
    borderRadius: 6,
    flexShrink: 0,
    padding: 6,
    justifyContent: 'center',
  },
  text: { fontSize: 9, fontWeight: '700', lineHeight: 13, letterSpacing: -0.2, textAlign: 'center' },
});

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({
  title, sub, onMore,
}: {
  title: string; sub: string; onMore?: () => void;
}) => (
  <View style={secStyles.head}>
    <View style={secStyles.group}>
      <Text style={secStyles.title}>{title}</Text>
      <Text style={secStyles.sub}>{sub}</Text>
    </View>
    {onMore && (
      <TouchableOpacity style={secStyles.more} onPress={onMore} activeOpacity={0.7}>
        <Text style={secStyles.moreText}>전체보기</Text>
        <ChevronRight />
      </TouchableOpacity>
    )}
  </View>
);

const secStyles = StyleSheet.create({
  head: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  group: { gap: 3 },
  title: { fontSize: 16, fontFamily: 'NotoSerifKR_700Bold', letterSpacing: -0.3, color: C.text },
  sub: { fontSize: 12, color: C.text3, letterSpacing: -0.2 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreText: { fontSize: 12, color: C.text2, letterSpacing: -0.2 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDist(d: number | null): string {
  if (d == null) return '근처';
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const nickname = user?.nickname ?? '독자';

  const { data: nearBooks, isLoading: nearLoading } = useQuery({
    queryKey: ['books', 'near'],
    queryFn: () => booksApi.getBooks({ sort: 'LATEST', size: 8 }),
  });

  const { data: recentBooks, isLoading: recentLoading } = useQuery({
    queryKey: ['books', 'recent'],
    queryFn: () => booksApi.getBooks({ sort: 'LATEST', page: 0, size: 5 }),
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <Image source={require('../../assets/images/logo.png')} style={s.logo} resizeMode="contain" />
        <TouchableOpacity style={s.bell} onPress={() => router.push('/notifications')} activeOpacity={0.7}>
          <BellIcon />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Greeting */}
        <View style={s.greeting}>
          <Text style={s.greetText}>
            {'안녕하세요, '}
            <Text style={s.accent}>{nickname}</Text>
            {'님\n'}
            <Text style={s.accent}>오늘의 책</Text>
            {'을 만나보세요'}
          </Text>
          <View style={s.locRow}>
            <PinIcon />
            <Text style={s.locText}>망원동 · 반경 2km · 독자 184명</Text>
          </View>
        </View>

        {/* Search */}
        <TouchableOpacity
          style={s.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.75}
        >
          <SearchIcon />
          <Text style={s.searchPlaceholder}>읽고 싶은 책을 찾아보세요</Text>
        </TouchableOpacity>

        {/* Near books */}
        <View style={s.section}>
          <SectionHeader
            title="내 주변 교환 가능한 책"
            sub="2km 내 독자들이 내놓은 책"
            onMore={() => router.push('/search')}
          />
          {nearLoading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={C.primary} />
          ) : nearBooks?.content.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.nearRow}
            >
              {nearBooks.content.map((b) => (
                <NearBookCard
                  key={b.id}
                  title={b.title}
                  author={b.author}
                  imageUrl={b.imageUrl}
                  color={b.coverColor}
                  distance={b.distance}
                  ownerNickname={b.owner.nickname}
                  onPress={() => router.push(`/books/${b.id}`)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={s.emptyText}>근처에 등록된 도서가 없어요</Text>
          )}
        </View>

        {/* Recent books */}
        <View style={s.section}>
          <SectionHeader
            title="최근 등록된 책"
            sub="방금 책장에 올라온 따끈한 책들"
            onMore={() => router.push('/search')}
          />
          {recentLoading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={C.primary} />
          ) : recentBooks?.content.length ? (
            <View style={s.listCard}>
              {recentBooks.content.map((b, i) => (
                <TouchableOpacity
                  key={b.id}
                  style={[s.listRow, i > 0 && s.listRowBorder]}
                  onPress={() => router.push(`/books/${b.id}`)}
                  activeOpacity={0.75}
                >
                  <RecentCover title={b.title} imageUrl={b.imageUrl} color={b.coverColor} />
                  <View style={s.rowInfo}>
                    <Text style={s.rowTitle} numberOfLines={1}>{b.title}</Text>
                    <Text style={s.rowAuthor} numberOfLines={1}>{b.author}</Text>
                    <Text style={s.rowHandle} numberOfLines={1}>@{b.owner.nickname}</Text>
                    <Text style={s.rowTime}>{formatTime(b.createdAt)}</Text>
                  </View>
                  <ChevronRight size={14} color={C.text3} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={s.emptyText}>아직 등록된 도서가 없어요</Text>
          )}
        </View>

        {/* Quote */}
        <View style={s.quoteCard}>
          <Text style={s.quoteText}>"한 권의 책은 한 사람의 세계입니다."</Text>
          <Text style={s.quoteAuthor}>— 오늘의 한 줄</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: C.bg,
  },
  logo: {
    height: 24,
    width: 120,
  },
  bell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greeting: { paddingHorizontal: 20, paddingTop: 4, gap: 8 },
  greetText: {
    fontSize: 22,
    fontFamily: 'NotoSerifKR_700Bold',
    lineHeight: 32,
    letterSpacing: -0.3,
    color: C.text,
  },
  accent: { color: C.primary, fontFamily: 'NotoSerifKR_700Bold' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 12, color: C.text2, letterSpacing: -0.2 },

  searchBar: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: C.card,
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  searchPlaceholder: { fontSize: 14, color: C.text3 },

  section: { marginTop: 24, gap: 14 },

  nearRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 4 },

  listCard: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listRowBorder: { borderTopWidth: 1, borderTopColor: C.line2 },
  rowInfo: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: C.text, letterSpacing: -0.3 },
  rowAuthor: { fontSize: 12, color: C.text2, letterSpacing: -0.2, marginBottom: 2 },
  rowHandle: { fontSize: 12, color: C.text3 },
  rowTime: { fontSize: 11, color: C.text3 },

  quoteCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    padding: 22,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: C.text2,
    lineHeight: 20,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  quoteAuthor: { marginTop: 8, fontSize: 11, color: C.text3, letterSpacing: -0.2 },

  emptyText: { fontSize: 13, color: C.text3, paddingHorizontal: 20, paddingVertical: 8 },
});
