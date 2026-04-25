import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme/tokens';
import PMIcon from '../components/ui/PMIcon';
import PMBadge from '../components/ui/PMBadge';
import PMAvatar from '../components/ui/PMAvatar';
import PMBookCover from '../components/ui/PMBookCover';
import PMTabBar from '../components/ui/PMTabBar';

/* ---------- Data ---------- */

const ME = {
  name: '민지',
  handle: '@minji_reads',
  color: 'blue' as const,
  bio: '조용한 카페에서 책 읽는 시간을 좋아해요. 한강, 김초엽, 최은영을 자주 읽어요.',
  location: '망원동',
  joined: '2024.06',
  stats: { registered: 12, exchanged: 8, read: 34 },
  tags: ['소설', '에세이', 'SF'],
};

const MY_BOOKS = [
  { id: 1, title: '작별하지 않는다', author: '한강', color: 'plum' as const, status: '교환중' },
  { id: 2, title: '데미안', author: '헤르만 헤세', color: 'blue' as const, status: '교환가능' },
  { id: 3, title: '우리가 빛의 속도로', author: '김초엽', color: 'orange' as const, status: '교환가능' },
  { id: 4, title: 'Pachinko', author: 'Min Jin Lee', color: 'sage' as const, status: '교환완료' },
  { id: 5, title: '여름은 오래 그곳에', author: '마쓰이에', color: 'sand' as const, status: '교환가능' },
];

const READ_HISTORY = [
  { id: 1, title: '아주 희미한 빛으로도', author: '최은영', rating: 5, date: '4월 18일', color: 'sage' as const },
  { id: 2, title: '달까지 가자', author: '장류진', rating: 4, date: '4월 5일', color: 'ink' as const },
  { id: 3, title: '소년이 온다', author: '한강', rating: 5, date: '3월 22일', color: 'plum' as const },
];

/* ---------- Helpers ---------- */

type BadgeVariant = 'success' | 'primary' | 'default';

const statusVariant = (s: string): BadgeVariant => {
  if (s === '교환가능') return 'success';
  if (s === '교환중') return 'primary';
  return 'default';
};

/* ---------- Stars ---------- */

const Stars: React.FC<{ value: number }> = ({ value }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map((i) => (
      <PMIcon
        key={i}
        name="star"
        size={12}
        color={i <= value ? colors.secondary : colors.borderStrong}
        strokeWidth={1.6}
      />
    ))}
  </View>
);

/* ---------- TopBar ---------- */

const TopBar: React.FC = () => (
  <View style={styles.topBar}>
    <Text style={styles.topBarTitle}>마이</Text>
    <View style={styles.topBarActions}>
      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
        <PMIcon name="bell" size={20} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
        <PMIcon name="settings" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  </View>
);

/* ---------- ProfileCard ---------- */

const ProfileCard: React.FC = () => (
  <View style={styles.profileCard}>
    <View style={styles.profileHeader}>
      <PMAvatar name={ME.name} color={ME.color} size={64} />
      <View style={styles.profileMeta}>
        <Text style={styles.profileName}>{ME.name}</Text>
        <Text style={styles.profileHandle}>{ME.handle}</Text>
        <View style={styles.profileLocation}>
          <PMIcon name="location" size={11} color={colors.textSecondary} />
          <Text style={styles.profileLocationText}>{ME.location}</Text>
          <Text style={styles.profileLocationDot}>·</Text>
          <Text style={styles.profileLocationText}>가입 {ME.joined}</Text>
        </View>
      </View>
    </View>

    <Text style={styles.profileBio}>{ME.bio}</Text>

    <View style={styles.tagsRow}>
      {ME.tags.map((t) => (
        <PMBadge key={t} variant="primary" size="sm">#{t}</PMBadge>
      ))}
    </View>

    <View style={styles.statsDivider} />
    <View style={styles.statsRow}>
      {([
        ['등록한 책', ME.stats.registered],
        ['완료한 교환', ME.stats.exchanged],
        ['독서 기록', ME.stats.read],
      ] as [string, number][]).map(([label, val], i) => (
        <View key={label} style={[styles.statItem, i > 0 && styles.statBorderLeft]}>
          <Text style={styles.statValue}>{val}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  </View>
);

/* ---------- SectionHeader ---------- */

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

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

interface MyBookCardProps {
  book: typeof MY_BOOKS[number];
}

const MyBookCard: React.FC<MyBookCardProps> = ({ book }) => (
  <View style={styles.myBookCard}>
    <View>
      <PMBookCover title={book.title} author={book.author} color={book.color} width={116} height={166} />
      <View style={styles.myBookBadge}>
        <PMBadge variant={statusVariant(book.status)} size="sm">{book.status}</PMBadge>
      </View>
    </View>
    <Text style={styles.myBookTitle} numberOfLines={2}>{book.title}</Text>
    <Text style={styles.myBookAuthor}>{book.author}</Text>
  </View>
);

/* ---------- AddBookTile ---------- */

const AddBookTile: React.FC = () => (
  <TouchableOpacity style={styles.addTileWrapper} activeOpacity={0.8}>
    <View style={styles.addTile}>
      <View style={styles.addTileIconWrap}>
        <PMIcon name="plus" size={20} color={colors.primary} />
      </View>
      <Text style={styles.addTileText}>{'새 책\n등록하기'}</Text>
    </View>
  </TouchableOpacity>
);

/* ---------- ReadItem ---------- */

interface ReadItemProps {
  book: typeof READ_HISTORY[number];
  isLast: boolean;
}

const ReadItem: React.FC<ReadItemProps> = ({ book, isLast }) => (
  <View style={[styles.readItem, !isLast && styles.readItemBorder]}>
    <PMBookCover title={book.title} author={book.author} color={book.color} width={40} height={58} />
    <View style={styles.readItemMeta}>
      <Text style={styles.readItemTitle} numberOfLines={1}>{book.title}</Text>
      <Text style={styles.readItemAuthor}>{book.author}</Text>
      <View style={styles.readItemBottom}>
        <Stars value={book.rating} />
        <Text style={styles.readItemDate}>{book.date}</Text>
      </View>
    </View>
  </View>
);

/* ---------- SettingsItem ---------- */

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  danger?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon, title, subtitle, danger, isLast, onPress,
}) => (
  <TouchableOpacity
    style={[styles.settingsItem, !isLast && styles.settingsItemBorder]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[
      styles.settingsIcon,
      { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft },
    ]}>
      <View style={{ tintColor: danger ? colors.danger : colors.primary }}>
        {icon}
      </View>
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
          <ProfileCard />

          {/* Section 1 — My Books */}
          <SectionHeader title="내가 등록한 책" action="전체보기" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.booksRow}
          >
            {MY_BOOKS.map((b) => <MyBookCard key={b.id} book={b} />)}
            <AddBookTile />
          </ScrollView>

          {/* Section 2 — Read History */}
          <SectionHeader title="독서 기록" />
          <View style={styles.card}>
            {READ_HISTORY.map((b, i) => (
              <ReadItem key={b.id} book={b} isLast={i === READ_HISTORY.length - 1} />
            ))}
            <View style={styles.readMoreDivider}>
              <TouchableOpacity style={styles.readMoreBtn} activeOpacity={0.7}>
                <Text style={styles.readMoreText}>독서 기록 더보기</Text>
                <PMIcon name="chevronRight" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 3 — Settings */}
          <SectionHeader title="설정" />
          <View style={[styles.card, styles.settingsCard]}>
            <SettingsItem
              icon={<PMIcon name="user" size={18} color={colors.primary} />}
              title="프로필 편집"
              subtitle="이름, 자기소개, 취향 태그"
            />
            <SettingsItem
              icon={<PMIcon name="bell" size={18} color={colors.primary} />}
              title="알림 설정"
              subtitle="새 매칭, 메시지, 교환 진행"
            />
            <SettingsItem
              danger
              isLast
              icon={<PMIcon name="logOut" size={18} color={colors.danger} />}
              title="로그아웃"
            />
          </View>

          <Text style={styles.footerBrand}>PageMate · v1.0</Text>
        </ScrollView>

        <PMTabBar active={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
};

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // TopBar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.s4,
    paddingVertical: 10,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.s4,
  },

  // ProfileCard
  profileCard: {
    marginHorizontal: spacing.s4,
    marginBottom: spacing.s5,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileMeta: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  profileHandle: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  profileLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  profileLocationText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  profileLocationDot: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  profileBio: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 14,
    letterSpacing: -0.1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  statsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 18,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // SectionHeader
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
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  // Books horizontal scroll
  booksRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.s4,
    paddingBottom: 28,
  },
  myBookCard: {
    width: 116,
    gap: 8,
  },
  myBookBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  myBookTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
    lineHeight: 16,
  },
  myBookAuthor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: -4,
  },

  // Add book tile
  addTileWrapper: {
    width: 116,
  },
  addTile: {
    width: 116,
    height: 166,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addTileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTileText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Stars
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },

  // Read history
  card: {
    marginHorizontal: spacing.s4,
    marginBottom: spacing.s6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  readItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    paddingHorizontal: 18,
  },
  readItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readItemMeta: {
    flex: 1,
    minWidth: 0,
  },
  readItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 17,
  },
  readItemAuthor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  readItemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  readItemDate: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  readMoreDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Settings
  settingsCard: {
    marginBottom: spacing.s6,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    paddingHorizontal: 18,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingsMeta: {
    flex: 1,
    minWidth: 0,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  settingsSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Footer
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
