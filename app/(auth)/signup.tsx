import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { profileApi } from '@/features/profile/api';
import { locationApi, LocationResult } from '@/features/locations/api';
import { colors, radius, spacing, fontSize } from '@/theme/tokens';

// ─── Icons ───────────────────────────────────────────────────────────────────

const ChevronLeft = ({ size = 22, color = colors.text }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CameraIcon = ({ size = 14 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7h3l2-2.5h8L18 7h3v12H3V7z" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
  </Svg>
);

const AvatarPlaceholder = ({ size = 80 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Circle cx="40" cy="40" r="40" fill={colors.primarySoft} />
    <Circle cx="40" cy="32" r="12" fill={colors.primary} opacity={0.55} />
    <Path d="M16 70c0-13 10.7-22 24-22s24 9 24 22" fill={colors.primary} opacity={0.55} />
  </Svg>
);

const CheckIcon = ({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12.5l4.5 4.5L19 7.5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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

// ─── Progress bar ─────────────────────────────────────────────────────────────

const TopBar = ({
  title,
  step,
  totalSteps = 2,
  onBack,
}: {
  title: string;
  step: number;
  totalSteps?: number;
  onBack: () => void;
}) => (
  <View>
    <View style={topBarStyles.row}>
      <Pressable onPress={onBack} style={topBarStyles.backBtn} hitSlop={8}>
        <ChevronLeft />
      </Pressable>
      <Text style={topBarStyles.title}>{title}</Text>
      <View style={{ flex: 1 }} />
      <Text style={topBarStyles.counter}>
        {step} / {totalSteps}
      </Text>
    </View>
    <View style={topBarStyles.track}>
      <View style={[topBarStyles.fill, { width: `${(step / totalSteps) * 100}%` as any }]} />
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
  track: {
    height: 3,
    backgroundColor: colors.border,
  },
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
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const [pressed, setPressed] = useState(false);
  return (
    <View style={ctaStyles.wrapper}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={() => !disabled && setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          ctaStyles.btn,
          { backgroundColor: disabled ? '#C8D5E7' : colors.primary },
          pressed && ctaStyles.btnPressed,
        ]}
      >
        <Text style={ctaStyles.label}>{label}</Text>
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
  btnPressed: {
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontSize: fontSize.body + 1,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.15,
  },
});

// ─── Step 1: Profile setup ────────────────────────────────────────────────────

const NICKNAME_MAX = 10;

const Step1 = ({ onNext }: { onNext: (nickname: string, bio: string) => void }) => {
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [nicknameFocused, setNicknameFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);

  const nicknameBorder =
    nicknameFocused || nickname.length > 0 ? colors.primary : colors.border;
  const bioBorder = bioFocused ? colors.primary : colors.border;

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
          <Pressable
            style={step1Styles.cameraBtn}
            onPress={() => {
              // TODO: expo-image-picker로 갤러리 열기
            }}
          >
            <CameraIcon size={14} />
          </Pressable>
        </View>

        {/* Nickname */}
        <View style={step1Styles.fieldGroup}>
          <View style={step1Styles.labelRow}>
            <Text style={step1Styles.label}>닉네임</Text>
            <Text style={step1Styles.counter}>
              <Text style={{ color: nickname.length > 0 ? colors.primary : colors.textTertiary }}>
                {nickname.length}
              </Text>
              {` / ${NICKNAME_MAX}`}
            </Text>
          </View>
          <TextInput
            style={[step1Styles.input, { borderColor: nicknameBorder }]}
            value={nickname}
            onChangeText={(v) => setNickname(v.slice(0, NICKNAME_MAX))}
            onFocus={() => setNicknameFocused(true)}
            onBlur={() => setNicknameFocused(false)}
            placeholder="닉네임을 입력해주세요"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="next"
            maxLength={NICKNAME_MAX}
          />
        </View>

        {/* Bio (optional) */}
        <View style={step1Styles.fieldGroup}>
          <View style={step1Styles.labelRow}>
            <Text style={step1Styles.label}>한 줄 소개</Text>
            <View style={step1Styles.optionalBadge}>
              <Text style={step1Styles.optionalText}>선택</Text>
            </View>
          </View>
          <TextInput
            style={[step1Styles.input, { borderColor: bioBorder }]}
            value={bio}
            onChangeText={setBio}
            onFocus={() => setBioFocused(true)}
            onBlur={() => setBioFocused(false)}
            placeholder="독서 취향을 한 줄로 소개해주세요"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
          />
        </View>
      </ScrollView>

      <PrimaryButton
        label="다음"
        onPress={() => onNext(nickname.trim(), bio.trim())}
        disabled={nickname.trim().length === 0}
      />
    </KeyboardAvoidingView>
  );
};

const step1Styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: 32,
    paddingBottom: spacing.s6,
    gap: 28,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
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
  counter: {
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
  optionalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm - 2,
    backgroundColor: colors.surface2,
  },
  optionalText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
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
        <View style={step2Styles.headingBlock}>
          <Text style={step2Styles.heading}>{'어느 동네에서\n책을 교환하실 건가요?'}</Text>
          <Text style={step2Styles.subheading}>반경 2km 내 독자들과 책을 주고받게 돼요</Text>
        </View>

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

        {selected && (
          <View style={step2Styles.selectedBadge}>
            <LocationPinIcon size={14} color={colors.primary} />
            <Text style={step2Styles.selectedText}>{selected}</Text>
          </View>
        )}

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

interface Genre {
  id: string;
  label: string;
  emoji: string;
}

const GENRES: Genre[] = [
  { id: 'novel',      label: '소설',    emoji: '📖' },
  { id: 'essay',      label: '에세이',  emoji: '🍃' },
  { id: 'selfdev',    label: '자기계발', emoji: '🌱' },
  { id: 'biz',        label: '경제경영', emoji: '📈' },
  { id: 'humanities', label: '인문학',  emoji: '🏛' },
  { id: 'science',    label: '과학',    emoji: '🔬' },
  { id: 'poetry',     label: '시 / 詩', emoji: '🪶' },
  { id: 'scifi',      label: 'SF',      emoji: '🚀' },
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
  tagDefault: {
    backgroundColor: colors.surface,
  },
  tagSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  tagLabel: {
    fontSize: fontSize.body,
    fontWeight: '600',
    letterSpacing: -0.15,
    color: colors.primary,
  },
  tagLabelSelected: {
    color: '#FFFFFF',
  },
});

const Step3 = ({ onDone }: { onDone: (genres: string[]) => void }) => {
  const [selected, setSelected] = useState(new Set<string>());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <ScrollView
        style={step3Styles.scroll}
        contentContainerStyle={step3Styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={step3Styles.headingBlock}>
          <Text style={step3Styles.heading}>{'좋아하는 장르를\n선택해주세요'}</Text>
          <Text style={step3Styles.subheading}>
            복수 선택 가능 · 취향에 맞는 메이트를 추천해드려요
          </Text>
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
              <GenreTag
                label={g.label}
                selected={selected.has(g.id)}
                onPress={() => toggle(g.id)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <PrimaryButton
        label="시작하기"
        onPress={() => onDone(Array.from(selected))}
        disabled={selected.size === 0}
      />
    </>
  );
};

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
  counterText: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: -0.1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48.5%',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({ nickname: '', bio: '' });
  const [location, setLocation] = useState<string | null>(null);

  const handleBack = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const handleStep1Done = (nickname: string, bio: string) => {
    setProfileData({ nickname, bio });
    setStep(2);
  };

  const handleStep2Done = () => {
    setStep(3);
  };

  const handleDone = async (genres: string[]) => {
    try {
      await profileApi.updateMyProfile({
        nickname: profileData.nickname,
        bio: profileData.bio || undefined,
        tags: genres,
      });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('오류', '프로필 저장에 실패했어요. 다시 시도해주세요.');
    }
  };

  const title = step === 1 ? '프로필 설정' : step === 2 ? '활동 동네' : '취향 선택';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <TopBar title={title} step={step} totalSteps={3} onBack={handleBack} />
      <View style={styles.body}>
        {step === 1 && <Step1 onNext={handleStep1Done} />}
        {step === 2 && (
          <Step2 selected={location} onSelect={setLocation} onNext={handleStep2Done} />
        )}
        {step === 3 && <Step3 onDone={handleDone} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
});
