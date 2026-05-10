import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  Pressable,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Svg, { Path, Circle } from 'react-native-svg';
import { booksApi } from '../../src/features/books/api';
import { exchangeApi } from '../../src/features/exchange/api';
import { profileApi } from '../../src/features/profile/api';
import { locationApi, LocationResult } from '../../src/features/locations/api';
import { CoverColor } from '../../src/features/books/types';
import { Exchange } from '../../src/features/exchange/types';
import { storage } from '../../src/lib/storage';
import { GENRES } from '../../src/constants';

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

// ─── Active exchange card ─────────────────────────────────────────────────────
function calcDaysLeft(dueDate: string | null): number | null {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

const ActiveExchangeCard = ({ exchange, onChat }: { exchange: Exchange; onChat?: () => void }) => {
  const daysLeft = calcDaysLeft(exchange.dueDate);
  const partner = exchange.respondent;
  return (
    <TouchableOpacity style={activeExSt.card} activeOpacity={0.85} onPress={onChat}>
      <View style={activeExSt.topRow}>
        <Text style={activeExSt.badge}>
          {exchange.status === 'FIRST_EXCHANGED' ? '반납 대기' : '교환 중'}
        </Text>
        {daysLeft != null && (
          <Text style={[activeExSt.dDay, daysLeft <= 3 && { color: '#EF4444' }]}>
            {daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-day' : '기한 초과'}
          </Text>
        )}
      </View>
      <Text style={activeExSt.partner}>{partner.nickname}님과 교환 중</Text>
      <View style={activeExSt.booksRow}>
        <Text style={activeExSt.bookTitle} numberOfLines={1}>
          {exchange.selectedBook?.title ?? '(대기 중)'}
        </Text>
        <Text style={activeExSt.arrow}>↔</Text>
        <Text style={activeExSt.bookTitle} numberOfLines={1}>
          {exchange.requestedBook.title}
        </Text>
      </View>
      {exchange.chatRoomId && (
        <View style={activeExSt.chatBtn}>
          <Text style={activeExSt.chatBtnText}>채팅 바로가기</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const activeExSt = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: 11, fontWeight: '700', color: C.primary, backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dDay: { fontSize: 13, fontWeight: '700', color: C.primary },
  partner: { fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  booksRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookTitle: { flex: 1, fontSize: 13, color: C.text2, letterSpacing: -0.2 },
  arrow: { fontSize: 14, color: C.text3, fontWeight: '700' },
  chatBtn: {
    marginTop: 4,
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chatBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});

const ShareIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="m16 6-4-4-4 4" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 2v13" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Near book card (image + title + location) ────────────────────────────────
const NearBookCard = ({
  title, author, imageUrl, color, neighborhood, ownerNickname, onPress,
}: {
  title: string; author: string; imageUrl: string | null;
  color: CoverColor; neighborhood: string | null; ownerNickname: string; onPress: () => void;
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
          <View style={nearCardSt.pinWrapper}>
            <PinIcon size={10} color={C.text3} />
          </View>
          <Text style={nearCardSt.locText} numberOfLines={1}>{(neighborhood ?? '위치 미설정').split(' · ')[0]} · {ownerNickname}</Text>
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
  locRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  pinWrapper: { marginTop: 2 },
  locText: { fontSize: 12, color: C.text3, flex: 1, lineHeight: 17 },
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
function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

// ─── Neighborhood bottom sheet ────────────────────────────────────────────────
const NeighborhoodSheet = ({
  visible, onClose, onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (loc: string) => void;
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try { setResults((await locationApi.search(query.trim())) ?? []); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query]);

  const handlePick = async (r: LocationResult) => {
    const label = r.district ? `${r.name} · ${r.district}` : r.name;
    try { await profileApi.updateMyProfile({ location: label }); } catch {}
    onSelect(label);
    setQuery('');
    setResults([]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={nbrSt.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={nbrSt.sheet}>
          <View style={nbrSt.handle} />
          <Text style={nbrSt.title}>동네 설정</Text>
          <Text style={nbrSt.subtitle}>내 주변 책을 보려면 동네를 설정해주세요</Text>
          <View style={nbrSt.searchRow}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={11} cy={11} r={7} stroke={C.text3} strokeWidth={2} />
              <Path d="m20 20-3.5-3.5" stroke={C.text3} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={nbrSt.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="동 이름으로 검색 (예: 망원동)"
              placeholderTextColor={C.text3}
              autoFocus
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color={C.primary} />}
          </View>
          {results.length > 0 && (
            <View style={nbrSt.resultList}>
              {results.map((r, i) => (
                <TouchableOpacity
                  key={`${r.fullAddress}-${i}`}
                  style={[nbrSt.resultItem, i > 0 && nbrSt.resultBorder]}
                  onPress={() => handlePick(r)}
                  activeOpacity={0.75}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx={12} cy={10} r={3} stroke={C.primary} strokeWidth={2} />
                  </Svg>
                  <View style={{ flex: 1 }}>
                    <Text style={nbrSt.resultName}>{r.name}</Text>
                    {r.district && <Text style={nbrSt.resultSub}>{r.district} · {r.city}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {!searching && query.trim().length > 0 && results.length === 0 && (
            <Text style={nbrSt.empty}>검색 결과가 없어요</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const nbrSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 12,
  },
  handle: { width: 40, height: 4, backgroundColor: C.line, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: C.text2, marginTop: -4 },
  searchRow: {
    height: 48, paddingHorizontal: 14, backgroundColor: C.bg,
    borderWidth: 1.5, borderColor: C.line, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  resultList: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.line,
    borderRadius: 12, overflow: 'hidden',
  },
  resultItem: { height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultBorder: { borderTopWidth: 1, borderTopColor: C.line },
  resultName: { fontSize: 14, fontWeight: '600', color: C.text },
  resultSub: { fontSize: 12, color: C.text3, marginTop: 1 },
  empty: { fontSize: 13, color: C.text3, textAlign: 'center', paddingVertical: 12 },
});

// ─── Genre bottom sheet ───────────────────────────────────────────────────────
const GenreBottomSheet = ({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: (genres: string[]) => void;
}) => {
  const [selected, setSelected] = useState(new Set<string>());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={genreSheetSt.overlay}>
        <View style={genreSheetSt.sheet}>
          <View style={genreSheetSt.handle} />
          <Text style={genreSheetSt.title}>취향에 맞는 책을 보여드릴게요</Text>
          <Text style={genreSheetSt.subtitle}>좋아하는 장르를 선택해주세요 (복수 선택 가능)</Text>

          <View style={genreSheetSt.grid}>
            {GENRES.map((g) => {
              const sel = selected.has(g.id);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => toggle(g.id)}
                  style={[genreSheetSt.tag, sel && genreSheetSt.tagSelected]}
                >
                  <Text style={[genreSheetSt.tagLabel, sel && genreSheetSt.tagLabelSelected]}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => onDone(Array.from(selected))}
            style={[genreSheetSt.doneBtn, selected.size === 0 && genreSheetSt.doneBtnDisabled]}
          >
            <Text style={genreSheetSt.doneBtnLabel}>완료</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const genreSheetSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    gap: 16,
  },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: '#6B7280', letterSpacing: -0.1, marginTop: -8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1A1A2E',
    backgroundColor: '#FFFFFF',
  },
  tagSelected: {
    backgroundColor: '#1A1A2E',
  },
  tagLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    letterSpacing: -0.2,
  },
  tagLabelSelected: {
    color: '#FFFFFF',
  },
  doneBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#4F86C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneBtnDisabled: { backgroundColor: '#C8D5E7' },
  doneBtnLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showGenreSheet, setShowGenreSheet] = useState(false);
  const [showNeighborhoodSheet, setShowNeighborhoodSheet] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.getMyProfile(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    storage.getGenrePending().then((pending) => {
      if (pending === 'true') setShowGenreSheet(true);
    });
  }, []);

  const handleGenreDone = useCallback(async (genres: string[]) => {
    try {
      if (genres.length > 0) {
        await profileApi.updateMyProfile({ tags: genres });
        queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      }
      await storage.clearGenrePending();
    } catch {}
    setShowGenreSheet(false);
  }, [queryClient]);

  const nickname = profileLoading ? '' : (profile?.nickname ?? '독자');
  const location = profile?.location ?? null;
  // "신장동 · 하남시" → "신장동"
  const neighborhoodName = location ? location.split(' · ')[0].trim() : null;

  const { data: nearBooks, isLoading: nearLoading } = useQuery({
    queryKey: ['books', 'near', neighborhoodName],
    queryFn: () => booksApi.getBooks({ sort: 'LATEST', size: 8, neighborhood: neighborhoodName ?? undefined }),
    enabled: !profileLoading,
  });

  const { data: recentBooks, isLoading: recentLoading } = useQuery({
    queryKey: ['books', 'recent'],
    queryFn: () => booksApi.getBooks({ sort: 'LATEST', page: 0, size: 5 }),
  });

  const { data: activeExchanges } = useQuery({
    queryKey: ['exchanges', 'active-home'],
    queryFn: () => exchangeApi.getMyExchanges(undefined, 0, 10),
    select: (data) => data.content.filter(
      (e) => e.status === 'ACCEPTED' || e.status === 'FIRST_EXCHANGED'
    ),
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
          {nickname ? (
            <Text style={s.greetText}>
              {'안녕하세요, '}
              <Text style={s.accent}>{nickname}</Text>
              {'님\n'}
              <Text style={s.accent}>오늘의 책</Text>
              {'을 만나보세요'}
            </Text>
          ) : (
            <View style={s.greetSkeleton} />
          )}
          {location && (
            <View style={s.locRow}>
              <PinIcon />
              <Text style={s.locText}>{location}</Text>
            </View>
          )}
        </View>

        {/* 진행 중인 교환독서 */}
        {activeExchanges && activeExchanges.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="진행 중인 교환독서" sub={`${activeExchanges.length}건 진행 중`} onMore={() => router.push('/(tabs)/swap' as any)} />
            {activeExchanges.slice(0, 1).map((ex) => (
              <ActiveExchangeCard
                key={ex.id}
                exchange={ex}
                onChat={ex.chatRoomId ? () => router.push(`/chat/${ex.chatRoomId}` as any) : undefined}
              />
            ))}
          </View>
        )}

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
          {!location && !profileLoading && (
            <TouchableOpacity
              style={s.locationBanner}
              onPress={() => setShowNeighborhoodSheet(true)}
              activeOpacity={0.8}
            >
              <PinIcon size={16} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.locationBannerTitle}>동네를 설정하세요</Text>
                <Text style={s.locationBannerSub}>내 주변 책을 보려면 동네 설정이 필요해요</Text>
              </View>
              <ChevronRight size={14} color={C.primary} />
            </TouchableOpacity>
          )}
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
                  neighborhood={b.neighborhood}
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

      {/* Share FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push('/shares/new')}
        activeOpacity={0.85}
      >
        <ShareIcon />
      </TouchableOpacity>

      <GenreBottomSheet visible={showGenreSheet} onDone={handleGenreDone} />

      <NeighborhoodSheet
        visible={showNeighborhoodSheet}
        onClose={() => setShowNeighborhoodSheet(false)}
        onSelect={() => {
          queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
          setShowNeighborhoodSheet(false);
        }}
      />
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
    height: 36,
    width: 128,
  },
  bell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greeting: { paddingHorizontal: 20, paddingTop: 4, gap: 8 },
  greetSkeleton: { height: 64, borderRadius: 8, backgroundColor: '#ECEEF2', width: '70%' },
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

  locationBanner: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#C7D5FA',
  },
  locationBannerTitle: { fontSize: 14, fontWeight: '700', color: C.primary, letterSpacing: -0.2 },
  locationBannerSub: { fontSize: 12, color: C.text2, marginTop: 2, letterSpacing: -0.1 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
