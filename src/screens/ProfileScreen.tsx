import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, radius, spacing } from '../theme/tokens';
import PMIcon from '../components/ui/PMIcon';
import PMBadge from '../components/ui/PMBadge';
import PMAvatar from '../components/ui/PMAvatar';
import PMBookCover from '../components/ui/PMBookCover';
import PMTabBar from '../components/ui/PMTabBar';
import { profileApi } from '../features/profile/api';
import { Profile } from '../features/profile/types';
import { BookSummary } from '../features/books/types';
import { readingApi } from '../features/reading/api';
import { ReadingRecord } from '../features/reading/types';

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

/* ---------- Stars ---------- */
const Stars: React.FC<{ value: number }> = ({ value }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map((i) => (
      <PMIcon key={i} name="star" size={12}
        color={i <= value ? colors.secondary : colors.borderStrong} strokeWidth={1.6} />
    ))}
  </View>
);

/* ---------- TopBar ---------- */
const TopBar: React.FC = () => (
  <View style={styles.topBar}>
    <Text style={styles.topBarTitle}>마이</Text>
    <View style={styles.topBarActions}>
      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}
        onPress={() => router.push('/notifications')}>
        <PMIcon name="bell" size={20} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}
        onPress={() => router.push('/profile/edit')}>
        <PMIcon name="settings" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  </View>
);

/* ---------- ProfileCard ---------- */
interface ProfileCardProps { profile: Profile }

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const color = (profile.avatarColor ?? 'blue') as AvatarColor;
  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    : '';

  return (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <PMAvatar name={profile.nickname ?? '?'} color={color} size={64} />
        <View style={styles.profileMeta}>
          <Text style={styles.profileName}>{profile.nickname}</Text>
          <Text style={styles.profileHandle}>{profile.handle}</Text>
          <View style={styles.profileLocation}>
            {profile.location && (
              <>
                <PMIcon name="location" size={11} color={colors.textSecondary} />
                <Text style={styles.profileLocationText}>{profile.location}</Text>
                <Text style={styles.profileLocationDot}>·</Text>
              </>
            )}
            {joined && <Text style={styles.profileLocationText}>가입 {joined}</Text>}
          </View>
        </View>
      </View>

      {profile.bio && <Text style={styles.profileBio}>{profile.bio}</Text>}

      {profile.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {profile.tags.map((t) => (
            <PMBadge key={t} variant="primary" size="sm">#{t}</PMBadge>
          ))}
        </View>
      )}

      <View style={styles.statsDivider} />
      <View style={styles.statsRow}>
        {([
          ['등록한 책', profile.bookCount],
        ] as [string, number][]).map(([label, val], i) => (
          <View key={label} style={[styles.statItem, i > 0 && styles.statBorderLeft]}>
            <Text style={styles.statValue}>{val}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/* ---------- SectionHeader ---------- */
interface SectionHeaderProps { title: string; action?: string; onAction?: () => void }

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity style={styles.sectionAction} onPress={onAction} activeOpacity={0.7}>
        <Text style={styles.sectionActionText}>{action}</Text>
        <PMIcon name="chevronRight" size={14} color={colors.primary} />
      </TouchableOpacity>
    )}
  </View>
);

/* ---------- MyBookCard ---------- */
interface MyBookCardProps { book: BookSummary }

const MyBookCard: React.FC<MyBookCardProps> = ({ book }) => (
  <TouchableOpacity style={styles.myBookCard} activeOpacity={0.8}
    onPress={() => router.push(`/books/${book.id}`)}>
    <View>
      <PMBookCover title={book.title} author={book.author} color={book.coverColor} width={116} height={166} />
      <View style={styles.myBookBadge}>
        <PMBadge variant={statusVariant(book.status)} size="sm">
          {STATUS_LABEL[book.status] ?? book.status}
        </PMBadge>
      </View>
    </View>
    <Text style={styles.myBookTitle} numberOfLines={2}>{book.title}</Text>
    <Text style={styles.myBookAuthor}>{book.author}</Text>
  </TouchableOpacity>
);

/* ---------- AddBookTile ---------- */
const AddBookTile: React.FC = () => (
  <TouchableOpacity style={styles.addTileWrapper} activeOpacity={0.8}
    onPress={() => router.push('/books/new')}>
    <View style={styles.addTile}>
      <View style={styles.addTileIconWrap}>
        <PMIcon name="plus" size={20} color={colors.primary} />
      </View>
      <Text style={styles.addTileText}>{'새 책\n등록하기'}</Text>
    </View>
  </TouchableOpacity>
);

/* ---------- ReadItem ---------- */
interface ReadItemProps { record: ReadingRecord; isLast: boolean }

const ReadItem: React.FC<ReadItemProps> = ({ record, isLast }) => {
  const date = record.readAt
    ? new Date(record.readAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '';
  return (
    <View style={[styles.readItem, !isLast && styles.readItemBorder]}>
      <PMBookCover title={record.bookTitle} author={record.author}
        color={(record.coverColor ?? 'sage') as any} width={40} height={58} />
      <View style={styles.readItemMeta}>
        <Text style={styles.readItemTitle} numberOfLines={1}>{record.bookTitle}</Text>
        <Text style={styles.readItemAuthor}>{record.author}</Text>
        <View style={styles.readItemBottom}>
          <Stars value={record.rating} />
          <Text style={styles.readItemDate}>{date}</Text>
        </View>
      </View>
    </View>
  );
};

/* ---------- SettingsItem ---------- */
interface SettingsItemProps {
  icon: React.ReactNode; title: string; subtitle?: string;
  danger?: boolean; isLast?: boolean; onPress?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, subtitle, danger, isLast, onPress }) => (
  <TouchableOpacity
    style={[styles.settingsItem, !isLast && styles.settingsItemBorder]}
    onPress={onPress} activeOpacity={0.7}
  >
    <View style={[styles.settingsIcon, { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft }]}>
      {icon}
    </View>
    <View style={styles.settingsMeta}>
      <Text style={[styles.settingsTitle, danger && { color: colors.danger }]}>{title}</Text>
      {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
    </View>
    <PMIcon name="chevronRight" size={16} color={colors.textTertiary} />
  </TouchableOpacity>
);

/* ---------- ProfileScreen ---------- */
const ProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'me' | 'home' | 'search' | 'swap' | 'chat'>('me');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [readingRecords, setReadingRecords] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [p, b, r] = await Promise.all([
        profileApi.getMyProfile(),
        profileApi.getMyBooks(0, 10).catch(() => ({ content: [] as BookSummary[] })),
        readingApi.getMyRecords(0, 3).catch(() => ({ content: [] as ReadingRecord[] })),
      ]);
      setProfile(p);
      setBooks(b.content);
      setReadingRecords(r.content);
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

            {profile && <ProfileCard profile={profile} />}

            <SectionHeader title="내가 등록한 책" action="전체보기" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.booksRow}>
              {books.map((b) => <MyBookCard key={b.id} book={b} />)}
              <AddBookTile />
            </ScrollView>

            <SectionHeader title="독서 기록" action="기록 추가"
              onAction={() => router.push('/reading/new')} />
            {readingRecords.length > 0 ? (
              <View style={styles.card}>
                {readingRecords.map((r, i) => (
                  <ReadItem key={r.id} record={r} isLast={i === readingRecords.length - 1} />
                ))}
              </View>
            ) : (
              <View style={[styles.card, { alignItems: 'center', padding: 24 }]}>
                <Text style={{ fontSize: 13, color: colors.textTertiary }}>아직 독서 기록이 없어요</Text>
              </View>
            )}

            <SectionHeader title="설정" />
            <View style={[styles.card, styles.settingsCard]}>
              <SettingsItem
                icon={<PMIcon name="user" size={18} color={colors.primary} />}
                title="프로필 편집"
                subtitle="이름, 자기소개, 취향 태그"
                onPress={() => router.push('/profile/edit')}
              />
              <SettingsItem
                icon={<PMIcon name="bell" size={18} color={colors.primary} />}
                title="알림 설정"
                subtitle="새 매칭, 메시지, 교환 진행"
              />
              <SettingsItem
                danger isLast
                icon={<PMIcon name="logOut" size={18} color={colors.danger} />}
                title="로그아웃"
              />
            </View>

            <Text style={styles.footerBrand}>PageMate · v1.0</Text>
          </ScrollView>
        )}

        <PMTabBar active={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
};

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.s4, paddingVertical: 10,
  },
  topBarTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  topBarActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.s4 },
  profileCard: {
    marginHorizontal: spacing.s4, marginBottom: spacing.s5, padding: 18,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileMeta: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5, color: colors.text },
  profileHandle: { fontSize: 11, color: colors.textTertiary, fontFamily: 'monospace', marginTop: 2 },
  profileLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  profileLocationText: { fontSize: 11, color: colors.textSecondary },
  profileLocationDot: { fontSize: 11, color: colors.textSecondary },
  profileBio: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: 14, letterSpacing: -0.1 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  statsDivider: { height: 1, backgroundColor: colors.border, marginTop: 18, marginBottom: 16 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statBorderLeft: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  statLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: spacing.s5, paddingBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  booksRow: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.s4, paddingBottom: 28 },
  myBookCard: { width: 116, gap: 8 },
  myBookBadge: { position: 'absolute', top: 8, left: 8 },
  myBookTitle: { fontSize: 12, fontWeight: '600', color: colors.text, letterSpacing: -0.1, lineHeight: 16 },
  myBookAuthor: { fontSize: 11, color: colors.textSecondary, marginTop: -4 },
  addTileWrapper: { width: 116 },
  addTile: {
    width: 116, height: 166, backgroundColor: colors.surface,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  addTileIconWrap: {
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  addTileText: { fontSize: 11, fontWeight: '600', color: colors.primary, textAlign: 'center', lineHeight: 16 },
  starsRow: { flexDirection: 'row', gap: 1 },
  card: {
    marginHorizontal: spacing.s4, marginBottom: spacing.s6,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, overflow: 'hidden',
  },
  readItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingHorizontal: 18 },
  readItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  readItemMeta: { flex: 1, minWidth: 0 },
  readItemTitle: { fontSize: 13, fontWeight: '700', color: colors.text, letterSpacing: -0.2, lineHeight: 17 },
  readItemAuthor: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  readItemBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  readItemDate: { fontSize: 10, color: colors.textTertiary },
  readMoreDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 },
  readMoreText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  settingsCard: { marginBottom: spacing.s6 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingHorizontal: 18 },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  settingsMeta: { flex: 1, minWidth: 0 },
  settingsTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  settingsSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  footerBrand: { paddingVertical: 12, paddingBottom: 24, textAlign: 'center', fontStyle: 'italic', fontSize: 12, color: colors.textTertiary },
});

export default ProfileScreen;
