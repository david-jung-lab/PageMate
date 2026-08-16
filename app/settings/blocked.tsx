import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, radius, spacing } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMAvatar from '../../src/components/ui/PMAvatar';
import { safetyApi } from '../../src/features/safety/api';
import { BlockedUser } from '../../src/features/safety/types';

type AvatarColor = 'blue' | 'orange' | 'sage' | 'plum' | 'sand' | 'ink';

export default function BlockedUsersScreen() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setUsers(await safetyApi.getBlockedUsers());
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleUnblock = (user: BlockedUser) => {
    const name = user.nickname ?? '이 사용자';
    Alert.alert(
      `${name}님을 차단 해제할까요?`,
      '다시 서로의 프로필과 등록한 책을 볼 수 있게 됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단 해제',
          onPress: async () => {
            try {
              await safetyApi.unblockUser(user.id);
              setUsers(prev => prev.filter(u => u.id !== user.id));
            } catch {
              Alert.alert('실패', '잠시 후 다시 시도해주세요.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={8}>
          <PMIcon name="chevronLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>차단한 사용자</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : users.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>차단한 사용자가 없습니다</Text>
          <Text style={styles.emptyText}>
            프로필이나 채팅방의 ··· 메뉴에서 사용자를 차단할 수 있습니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => String(u.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <PMAvatar
                name={item.nickname ?? '?'}
                color={(item.avatarColor ?? 'blue') as AvatarColor}
                size={44}
              />
              <View style={styles.info}>
                <Text style={styles.name}>{item.nickname ?? '알 수 없음'}</Text>
                {item.handle ? <Text style={styles.handle}>{item.handle}</Text> : null}
              </View>
              <TouchableOpacity
                style={styles.unblockBtn}
                onPress={() => handleUnblock(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.unblockText}>차단 해제</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.s4, paddingVertical: 12,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },

  list: { padding: spacing.s4, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 14,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  handle: { fontSize: 12, color: colors.textTertiary },
  unblockBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  unblockText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', lineHeight: 20 },
});
