import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { profileApi } from '@/features/profile/api';
import { locationApi, LocationResult } from '@/features/locations/api';
import { GENRES } from '@/constants';
import { colors, radius, spacing, fontSize } from '@/theme/tokens';

const ChevronLeft = ({ size = 22, color = colors.text }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const NICKNAME_MAX = 10;
const NICKNAME_MIN = 2;
const TOTAL_STEPS = 3;

function isValidNickname(s: string): boolean {
  if (s.length < NICKNAME_MIN || s.length > NICKNAME_MAX) return false;
  return /^[가-힣a-zA-Z0-9_]+$/.test(s);
}

export default function SignUpScreen() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — 닉네임
  const [nickname, setNickname] = useState('');
  const [focused, setFocused] = useState(false);
  const trimmed = nickname.trim();
  const nicknameValid = isValidNickname(trimmed);
  const showNicknameValidation = trimmed.length >= NICKNAME_MIN;

  // Step 2 — 동네
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try { setResults((await locationApi.search(query.trim())) ?? []); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query]);

  const pickLocation = (r: LocationResult) => {
    const label = r.district ? `${r.name} · ${r.district}` : r.name;
    setLocation(label);
    setQuery(label);
    setResults([]);
  };

  // Step 3 — 취향
  const [genres, setGenres] = useState<Set<string>>(new Set());
  const toggleGenre = (id: string) => {
    setGenres((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const canProceed =
    step === 1 ? nicknameValid :
    step === 2 ? !!location :
    genres.size > 0;

  const handleNext = () => {
    if (!canProceed || submitting) return;
    if (step < TOTAL_STEPS) { setStep(step + 1); return; }
    handleSubmit();
  };

  const handleBack = () => {
    if (submitting) return;
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await profileApi.updateMyProfile({
        nickname: trimmed,
        location: location ?? undefined,
        tags: Array.from(genres),
      });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('오류', '프로필 저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft />
        </Pressable>
        {/* 진행 인디케이터 */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i < step && styles.progressDotActive]}
            />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: 닉네임 ── */}
          {step === 1 && (
            <>
              <Text style={styles.heading}>{'반가워요!\n닉네임을 알려주세요'}</Text>
              <View style={styles.fieldGroup}>
                <View style={styles.counterRow}>
                  <Text style={styles.counter}>
                    <Text style={{ color: trimmed.length > 0 ? colors.primary : colors.textTertiary }}>
                      {trimmed.length}
                    </Text>
                    {` / ${NICKNAME_MAX}`}
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { borderColor: focused || trimmed.length > 0 ? colors.primary : colors.border }]}
                  value={nickname}
                  onChangeText={(v) => setNickname(v.slice(0, NICKNAME_MAX))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="닉네임을 입력해주세요"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                  maxLength={NICKNAME_MAX}
                  autoFocus
                />
                <Text style={styles.hint}>2~10자, 특수문자 불가</Text>
                {showNicknameValidation && (
                  <Text style={[styles.validMsg, { color: nicknameValid ? colors.primary : colors.danger }]}>
                    {nicknameValid ? '✓ 사용 가능한 닉네임이에요' : '사용할 수 없는 닉네임이에요'}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* ── Step 2: 동네 ── */}
          {step === 2 && (
            <>
              <Text style={styles.heading}>{'어느 동네에\n살고 계신가요?'}</Text>
              <Text style={styles.sub}>내 주변 이웃의 책을 보여드릴게요</Text>
              <View style={styles.searchRow}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={11} cy={11} r={7} stroke={colors.textTertiary} strokeWidth={2} />
                  <Path d="m20 20-3.5-3.5" stroke={colors.textTertiary} strokeWidth={2} strokeLinecap="round" />
                </Svg>
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={(v) => { setQuery(v); setLocation(null); }}
                  placeholder="동 이름으로 검색 (예: 망원동)"
                  placeholderTextColor={colors.textTertiary}
                  autoCorrect={false}
                  autoFocus
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
              {location && (
                <Text style={[styles.validMsg, { color: colors.primary }]}>✓ {location} 선택됨</Text>
              )}
              {results.length > 0 && !location && (
                <View style={styles.resultList}>
                  {results.map((r, i) => (
                    <TouchableOpacity
                      key={`${r.fullAddress}-${i}`}
                      style={[styles.resultItem, i > 0 && styles.resultBorder]}
                      onPress={() => pickLocation(r)}
                      activeOpacity={0.75}
                    >
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <Circle cx={12} cy={10} r={3} stroke={colors.primary} strokeWidth={2} />
                      </Svg>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName}>{r.name}</Text>
                        {r.district ? <Text style={styles.resultSub}>{r.district} · {r.city}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {!searching && query.trim().length > 0 && results.length === 0 && !location && (
                <Text style={styles.empty}>검색 결과가 없어요</Text>
              )}
            </>
          )}

          {/* ── Step 3: 취향 ── */}
          {step === 3 && (
            <>
              <Text style={styles.heading}>{'어떤 책을\n좋아하세요?'}</Text>
              <Text style={styles.sub}>취향에 맞는 책을 보여드릴게요 (복수 선택)</Text>
              <View style={styles.genreGrid}>
                {GENRES.map((g) => {
                  const sel = genres.has(g.id);
                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => toggleGenre(g.id)}
                      style={[styles.genreChip, sel && styles.genreChipActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.genreLabel, sel && styles.genreLabelActive]}>{g.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.ctaWrapper}>
          <Pressable
            onPress={handleNext}
            disabled={!canProceed || submitting}
            style={[styles.ctaBtn, { backgroundColor: canProceed && !submitting ? colors.primary : '#C8D5E7' }]}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaLabel}>{step < TOTAL_STEPS ? '다음' : '시작하기'}</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: 52, paddingHorizontal: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  progressRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  progressDot: { width: 22, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.primary },
  content: { paddingHorizontal: spacing.s6, paddingTop: 20, paddingBottom: spacing.s6, gap: 20 },
  heading: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5, lineHeight: 36 },
  sub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: -12 },
  fieldGroup: { gap: 8 },
  counterRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  counter: { fontSize: fontSize.caption, color: colors.textTertiary },
  input: {
    height: 52, paddingHorizontal: 16, backgroundColor: colors.surface,
    borderWidth: 1.5, borderRadius: radius.lg,
    fontSize: fontSize.body + 1, fontWeight: '500', color: colors.text, letterSpacing: -0.15,
  },
  hint: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  validMsg: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  // 동네
  searchRow: {
    height: 48, paddingHorizontal: 14, backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  resultList: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' },
  resultItem: { height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  resultName: { fontSize: 14, fontWeight: '600', color: colors.text },
  resultSub: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
  empty: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', paddingVertical: 12 },
  // 취향
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreChip: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  genreChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  genreLabel: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },
  genreLabelActive: { color: colors.primary },
  ctaWrapper: {
    paddingHorizontal: spacing.s5, paddingTop: 12, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  ctaBtn: {
    height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  ctaLabel: { fontSize: fontSize.body + 1, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.15 },
});
