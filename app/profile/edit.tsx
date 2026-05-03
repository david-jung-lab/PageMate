import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
  Platform, Pressable,
} from 'react-native';
import * as Location from 'expo-location';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { colors, radius, spacing } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMAvatar from '../../src/components/ui/PMAvatar';
import PMBadge from '../../src/components/ui/PMBadge';
import { profileApi } from '../../src/features/profile/api';
import { ProfileUpdateParams } from '../../src/features/profile/types';
import { GENRES } from '../../src/constants';
import { locationApi, LocationResult } from '../../src/features/locations/api';

const AVATAR_COLORS = ['blue', 'orange', 'sage', 'plum', 'sand', 'ink'] as const;
type AvatarColor = typeof AVATAR_COLORS[number];

const AVATAR_PALETTE: Record<AvatarColor, string> = {
  blue: '#4F86C6', orange: '#F4A261', sage: '#8FA889',
  plum: '#7B5E8C', sand: '#C9B79C', ink: '#2A3340',
};

const CrosshairIcon = ({ size = 18, color = colors.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

const LocationPinIcon = ({ size = 14, color = colors.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </Svg>
);

const SearchIcon = ({ size = 18, color = colors.textTertiary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
    <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default function ProfileEditScreen() {
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarColor, setAvatarColor] = useState<AvatarColor>('blue');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    profileApi.getMyProfile().then((p) => {
      setNickname(p.nickname ?? '');
      setBio(p.bio ?? '');
      setLocation(p.location ?? '');
      setAvatarColor((p.avatarColor as AvatarColor) ?? 'blue');
      setTags(p.tags ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await locationApi.search(query.trim());
        setResults(data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleGps = async () => {
    setGpsLoading(true);
    try {
      let lat: number, lng: number;
      if (Platform.OS === 'web') {
        const pos = await new Promise<{ coords: { latitude: number; longitude: number } }>(
          (resolve, reject) => {
            if (!('geolocation' in navigator)) {
              reject(new Error('이 브라우저는 위치 기능을 지원하지 않아요.'));
              return;
            }
            (navigator as any).geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          }
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      const result = await locationApi.reverseGeocode(lat, lng);
      if (result) {
        const label = result.district ? `${result.name} · ${result.district}` : result.name;
        setLocation(label);
        setQuery('');
        setResults([]);
      }
    } catch {
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없어요.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePick = (r: LocationResult) => {
    const label = r.district ? `${r.name} · ${r.district}` : r.name;
    setLocation(label);
    setQuery('');
    setResults([]);
  };

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

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

        {/* Location */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionLabel}>동네</Text>

          <Pressable
            style={({ pressed }) => [styles.gpsBtn, pressed && { opacity: 0.85 }]}
            onPress={handleGps}
            disabled={gpsLoading}
          >
            {gpsLoading
              ? <ActivityIndicator color={colors.primary} size="small" style={{ width: 18 }} />
              : <CrosshairIcon size={18} color={colors.primary} />
            }
            <Text style={styles.gpsBtnText}>현재 위치로 설정하기</Text>
            <Text style={styles.gpsLabel}>GPS</Text>
          </Pressable>

          {location ? (
            <View style={styles.selectedBadge}>
              <LocationPinIcon size={14} color={colors.primary} />
              <Text style={styles.selectedText}>{location}</Text>
            </View>
          ) : null}

          <View style={styles.searchRow}>
            <SearchIcon size={18} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="동네 이름으로 검색"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator color={colors.primary} size="small" />}
          </View>

          {results.length > 0 && (
            <View style={styles.resultList}>
              {results.map((r, i) => (
                <Pressable
                  key={`${r.fullAddress}-${i}`}
                  onPress={() => handlePick(r)}
                  style={({ pressed }) => [
                    styles.resultItem,
                    i > 0 && styles.resultItemBorder,
                    pressed && { backgroundColor: colors.surface2 },
                  ]}
                >
                  <LocationPinIcon size={16} color={colors.textTertiary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{r.name}</Text>
                    {r.district ? (
                      <Text style={styles.resultSub}>{r.district} · {r.city}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {!searching && query.trim().length > 0 && results.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>검색 결과가 없어요</Text>
            </View>
          )}
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

  locationSection: { gap: 10 },
  gpsBtn: {
    height: 48,
    paddingHorizontal: spacing.s4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gpsBtnText: {
    flex: 1, fontSize: 14, fontWeight: '600',
    color: colors.primary, letterSpacing: -0.1,
  },
  gpsLabel: { fontSize: 11, color: colors.primary, opacity: 0.7 },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.primarySoft, borderRadius: radius.full,
  },
  selectedText: { fontSize: 13, fontWeight: '600', color: colors.primary, letterSpacing: -0.1 },
  searchRow: {
    height: 48, paddingHorizontal: 14,
    backgroundColor: colors.surface, borderWidth: 1.5,
    borderColor: colors.border, borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontWeight: '500',
    color: colors.text, letterSpacing: -0.15, padding: 0,
  },
  resultList: {
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden',
  },
  resultItem: {
    height: 56, paddingHorizontal: spacing.s4,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  resultItemBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  resultName: { fontSize: 14, fontWeight: '600', color: colors.text, letterSpacing: -0.1 },
  resultSub: { fontSize: 12, color: colors.textTertiary, letterSpacing: -0.05, marginTop: 1 },
  emptyBox: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.textTertiary },
});
