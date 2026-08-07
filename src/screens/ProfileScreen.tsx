import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, Modal, TextInput,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView, Switch,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import { colors, radius, spacing, fontSize } from '../theme/tokens';
import PMIcon from '../components/ui/PMIcon';
import PMBadge from '../components/ui/PMBadge';
import PMAvatar from '../components/ui/PMAvatar';
import PMBookCover from '../components/ui/PMBookCover';
import { profileApi } from '../features/profile/api';
import { Profile } from '../features/profile/types';
import { BookSummary } from '../features/books/types';
import { exchangeApi } from '../features/exchange/api';
import { Exchange } from '../features/exchange/types';
import { authApi } from '../features/auth/api';
import { useAuthStore } from '../store';
import { locationApi, LocationResult } from '../features/locations/api';
import { GENRE_LABELS } from '../constants';

type AvatarColor = 'blue' | 'orange' | 'sage' | 'plum' | 'sand' | 'ink';
type BadgeVariant = 'success' | 'primary' | 'default';

const statusVariant = (s: string): BadgeVariant => {
  if (s === 'AVAILABLE') return 'success';
  if (s === 'IN_PROGRESS') return 'primary';
  return 'default';
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: '교환가능', IN_PROGRESS: '교환중', COMPLETED: '교환완료',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------- FilledStar ---------- */
const FilledStar: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
      fill="#F4A261"
      stroke="#F4A261"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </Svg>
);

/* ---------- TopBar ---------- */
const TopBar: React.FC = () => (
  <View style={styles.topBar}>
    <Text style={styles.topBarTitle}>마이</Text>
    <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}
      onPress={() => router.push('/profile/edit')}>
      <PMIcon name="settings" size={20} color={colors.text} />
    </TouchableOpacity>
  </View>
);

/* ---------- ProfileCard ---------- */
interface ProfileCardProps { profile: Profile }

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const color = (profile.avatarColor ?? 'blue') as AvatarColor;

  return (
    <View style={styles.profileCard}>
      <View style={styles.profileCenter}>
        <PMAvatar name={profile.nickname ?? '?'} color={color} size={96} />

        <Text style={styles.profileName}>{profile.nickname}</Text>

        {profile.bio ? (
          <Text style={styles.profileBio}>{profile.bio}</Text>
        ) : null}

        {profile.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {profile.tags.map((t) => (
              <PMBadge key={t} variant="primary" size="sm">
                {GENRE_LABELS[t] ?? t}
              </PMBadge>
            ))}
          </View>
        )}

        <View style={styles.locationRow}>
          <PMIcon name="location" size={13} color={colors.textSecondary} />
          <Text style={styles.locationText}>
            {profile.location ?? '동네 미설정'}
          </Text>
        </View>
      </View>

      {/* 통계 - 설계서: 프로필 카드 하단 */}
      <View style={styles.profileStatsDivider} />
      <View style={styles.profileStats}>
        <View style={styles.statItem}>
          <View style={styles.ratingRow}>
            <FilledStar size={15} />
            <Text style={styles.statValue}>{profile.averageRating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({profile.reviewCount})</Text>
          </View>
          <Text style={styles.statLabel}>별점</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile.bookCount}</Text>
          <Text style={styles.statLabel}>등록한 책</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile.exchangeCount}회</Text>
          <Text style={styles.statLabel}>교환독서 완료</Text>
        </View>
      </View>
    </View>
  );
};

/* ---------- SectionHeader ---------- */
interface SectionHeaderProps { title: string }

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

/* ---------- AddBookTile ---------- */
const AddBookTile: React.FC = () => (
  <TouchableOpacity
    style={styles.addBookTile}
    activeOpacity={0.7}
    onPress={() => router.push('/books/new')}
  >
    <PMIcon name="plus" size={28} color={colors.primary} />
    <Text style={styles.addBookTileText}>도서 추가</Text>
  </TouchableOpacity>
);

/* ---------- MyBookCard ---------- */
interface MyBookCardProps { book: BookSummary }

const MyBookCard: React.FC<MyBookCardProps> = ({ book }) => (
  <TouchableOpacity style={styles.myBookCard} activeOpacity={0.8}
    onPress={() => router.push(`/books/${book.id}`)}>
    <View>
      {book.imageUrl
        ? <Image source={{ uri: book.imageUrl }} style={styles.myBookCover} resizeMode="cover" />
        : <PMBookCover title={book.title} author={book.author} color={book.coverColor} width={104} height={148} />
      }
      <View style={styles.myBookBadge}>
        <PMBadge variant={statusVariant(book.status)} size="sm">
          {STATUS_LABEL[book.status] ?? book.status}
        </PMBadge>
      </View>
    </View>
    <Text style={styles.myBookTitle} numberOfLines={2}>{book.title}</Text>
    <Text style={styles.myBookAuthor} numberOfLines={1}>{book.author}</Text>
  </TouchableOpacity>
);

/* ---------- ExchangeHistoryItem ---------- */
const ExchangeHistoryItem: React.FC<{ exchange: Exchange; myProfileId: number; isLast?: boolean }> = ({
  exchange, myProfileId, isLast,
}) => {
  const isRequester = exchange.requester.id === myProfileId;
  const partner = isRequester ? exchange.respondent : exchange.requester;
  const partnerBook = isRequester ? exchange.requestedBook : exchange.selectedBook;

  return (
    <View style={[styles.historyItem, !isLast && styles.historyItemBorder]}>
      <View style={styles.historyRow}>
        <Text style={styles.historyTitle} numberOfLines={1}>
          {partner.nickname}님 · {partnerBook?.title ?? '책 정보 없음'}
        </Text>
        <Text style={styles.historyDate}>{formatDate(exchange.createdAt)}</Text>
      </View>
    </View>
  );
};

/* ---------- SettingsRow ---------- */
interface SettingsRowProps {
  title: string;
  subtitle?: string;
  danger?: boolean;
  isLast?: boolean;
  onPress?: () => void;
  hideArrow?: boolean;
  rightElement?: React.ReactNode;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ title, subtitle, danger, isLast, onPress, hideArrow, rightElement }) => (
  <TouchableOpacity
    style={[styles.settingsItem, !isLast && styles.settingsItemBorder]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress && !!rightElement}
  >
    <View style={styles.settingsMeta}>
      <Text style={[styles.settingsTitle, danger && { color: colors.danger }]}>{title}</Text>
      {subtitle ? <Text style={styles.settingsSubtitle}>{subtitle}</Text> : null}
    </View>
    {rightElement ?? (!hideArrow && <PMIcon name="chevronRight" size={16} color={colors.textTertiary} />)}
  </TouchableOpacity>
);

/* ---------- NeighborhoodSheet ---------- */
const NeighborhoodSheet: React.FC<{
  visible: boolean;
  current: string | null;
  onClose: () => void;
  onSave: (loc: string) => void;
}> = ({ visible, current, onClose, onSave }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try { setResults((await locationApi.search(query.trim())) ?? []); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handlePick = async (r: LocationResult) => {
    const label = r.district ? `${r.name} · ${r.district}` : r.name;
    setSaving(true);
    try {
      await profileApi.updateMyProfile({ location: label });
      onSave(label);
      setQuery(''); setResults([]);
    } catch { Alert.alert('오류', '동네 저장에 실패했어요.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={nbrStyles.overlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={nbrStyles.sheet}>
          <View style={nbrStyles.handle} />
          <Text style={nbrStyles.title}>동네를 설정해주세요</Text>
          {current && (
            <View style={nbrStyles.currentRow}>
              <PMIcon name="location" size={13} color={colors.primary} />
              <Text style={nbrStyles.currentText}>현재: {current}</Text>
            </View>
          )}
          <View style={nbrStyles.searchRow}>
            <PMIcon name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={nbrStyles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="동 이름으로 검색"
              placeholderTextColor={colors.textTertiary}
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          {results.length > 0 && (
            <View style={nbrStyles.resultList}>
              {results.map((r, i) => (
                <TouchableOpacity
                  key={`${r.fullAddress}-${i}`}
                  style={[nbrStyles.resultItem, i > 0 && nbrStyles.resultBorder]}
                  onPress={() => !saving && handlePick(r)}
                  activeOpacity={0.75}
                >
                  <PMIcon name="location" size={14} color={colors.textTertiary} />
                  <View style={{ flex: 1 }}>
                    <Text style={nbrStyles.resultName}>{r.name}</Text>
                    {r.district && <Text style={nbrStyles.resultSub}>{r.district} · {r.city}</Text>}
                  </View>
                  {saving && <ActivityIndicator size="small" color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const nbrStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 14,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currentText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  searchRow: {
    height: 48, paddingHorizontal: 14, backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  resultList: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  resultItem: { height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  resultName: { fontSize: 14, fontWeight: '600', color: colors.text },
  resultSub: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
});

/* ---------- ProfileScreen ---------- */
const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [completedExchanges, setCompletedExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [neighborhoodVisible, setNeighborhoodVisible] = useState(false);
  const [pushSaving, setPushSaving] = useState(false);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // 알림(푸시) on/off — 낙관적 업데이트, 실패 시 롤백
  const handleTogglePush = async (next: boolean) => {
    if (!profile || pushSaving) return;
    setPushSaving(true);
    setProfile({ ...profile, pushEnabled: next });
    try {
      await profileApi.updateNotificationSetting(next);
    } catch {
      setProfile((p) => (p ? { ...p, pushEnabled: !next } : p));
      Alert.alert('알림 설정 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setPushSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* 무시 */ }
    await clearAuth();
    router.replace('/(auth)/login');
  };

  // 되돌릴 수 없는 작업이므로 2단계로 확인받는다
  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '계정과 프로필 정보가 삭제되고, 진행 중인 대여는 모두 취소됩니다.\n삭제된 계정은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '계속',
          style: 'destructive',
          onPress: () => Alert.alert(
            '정말 탈퇴하시겠어요?',
            '이 작업은 되돌릴 수 없습니다.',
            [
              { text: '취소', style: 'cancel' },
              { text: '탈퇴하기', style: 'destructive', onPress: deleteAccount },
            ],
          ),
        },
      ],
    );
  };

  const deleteAccount = async () => {
    try {
      await profileApi.deleteAccount();
      await clearAuth();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('탈퇴 실패', '잠시 후 다시 시도해주세요.');
    }
  };

  const load = useCallback(async () => {
    try {
      const [p, b, ex] = await Promise.all([
        profileApi.getMyProfile(),
        profileApi.getMyBooks(0, 10).catch(() => ({ content: [] as BookSummary[] })),
        exchangeApi.getMyExchanges('COMPLETED', 0, 5).catch(() => ({ content: [] as Exchange[] })),
      ]);
      setProfile(p);
      setBooks(b.content);
      setCompletedExchanges(ex.content);
    } catch {
      // 비로그인 상태면 무시
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.screen}>
        <TopBar />

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>

            {/* 프로필 카드 (통계 포함) */}
            {profile && (
              <ProfileCard profile={profile} />
            )}

            {/* 내 도서 목록 */}
            <SectionHeader title="내 도서 목록" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.booksRow}>
              <AddBookTile />
              {books.map((b) => <MyBookCard key={b.id} book={b} />)}
            </ScrollView>

            {/* 교환독서 이력 */}
            {completedExchanges.length > 0 && profile && (
              <>
                <SectionHeader title="교환독서 이력" />
                <View style={styles.historyCard}>
                  {completedExchanges.map((ex, i) => (
                    <ExchangeHistoryItem
                      key={ex.id}
                      exchange={ex}
                      myProfileId={profile.id}
                      isLast={i === completedExchanges.length - 1}
                    />
                  ))}
                </View>
              </>
            )}

            {/* 설정 */}
            <SectionHeader title="설정" />
            <View style={styles.settingsCard}>
              <SettingsRow
                title="프로필 편집"
                onPress={() => router.push('/profile/edit')}
              />
              <SettingsRow
                title="동네 설정"
                subtitle={profile?.location ?? '동네를 설정해주세요'}
                onPress={() => setNeighborhoodVisible(true)}
              />
              <SettingsRow
                title="알림 설정"
                subtitle={profile?.pushEnabled === false ? '꺼짐' : '교환·채팅 알림 받기'}
                rightElement={
                  <Switch
                    value={profile?.pushEnabled ?? true}
                    onValueChange={handleTogglePush}
                    disabled={pushSaving || !profile}
                    trackColor={{ true: colors.primary, false: colors.border }}
                  />
                }
              />
              <SettingsRow
                danger
                hideArrow
                title="로그아웃"
                onPress={handleLogout}
              />
              <SettingsRow
                danger
                isLast
                hideArrow
                title="회원 탈퇴"
                onPress={handleDeleteAccount}
              />
            </View>

            <Text style={styles.footerBrand}>PageMate · v1.0</Text>
          </ScrollView>
        )}

        <NeighborhoodSheet
          visible={neighborhoodVisible}
          current={profile?.location ?? null}
          onClose={() => setNeighborhoodVisible(false)}
          onSave={(loc) => {
            setProfile(p => p ? { ...p, location: loc } : p);
            setNeighborhoodVisible(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, backgroundColor: colors.bg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.s4,
    paddingVertical: 10,
  },
  topBarTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  iconBtn: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.s4 },

  // Profile card
  profileCard: {
    marginHorizontal: spacing.s4,
    marginBottom: spacing.s5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  profileCenter: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
    marginTop: 4,
  },
  profileBio: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },

  // 통계 (프로필 카드 하단)
  profileStatsDivider: { height: 1, backgroundColor: colors.border },
  profileStats: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  statLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingCount: { fontSize: 13, color: colors.textTertiary, fontWeight: '500' },

  // 섹션 헤더
  sectionHeader: {
    paddingHorizontal: spacing.s5,
    paddingBottom: 12,
    paddingTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, color: colors.text },

  // 내 도서 목록
  booksRow: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.s4, paddingBottom: spacing.s5 },

  addBookTile: {
    width: 104,
    height: 148,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addBookTileText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  myBookCard: { width: 104, gap: 6 },
  myBookCover: { width: 104, height: 148, borderRadius: radius.md },
  myBookBadge: { position: 'absolute', top: 6, left: 6 },
  myBookTitle: { fontSize: 12, fontWeight: '600', color: colors.text, letterSpacing: -0.1, lineHeight: 16 },
  myBookAuthor: { fontSize: 11, color: colors.textSecondary },

  // 교환독서 이력
  historyCard: {
    marginHorizontal: spacing.s4,
    marginBottom: spacing.s5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  historyItem: { paddingHorizontal: 16, paddingVertical: 14 },
  historyItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, letterSpacing: -0.2, marginRight: 8 },
  historyDate: { fontSize: 12, color: colors.textTertiary, flexShrink: 0 },

  // 설정
  settingsCard: {
    marginHorizontal: spacing.s4,
    marginBottom: spacing.s6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: 14,
  },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsMeta: { flex: 1 },
  settingsTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  settingsSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  footerBrand: {
    paddingVertical: 12,
    paddingBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.textTertiary,
  },
});

export default ProfileScreen;
