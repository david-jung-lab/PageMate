import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { colors, radius, spacing, fontSize } from '@/theme/tokens';
import { locationApi, type LocationResult } from '@/features/locations/api';
import { authApi } from '@/features/auth/api';

// ─── Icons ───────────────────────────────────────────────────────────────────

const ChevronLeft = ({ size = 22, color = colors.text }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CameraIcon = ({ size = 14 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7h3l2-2.5h8L18 7h3v12H3V7z" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
  </Svg>
);

const AvatarPlaceholder = ({ size = 96 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Circle cx="40" cy="40" r="40" fill={colors.primarySoft} />
    <Circle cx="40" cy="32" r="12" fill={colors.primary} opacity={0.55} />
    <Path d="M16 70c0-13 10.7-22 24-22s24 9 24 22" fill={colors.primary} opacity={0.55} />
  </Svg>
);

const CheckIcon = ({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LocationPinIcon = ({ size = 18, color = colors.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
  </Svg>
);

const SearchIcon = ({ size = 18, color = colors.textTertiary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
    <Path d="m20 20-3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const CrosshairIcon = ({ size = 16, color = colors.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="8" />
    <Circle cx="12" cy="12" r="3" />
    <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </Svg>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;

const TopBar = ({
  title,
  step,
  onBack,
}: {
  title: string;
  step: number;
  onBack: () => void;
}) => (
  <View>
    <View style={topBarStyles.row}>
      <Pressable onPress={onBack} style={topBarStyles.backBtn} hitSlop={8}>
        <ChevronLeft />
      </Pressable>
      <Text style={topBarStyles.title}>{title}</Text>
      <View style={{ flex: 1 }} />
      <Text style={topBarStyles.counter}>{step} / {TOTAL_STEPS}</Text>
    </View>
    <View style={topBarStyles.track}>
      <View style={[topBarStyles.fill, { width: `${(step / TOTAL_STEPS) * 100}%` as any }]} />
    </View>
  </View>
);

const topBarStyles = StyleSheet.create({
  row: {
    height: 52,
    paddingLeft: 8,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
    letterSpacing: -0.1,
  },
  track: { height: 3, backgroundColor: colors.border },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

// ─── Bottom CTA button ────────────────────────────────────────────────────────

const PrimaryButton = ({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) => {
  const [pressed, setPressed] = useState(false);
  return (
    <View style={ctaStyles.wrapper}>
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={() => !disabled && !loading && setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          ctaStyles.btn,
          { backgroundColor: disabled || loading ? '#C8D5E7' : colors.primary },
          pressed && ctaStyles.btnPressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={ctaStyles.label}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
};

const ctaStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.s5,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  btn: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPressed: { transform: [{ scale: 0.99 }] },
  label: {
    fontSize: fontSize.body + 1,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.15,
  },
});

// ─── Step 1: Profile setup ────────────────────────────────────────────────────

interface ProfileState {
  nickname: string;
  handle: string;
  bio: string;
}

const NICKNAME_MAX = 10;
const BIO_MAX = 60;
const HANDLE_PATTERN = /^[a-z0-9_]{3,15}$/;

const Step1 = ({
  profile,
  onChange,
  onNext,
}: {
  profile: ProfileState;
  onChange: (p: ProfileState) => void;
  onNext: () => void;
}) => {
  const [nicknameFocused, setNicknameFocused] = useState(false);
  const [handleFocused, setHandleFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);

  const handleValid =
    profile.handle.length === 0 || HANDLE_PATTERN.test(profile.handle);
  const canProceed =
    profile.nickname.trim().length > 0 && HANDLE_PATTERN.test(profile.handle);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={step1Styles.scroll}
        contentContainerStyle={step1Styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={step1Styles.avatarWrapper}>
          <View style={step1Styles.avatarCircle}>
            <AvatarPlaceholder size={96} />
          </View>
          <Pressable style={step1Styles.cameraBtn} onPress={() => {}}>
            <CameraIcon size={14} />
          </Pressable>
        </View>

        {/* Nickname */}
        <View style={step1Styles.fieldGroup}>
          <View style={step1Styles.labelRow}>
            <Text style={step1Styles.label}>닉네임</Text>
            <Text style={step1Styles.counter}>
              <Text style={{ color: profile.nickname.length > 0 ? colors.primary : colors.textTertiary }}>
                {profile.nickname.length}
              </Text>
              {` / ${NICKNAME_MAX}`}
            </Text>
          </View>
          <TextInput
            style={[
              step1Styles.input,
              { borderColor: nicknameFocused || profile.nickname.length > 0 ? colors.primary : colors.border },
            ]}
            value={profile.nickname}
            onChangeText={(v) => onChange({ ...profile, nickname: v.slice(0, NICKNAME_MAX) })}
            onFocus={() => setNicknameFocused(true)}
            onBlur={() => setNicknameFocused(false)}
            placeholder="닉네임을 입력해주세요"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="next"
            maxLength={NICKNAME_MAX}
          />
        </View>

        {/* Handle */}
        <View style={step1Styles.fieldGroup}>
          <Text style={step1Styles.label}>아이디</Text>
          <View style={[step1Styles.handleRow, { borderColor: handleFocused || profile.handle.length > 0 ? colors.primary : colors.border }]}>
            <Text style={step1Styles.handleAt}>@</Text>
            <TextInput
              style={step1Styles.handleInput}
              value={profile.handle}
              onChangeText={(v) =>
                onChange({ ...profile, handle: v.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15) })
              }
              onFocus={() => setHandleFocused(true)}
              onBlur={() => setHandleFocused(false)}
              placeholder="reads_book"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              maxLength={15}
            />
          </View>
          <Text style={[step1Styles.hint, { color: handleValid ? colors.textTertiary : '#C8553D' }]}>
            {handleValid
              ? '영문 소문자, 숫자, _ 사용 (3~15자)'
              : '3~15자의 영문 소문자/숫자/_ 만 가능해요'}
          </Text>
        </View>

        {/* Bio (optional) */}
        <View style={step1Styles.fieldGroup}>
          <View style={step1Styles.labelRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={step1Styles.label}>한 줄 소개</Text>
              <View style={step1Styles.optionalBadge}>
                <Text style={step1Styles.optionalText}>선택</Text>
              </View>
            </View>
            <Text style={step1Styles.counter}>
              <Text style={{ color: profile.bio.length > 0 ? colors.primary : colors.textTertiary }}>
                {profile.bio.length}
              </Text>
              {` / ${BIO_MAX}`}
            </Text>
          </View>
          <TextInput
            style={[step1Styles.input, { borderColor: bioFocused ? colors.primary : colors.border }]}
            value={profile.bio}
            onChangeText={(v) => onChange({ ...profile, bio: v.slice(0, BIO_MAX) })}
            onFocus={() => setBioFocused(true)}
            onBlur={() => setBioFocused(false)}
            placeholder="독서 취향을 한 줄로 소개해주세요"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            maxLength={BIO_MAX}
          />
        </View>
      </ScrollView>

      <PrimaryButton label="다음" onPress={onNext} disabled={!canProceed} />
    </KeyboardAvoidingView>
  );
};

const step1Styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: 32,
    paddingBottom: spacing.s6,
    gap: 24,
  },
  avatarWrapper: { alignItems: 'center', marginTop: 4 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    right: '50%',
    bottom: 0,
    marginRight: -64,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldGroup: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
  },
  counter: { fontSize: fontSize.caption, color: colors.textTertiary },
  hint: { fontSize: 11, letterSpacing: -0.05, paddingLeft: 2 },
  optionalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm - 2,
    backgroundColor: colors.surface2,
  },
  optionalText: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
  input: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    fontSize: fontSize.body,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.15,
  },
  handleRow: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  handleAt: {
    fontSize: fontSize.body,
    fontWeight: '500',
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  handleInput: {
    flex: 1,
    height: '100%',
    fontSize: fontSize.body,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.15,
    padding: 0,
  },
});

// ─── Step 2: Active neighborhood ─────────────────────────────────────────────

const Step2 = ({
  selected,
  onSelect,
  onNext,
}: {
  selected: string | null;
  onSelect: (loc: string) => void;
  onNext: () => void;
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await locationApi.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (result) {
        const label = result.district ? `${result.name} · ${result.district}` : result.name;
        onSelect(label);
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
    onSelect(label);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      <ScrollView
        style={step2Styles.scroll}
        contentContainerStyle={step2Styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <View style={step2Styles.headingBlock}>
          <Text style={step2Styles.heading}>{'어느 동네에서\n책을 교환하실 건가요?'}</Text>
          <Text style={step2Styles.subheading}>반경 2km 내 독자들과 책을 주고받게 돼요</Text>
        </View>

        {/* Current location button */}
        <Pressable
          style={({ pressed }) => [step2Styles.gpsBtn, pressed && { opacity: 0.85 }]}
          onPress={handleGps}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <ActivityIndicator color={colors.primary} size="small" style={{ width: 18 }} />
          ) : (
            <CrosshairIcon size={18} color={colors.primary} />
          )}
          <Text style={step2Styles.gpsBtnText}>현재 위치로 설정하기</Text>
          <Text style={step2Styles.gpsLabel}>GPS</Text>
        </Pressable>

        {/* Selected badge */}
        {selected && (
          <View style={step2Styles.selectedBadge}>
            <LocationPinIcon size={14} color={colors.primary} />
            <Text style={step2Styles.selectedText}>{selected}</Text>
          </View>
        )}

        {/* Search input */}
        <View style={step2Styles.searchRow}>
          <SearchIcon size={18} color={colors.textTertiary} />
          <TextInput
            style={step2Styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="동네 이름으로 검색"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searching && <ActivityIndicator color={colors.primary} size="small" />}
        </View>

        {/* Results list */}
        {results.length > 0 && (
          <View style={step2Styles.resultList}>
            {results.map((r, i) => (
              <Pressable
                key={`${r.fullAddress}-${i}`}
                onPress={() => handlePick(r)}
                style={({ pressed }) => [
                  step2Styles.resultItem,
                  i > 0 && step2Styles.resultItemBorder,
                  pressed && { backgroundColor: colors.surface2 },
                ]}
              >
                <LocationPinIcon size={16} color={colors.textTertiary} />
                <View style={{ flex: 1 }}>
                  <Text style={step2Styles.resultName}>{r.name}</Text>
                  {r.district ? (
                    <Text style={step2Styles.resultSub}>{r.district} · {r.city}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {!searching && query.trim().length > 0 && results.length === 0 && (
          <View style={step2Styles.emptyBox}>
            <Text style={step2Styles.emptyText}>검색 결과가 없어요</Text>
          </View>
        )}
      </ScrollView>

      <PrimaryButton label="다음" onPress={onNext} disabled={!selected} />
    </>
  );
};

const step2Styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: 28,
    paddingBottom: spacing.s6,
    gap: 16,
  },
  headingBlock: { gap: 8 },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  subheading: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
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
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: -0.1,
  },
  gpsLabel: { fontSize: 11, color: colors.primary, opacity: 0.7 },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: -0.1,
  },
  searchRow: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.body,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.15,
    padding: 0,
  },
  resultList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  resultItem: {
    height: 56,
    paddingHorizontal: spacing.s4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
  },
  resultSub: {
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: -0.05,
    marginTop: 1,
  },
  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: colors.textTertiary },
});

// ─── Step 3: Genre selection ──────────────────────────────────────────────────

const GENRES = [
  { id: 'novel', label: '소설' },
  { id: 'essay', label: '에세이' },
  { id: 'selfdev', label: '자기계발' },
  { id: 'biz', label: '경제경영' },
  { id: 'humanities', label: '인문학' },
  { id: 'science', label: '과학' },
  { id: 'poetry', label: '시 / 詩' },
  { id: 'scifi', label: 'SF' },
];

const GenreTag = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        genreStyles.tag,
        selected ? genreStyles.tagSelected : genreStyles.tagDefault,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      {selected && <CheckIcon size={16} />}
      <Text style={[genreStyles.tagLabel, selected && genreStyles.tagLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
};

const genreStyles = StyleSheet.create({
  tag: {
    height: 56,
    paddingHorizontal: spacing.s4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tagDefault: { backgroundColor: colors.surface },
  tagSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  tagLabel: { fontSize: fontSize.body, fontWeight: '600', letterSpacing: -0.15, color: colors.primary },
  tagLabelSelected: { color: '#FFFFFF' },
});

const Step3 = ({
  selected,
  onToggle,
  onDone,
  loading,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onDone: () => void;
  loading: boolean;
}) => (
  <>
    <ScrollView
      style={step3Styles.scroll}
      contentContainerStyle={step3Styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={step3Styles.headingBlock}>
        <Text style={step3Styles.heading}>{'좋아하는 장르를\n선택해주세요'}</Text>
        <Text style={step3Styles.subheading}>복수 선택 가능 · 취향에 맞는 메이트를 추천해드려요</Text>
      </View>

      <View style={step3Styles.counterPill}>
        <Text style={step3Styles.counterText}>
          <Text>{selected.size}개</Text>
          <Text style={{ opacity: 0.6 }}> 선택됨</Text>
        </Text>
      </View>

      <View style={step3Styles.grid}>
        {GENRES.map((g) => (
          <View key={g.id} style={step3Styles.gridItem}>
            <GenreTag label={g.label} selected={selected.has(g.id)} onPress={() => onToggle(g.id)} />
          </View>
        ))}
      </View>
    </ScrollView>

    <PrimaryButton
      label="시작하기"
      onPress={onDone}
      disabled={selected.size === 0}
      loading={loading}
    />
  </>
);

const step3Styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: 28,
    paddingBottom: spacing.s6,
    gap: 20,
  },
  headingBlock: { gap: 8 },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  subheading: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  counterPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
  },
  counterText: { fontSize: fontSize.caption, fontWeight: '600', color: colors.primary, letterSpacing: -0.1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '48.5%' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileState>({ nickname: '', handle: '', bio: '' });
  const [location, setLocation] = useState<string | null>(null);
  const [genres, setGenres] = useState(new Set<string>());
  const [submitting, setSubmitting] = useState(false);

  const title = ['프로필 설정', '활동 지역', '취향 선택'][step - 1];

  const handleBack = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const toggleGenre = (id: string) => {
    setGenres((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await authApi.onboard({
        nickname: profile.nickname.trim(),
        handle: profile.handle,
        bio: profile.bio.trim() || undefined,
        location: location!,
        genres: Array.from(genres),
      });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('오류', '회원가입 중 문제가 발생했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <TopBar title={title} step={step} onBack={handleBack} />
      <View style={styles.body}>
        {step === 1 && (
          <Step1 profile={profile} onChange={setProfile} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step2 selected={location} onSelect={setLocation} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <Step3
            selected={genres}
            onToggle={toggleGenre}
            onDone={handleComplete}
            loading={submitting}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
});
