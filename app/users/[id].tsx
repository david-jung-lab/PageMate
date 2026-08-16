import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, radius, spacing } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMAvatar from '../../src/components/ui/PMAvatar';
import PMBadge from '../../src/components/ui/PMBadge';
import PMBookCover from '../../src/components/ui/PMBookCover';
import SafetyMenuButton from '../../src/components/SafetyMenuButton';
import { profileApi } from '../../src/features/profile/api';
import { Profile } from '../../src/features/profile/types';
import { BookSummary } from '../../src/features/books/types';

type AvatarColor = 'blue' | 'orange' | 'sage' | 'plum' | 'sand' | 'ink';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      profileApi.getUserProfile(userId),
      profileApi.getUserBooks(userId),
    ]).then(([p, b]) => {
      setProfile(p);
      setBooks(b.content);
    }).finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  const color = (profile.avatarColor ?? 'blue') as AvatarColor;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <PMIcon name="chevronLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerHandle}>{profile.handle}</Text>
        <SafetyMenuButton
          targetType="USER"
          targetId={userId}
          targetLabel={profile.nickname ?? undefined}
          blockUserId={userId}
          blockUserName={profile.nickname ?? undefined}
          onBlocked={() => router.back()}
        />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <PMAvatar name={profile.nickname ?? '?'} color={color} size={64} />
          <Text style={styles.name}>{profile.nickname}</Text>
          {profile.location && (
            <View style={styles.locationRow}>
              <PMIcon name="location" size={11} color={colors.textSecondary} />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          )}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          {profile.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {profile.tags.map(t => (
                <PMBadge key={t} variant="primary" size="sm">#{t}</PMBadge>
              ))}
            </View>
          )}
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.bookCount}</Text>
              <Text style={styles.statLabel}>등록한 책</Text>
            </View>
          </View>
        </View>

        {/* Books */}
        {books.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>등록한 책</Text>
            <FlatList
              horizontal
              data={books}
              keyExtractor={b => String(b.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.booksRow}
              renderItem={({ item: b }) => (
                <TouchableOpacity
                  style={styles.bookCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/books/${b.id}`)}
                >
                  <PMBookCover title={b.title} author={b.author} color={b.coverColor} width={100} height={144} />
                  <Text style={styles.bookTitle} numberOfLines={2}>{b.title}</Text>
                  <Text style={styles.bookAuthor}>{b.author}</Text>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.s4, paddingVertical: 12,
  },
  headerHandle: { fontSize: 14, fontWeight: '600', color: colors.text, letterSpacing: -0.2 },
  body: { padding: spacing.s4, paddingBottom: 40, gap: 20 },

  profileCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 20, alignItems: 'center', gap: 10,
  },
  name: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5, color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: colors.textSecondary },
  bio: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, textAlign: 'center' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  statsDivider: { height: 1, backgroundColor: colors.border, width: '100%', marginTop: 4 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  statLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  booksRow: { gap: 12, paddingBottom: 4 },
  bookCard: { width: 100, gap: 6 },
  bookTitle: { fontSize: 12, fontWeight: '600', color: colors.text, lineHeight: 16 },
  bookAuthor: { fontSize: 11, color: colors.textSecondary },
});
