import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { storage } from '../src/lib/storage';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { bookCoverPalettes } from '../src/theme/tokens';

const SAFE_TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight ?? 24) + 4;

// ── Design tokens ────────────────────────────────────────────────────────────
const INK     = '#1A1A2E';
const BG      = '#FAFAF8';
const PRIMARY = '#4F86C6';
const ORANGE  = '#F4A261';
const WHITE   = '#FFFFFF';
const FONT    = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// ── Logo metrics ─────────────────────────────────────────────────────────────
const LOGO_PX      = 36;
const SPLASH_SCALE = 1.78;
const AGE_W        = 72;
const ATE_W        = 68;
const EXPAND_H     = LOGO_PX * 1.5;

// ── Timing (ms) ──────────────────────────────────────────────────────────────
const FADE_IN    = 400;
const HOLD_PM    = 500;
const EXPAND     = 800;
const HOLD_FULL  = 600;
const TRANSITION = 800;

const EASE_IN_OUT = Easing.inOut(Easing.ease);
const EASE_OUT    = Easing.out(Easing.ease);

// ── Mock book data ────────────────────────────────────────────────────────────
const NEAR_BOOKS = [
  { id: 1, title: '채식주의자',    author: '한강',   color: 'plum', condition: '상', dist: '0.3km', owner: '책사랑' },
  { id: 2, title: '82년생 김지영', author: '조남주', color: 'sage', condition: '중', dist: '0.8km', owner: '독서광' },
  { id: 3, title: '아몬드',        author: '손원평', color: 'blue', condition: '상', dist: '1.2km', owner: '책여행' },
  { id: 4, title: '파친코',        author: '이민진', color: 'sand', condition: '하', dist: '1.5km', owner: '책벌레' },
] as const;

// ── Inline SVG icons ──────────────────────────────────────────────────────────
function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function PinIcon() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill={PRIMARY}>
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={8} stroke="#9CA3AF" strokeWidth={1.8} />
      <Path d="m21 21-4.35-4.35" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

// ── Tab bar icons ─────────────────────────────────────────────────────────────
function HomeIcon({ active }: { active: boolean }) {
  const c = active ? PRIMARY : '#9CA3AF';
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchTabIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={8} stroke="#9CA3AF" strokeWidth={1.8} />
      <Path d="m21 21-4.35-4.35" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function SwapIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M7 16V4m0 0L3 8m4-4 4 4" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 8v12m0 0 4-4m-4 4-4-4" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChatIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProfileIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke="#9CA3AF" strokeWidth={1.8} />
      <Path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

// ── Mock near book card ───────────────────────────────────────────────────────
function MockCard({
  book,
  anim,
}: {
  book: typeof NEAR_BOOKS[number];
  anim: { opacity: Animated.Value; translateX: Animated.Value };
}) {
  const palette = bookCoverPalettes[book.color as keyof typeof bookCoverPalettes] ?? bookCoverPalettes.sage;
  const cond =
    book.condition === '상'
      ? { text: '#4F9D7A', bg: '#E6F1EB' }
      : book.condition === '중'
      ? { text: '#D9A441', bg: '#FBF3E0' }
      : { text: '#C8553D', bg: '#F7E4DF' };

  return (
    <Animated.View
      style={[styles.nearCard, { opacity: anim.opacity, transform: [{ translateX: anim.translateX }] }]}
    >
      <LinearGradient colors={palette} start={{ x: 0.15, y: 0.15 }} end={{ x: 1, y: 1 }} style={styles.coverGrad}>
        <View style={styles.coverSpine} />
        <View style={[styles.condBadge, { backgroundColor: cond.bg }]}>
          <Text style={[styles.condText, { color: cond.text }]}>{book.condition}</Text>
        </View>
        <View>
          <Text style={styles.coverTitle} numberOfLines={3}>{book.title}</Text>
          <Text style={styles.coverAuthor} numberOfLines={1}>{book.author}</Text>
        </View>
      </LinearGradient>
      <Text style={styles.cardDist}>{book.dist}</Text>
      <Text style={styles.cardOwner}>{book.owner}</Text>
    </Animated.View>
  );
}

// ── Mock tab bar ──────────────────────────────────────────────────────────────
function MockTabBar() {
  return (
    <View style={styles.tabBar}>
      {([
        { label: '홈',    Icon: () => <HomeIcon active /> },
        { label: '검색',  Icon: SearchTabIcon },
        { label: '교환',  Icon: SwapIcon },
        { label: '채팅',  Icon: ChatIcon },
        { label: '프로필', Icon: ProfileIcon },
      ] as const).map(({ label, Icon }, i) => (
        <View key={label} style={styles.tabItem}>
          <Icon />
          <Text style={[styles.tabLabel, i === 0 && styles.tabLabelActive]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SplashScreen() {
  // background (JS driver — interpolated color)
  const bgAnim = useRef(new Animated.Value(0)).current;

  // logo (native driver)
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(SPLASH_SCALE)).current;

  // expanding letter containers (JS driver — layout width)
  const ageWidth = useRef(new Animated.Value(0)).current;
  const ateWidth = useRef(new Animated.Value(0)).current;

  // expanding letter text (native driver — opacity)
  const ageOpacity = useRef(new Animated.Value(0)).current;
  const ateOpacity = useRef(new Animated.Value(0)).current;

  // home content wrapper (native driver)
  const homeOpacity = useRef(new Animated.Value(0)).current;

  // 5 sections: header / greeting / search / near-header / recent-header
  const sectionAnims = useRef(
    Array.from({ length: 5 }, () => ({
      opacity:    new Animated.Value(0),
      translateY: new Animated.Value(16),
    }))
  ).current;

  // 4 book cards (native driver)
  const cardAnims = useRef(
    NEAR_BOOKS.map(() => ({
      opacity:    new Animated.Value(0),
      translateX: new Animated.Value(-28),
    }))
  ).current;

  useEffect(() => {
    let mounted = true;
    let anim: Animated.CompositeAnimation | null = null;

    (async () => {
      const token = await storage.getAccessToken();
      if (!mounted) return;

      if (!token) {
        // 비로그인 → 로그인 화면 (자체 스플래시 보유)
        router.replace('/(auth)/login');
        return;
      }

      anim = Animated.sequence([
        // ① "Pm." fade in
        Animated.timing(logoOpacity, {
          toValue: 1, duration: FADE_IN,
          easing: EASE_OUT, useNativeDriver: true,
        }),
        // ② Hold
        Animated.delay(HOLD_PM),
        // ③ Expand → "PageMate."
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1, duration: EXPAND,
            easing: EASE_IN_OUT, useNativeDriver: true,
          }),
          Animated.timing(ageWidth, {
            toValue: AGE_W, duration: EXPAND,
            easing: EASE_IN_OUT, useNativeDriver: false,
          }),
          Animated.timing(ateWidth, {
            toValue: ATE_W, duration: EXPAND,
            easing: EASE_IN_OUT, useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.delay(120),
            Animated.timing(ageOpacity, {
              toValue: 1, duration: EXPAND - 120,
              easing: EASE_OUT, useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(120),
            Animated.timing(ateOpacity, {
              toValue: 1, duration: EXPAND - 120,
              easing: EASE_OUT, useNativeDriver: true,
            }),
          ]),
        ]),
        // ④ Hold "PageMate."
        Animated.delay(HOLD_FULL),
        // ⑤ 홈 전환
        Animated.parallel([
          // 배경색 INK → BG (JS driver)
          Animated.timing(bgAnim, {
            toValue: 1, duration: TRANSITION,
            easing: EASE_IN_OUT, useNativeDriver: false,
          }),
          // 로고 페이드아웃
          Animated.timing(logoOpacity, {
            toValue: 0, duration: 400,
            easing: EASE_OUT, useNativeDriver: true,
          }),
          // 홈 콘텐츠 페이드인 (150ms 딜레이)
          Animated.sequence([
            Animated.delay(150),
            Animated.timing(homeOpacity, {
              toValue: 1, duration: 500,
              easing: EASE_OUT, useNativeDriver: true,
            }),
          ]),
          // 섹션 순차 등장 (100ms 간격)
          ...sectionAnims.map((s, i) =>
            Animated.sequence([
              Animated.delay(i * 100),
              Animated.parallel([
                Animated.timing(s.opacity, {
                  toValue: 1, duration: 300,
                  easing: EASE_OUT, useNativeDriver: true,
                }),
                Animated.timing(s.translateY, {
                  toValue: 0, duration: 350,
                  easing: EASE_OUT, useNativeDriver: true,
                }),
              ]),
            ])
          ),
          // 카드 슬라이드인: near-header 등장(300ms) 이후 순차 (80ms 간격)
          ...cardAnims.map((c, i) =>
            Animated.sequence([
              Animated.delay(420 + i * 80),
              Animated.parallel([
                Animated.timing(c.opacity, {
                  toValue: 1, duration: 280,
                  easing: EASE_OUT, useNativeDriver: true,
                }),
                Animated.timing(c.translateX, {
                  toValue: 0, duration: 300,
                  easing: EASE_OUT, useNativeDriver: true,
                }),
              ]),
            ])
          ),
        ]),
      ]);

      anim.start(({ finished }) => {
        if (finished && mounted) router.replace('/(tabs)');
      });
    })();

    return () => {
      mounted = false;
      anim?.stop();
    };
  }, []);

  const bgColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [INK, BG] });
  const sa = sectionAnims;

  return (
    <Animated.View style={[styles.root, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={INK} />

      {/* ── Logo layer ──────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.logoLayer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoRow}>
          <Text style={[styles.logoText, { color: WHITE }]}>P</Text>
          <Animated.View style={[styles.expand, { width: ageWidth }]}>
            <Animated.Text style={[styles.logoText, { color: WHITE, opacity: ageOpacity }]}>
              age
            </Animated.Text>
          </Animated.View>
          <Text style={[styles.logoText, { color: PRIMARY }]}>M</Text>
          <Animated.View style={[styles.expand, { width: ateWidth }]}>
            <Animated.Text style={[styles.logoText, { color: PRIMARY, opacity: ateOpacity }]}>
              ate
            </Animated.Text>
          </Animated.View>
          <Text style={[styles.logoText, { color: ORANGE }]}>.</Text>
        </View>
      </Animated.View>

      {/* ── Home preview layer ───────────────────────────────────────────── */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: homeOpacity }]}>

        {/* 헤더 */}
        <Animated.View
          style={[
            styles.topBar,
            { opacity: sa[0].opacity, transform: [{ translateY: sa[0].translateY }] },
          ]}
        >
          <Text style={styles.headerLogo}>PageMate</Text>
          <View style={styles.bellWrap}>
            <BellIcon />
            <View style={styles.notifDot} />
          </View>
        </Animated.View>

        {/* 인사말 */}
        <Animated.View
          style={[
            styles.greetWrap,
            { opacity: sa[1].opacity, transform: [{ translateY: sa[1].translateY }] },
          ]}
        >
          <Text style={styles.greetMain}>안녕하세요, 민지님</Text>
          <Text style={styles.greetSub}>
            <Text style={{ color: PRIMARY }}>오늘의 책</Text>
            {'을 만나보세요'}
          </Text>
          <View style={styles.locRow}>
            <PinIcon />
            <Text style={styles.locText}>망원동 · 반경 2km · 독자 184명</Text>
          </View>
        </Animated.View>

        {/* 검색바 */}
        <Animated.View
          style={[
            styles.searchWrap,
            { opacity: sa[2].opacity, transform: [{ translateY: sa[2].translateY }] },
          ]}
        >
          <View style={styles.searchBar}>
            <SearchIcon />
            <Text style={styles.searchHint}>읽고 싶은 책을 찾아보세요</Text>
          </View>
        </Animated.View>

        {/* 내 주변 교환 가능한 책 헤더 */}
        <Animated.View
          style={[
            styles.sectionHead,
            { opacity: sa[3].opacity, transform: [{ translateY: sa[3].translateY }] },
          ]}
        >
          <Text style={styles.sectionTitle}>내 주변 교환 가능한 책</Text>
          <Text style={styles.sectionMore}>전체보기</Text>
        </Animated.View>

        {/* 책 카드 (좌→우 슬라이드인) */}
        <View style={styles.cardsRow}>
          {NEAR_BOOKS.map((book, i) => (
            <MockCard key={book.id} book={book} anim={cardAnims[i]} />
          ))}
        </View>

        {/* 최근 등록된 책 헤더 */}
        <Animated.View
          style={[
            styles.sectionHead,
            { opacity: sa[4].opacity, transform: [{ translateY: sa[4].translateY }] },
          ]}
        >
          <Text style={styles.sectionTitle}>최근 등록된 책</Text>
          <Text style={styles.sectionMore}>전체보기</Text>
        </Animated.View>

        {/* 하단 탭바 */}
        <MockTabBar />
      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Logo ─────────────────────────────────────────────────────────────────
  logoLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontFamily: FONT,
    fontWeight: '700',
    fontSize: LOGO_PX,
    letterSpacing: -1,
    lineHeight: LOGO_PX * 1.35,
  },
  expand: {
    overflow: 'hidden',
    height: EXPAND_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  // ── Header ───────────────────────────────────────────────────────────────
  topBar: {
    paddingTop: SAFE_TOP,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BG,
  },
  headerLogo: {
    fontFamily: FONT,
    fontStyle: 'italic',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.5,
    color: PRIMARY,
  },
  bellWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ORANGE,
    borderWidth: 1.5,
    borderColor: BG,
  },

  // ── Greeting ─────────────────────────────────────────────────────────────
  greetWrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    backgroundColor: BG,
    gap: 4,
  },
  greetMain: {
    fontFamily: FONT,
    fontWeight: '700',
    fontSize: 20,
    color: INK,
    letterSpacing: -0.4,
  },
  greetSub: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locText: {
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: -0.1,
  },

  // ── Search ───────────────────────────────────────────────────────────────
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: BG,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchHint: {
    fontSize: 14,
    color: '#9CA3AF',
    letterSpacing: -0.2,
  },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: BG,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.3,
  },
  sectionMore: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
  },

  // ── Book cards ────────────────────────────────────────────────────────────
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: BG,
    overflow: 'hidden',
  },
  nearCard: {
    width: 100,
  },
  coverGrad: {
    width: 100,
    height: 148,
    borderRadius: 6,
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: INK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  coverSpine: {
    position: 'absolute',
    left: 5,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  condBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  condText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  coverTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: WHITE,
    lineHeight: 15,
    letterSpacing: -0.1,
  },
  coverAuthor: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginTop: 3,
  },
  cardDist: {
    fontSize: 11,
    fontWeight: '600',
    color: PRIMARY,
    marginTop: 7,
  },
  cardOwner: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingBottom: 16,
    shadowColor: INK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: PRIMARY,
    fontWeight: '700',
  },
});
