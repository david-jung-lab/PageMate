import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMAvatar from '../../src/components/ui/PMAvatar';
import PMBadge from '../../src/components/ui/PMBadge';
import { profileApi } from '../../src/features/profile/api';
import { ProfileUpdateParams } from '../../src/features/profile/types';
import { GENRES } from '../../src/constants';

const AVATAR_COLORS = ['blue', 'orange', 'sage', 'plum', 'sand', 'ink'] as const;
type AvatarColor = typeof AVATAR_COLORS[number];

const AVATAR_PALETTE: Record<AvatarColor, string> = {
  blue: '#4F86C6', orange: '#F4A261', sage: '#8FA889',
  plum: '#7B5E8C', sand: '#C9B79C', ink: '#2A3340',
};

export default function ProfileEditScreen() {
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarColor, setAvatarColor] = useState<AvatarColor>('blue');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileApi.getMyProfile().then((p) => {
      setNickname(p.nickname ?? '');
      setBio(p.bio ?? '');
      setLocation(p.location ?? '');
      setAvatarColor((p.avatarColor as AvatarColor) ?? 'blue');
      setTags(p.tags ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('닉네임을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const params: ProfileUpdateParams = { nickname, bio, location, avatarColor, tags };
      await profileApi.updateMyProfile(params);
      router.back();
    } catch {
      Alert.alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <PMIcon name="chevronLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 편집</Text>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.saveBtn}>저장</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <PMAvatar name={nickname || '?'} color={avatarColor} size={80} />
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setAvatarColor(c)}
                activeOpacity={0.8}
                style={[
                  styles.colorDot,
                  { backgroundColor: AVATAR_PALETTE[c] },
                  avatarColor === c && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Fields */}
        <View style={styles.card}>
          <Field label="닉네임">
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={colors.textTertiary}
              maxLength={30}
            />
          </Field>
          <Field label="자기소개" last>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={bio}
              onChangeText={setBio}
              placeholder="간단한 자기소개를 입력하세요"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={200}
            />
          </Field>
        </View>

        <View style={styles.card}>
          <Field label="동네" last>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="예) 망원동, 연남동"
              placeholderTextColor={colors.textTertiary}
              maxLength={100}
            />
          </Field>
        </View>

        <Text style={styles.sectionLabel}>취향 태그</Text>
        <View style={styles.tagsWrap}>
          {GENRES.map(g => (
            <TouchableOpacity key={g} onPress={() => toggleTag(g)} activeOpacity={0.7}>
              <PMBadge variant={tags.includes(g) ? 'primary' : 'default'} size="md">
                #{g}
              </PMBadge>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Field: React.FC<{ label: string; last?: boolean; children: React.ReactNode }> = ({ label, last, children }) => (
  <View style={[styles.field, !last && styles.fieldBorder]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.s4, paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  saveBtn: { fontSize: 15, fontWeight: '700', color: colors.primary },
  body: { padding: spacing.s4, paddingBottom: 40, gap: 16 },

  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 16 },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 28, height: 28, borderRadius: radius.full },
  colorDotSelected: { borderWidth: 3, borderColor: colors.text },

  card: {
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden',
  },
  field: { padding: 14, paddingHorizontal: 18 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel: { fontSize: 11, color: colors.textTertiary, marginBottom: 6, fontWeight: '600' },
  input: { fontSize: 14, color: colors.text, padding: 0 },
  inputMulti: { minHeight: 64, textAlignVertical: 'top' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
