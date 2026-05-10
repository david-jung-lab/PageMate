import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { profileApi } from '@/features/profile/api';
import { storage } from '@/lib/storage';
import { colors, radius, spacing, fontSize } from '@/theme/tokens';

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

const NICKNAME_MAX = 10;
const NICKNAME_MIN = 2;

function isValidNickname(s: string): boolean {
  if (s.length < NICKNAME_MIN || s.length > NICKNAME_MAX) return false;
  return /^[가-힣a-zA-Z0-9_]+$/.test(s);
}

export default function SignUpScreen() {
  const [nickname, setNickname] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = nickname.trim();
  const valid = isValidNickname(trimmed);
  const showValidation = trimmed.length >= NICKNAME_MIN;

  const handleDone = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await profileApi.updateMyProfile({ nickname: trimmed });
      await storage.setGenrePending();
      router.replace('/(tabs)');
    } catch {
      Alert.alert('오류', '닉네임 저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
              style={[
                styles.input,
                { borderColor: focused || trimmed.length > 0 ? colors.primary : colors.border },
              ]}
              value={nickname}
              onChangeText={(v) => setNickname(v.slice(0, NICKNAME_MAX))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              onSubmitEditing={handleDone}
              maxLength={NICKNAME_MAX}
              autoFocus
            />
            <Text style={styles.hint}>2~10자, 특수문자 불가</Text>
            {showValidation && (
              <Text style={[styles.validMsg, { color: valid ? colors.primary : colors.danger }]}>
                {valid ? '✓ 사용 가능한 닉네임이에요' : '사용할 수 없는 닉네임이에요'}
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.ctaWrapper}>
          <Pressable
            onPress={handleDone}
            disabled={!valid || submitting}
            style={[styles.ctaBtn, { backgroundColor: valid ? colors.primary : '#C8D5E7' }]}
          >
            <Text style={styles.ctaLabel}>다음</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: 52,
    paddingLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: 20,
    paddingBottom: spacing.s6,
    gap: 32,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  fieldGroup: { gap: 8 },
  counterRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  counter: { fontSize: fontSize.caption, color: colors.textTertiary },
  input: {
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    fontSize: fontSize.body + 1,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.15,
  },
  hint: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  validMsg: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  ctaWrapper: {
    paddingHorizontal: spacing.s5,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  ctaBtn: {
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
  ctaLabel: {
    fontSize: fontSize.body + 1,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.15,
  },
});
