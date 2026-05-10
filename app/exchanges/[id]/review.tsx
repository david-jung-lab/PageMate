import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import Svg, { Path, Polygon } from 'react-native-svg';
import { colors, spacing, radius } from '../../../src/theme/tokens';
import { exchangeApi } from '../../../src/features/exchange/api';
import { reviewApi } from '../../../src/features/review/api';
import { useAuthStore } from '../../../src/store';

const ChevronLeft = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StarIcon = ({ filled, size = 40 }: { filled: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Polygon
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      fill={filled ? '#F59E0B' : 'none'}
      stroke={filled ? '#F59E0B' : colors.border}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const myUserId = useAuthStore((s) => s.user?.id);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const COMMENT_MAX = 100;

  const { data: exchange } = useQuery({
    queryKey: ['exchange', id],
    queryFn: () => exchangeApi.getExchange(Number(id)),
    enabled: !!id,
  });

  const partnerNickname = exchange
    ? (exchange.requester.id === myUserId
        ? exchange.respondent.nickname
        : exchange.requester.nickname)
    : '상대방';

  const reviewMutation = useMutation({
    mutationFn: () => reviewApi.createReview(Number(id), rating, comment.trim() || undefined),
    onSuccess: () => {
      Alert.alert('평가 완료', `${partnerNickname}님께 평가를 남겼어요.`, [
        { text: '확인', onPress: () => router.replace('/(tabs)/swap' as any) },
      ]);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error?.code;
      if (code === 'VALIDATION_ERROR') {
        Alert.alert('알림', '이미 평가를 남기셨어요.');
      } else {
        Alert.alert('오류', '평가 제출에 실패했어요.');
      }
    },
  });

  const canSubmit = rating > 0 && !reviewMutation.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>교환독서 완료</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>🎉 교환 완료</Text>
          </View>

          <Text style={styles.title}>
            <Text style={styles.accent}>{partnerNickname}</Text>
            {'님과의 교환독서가\n완료됐어요'}
          </Text>
          <Text style={styles.sub}>{partnerNickname}님은 어떠셨나요?</Text>

          {/* 별점 */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((v) => (
              <TouchableOpacity key={v} onPress={() => setRating(v)} activeOpacity={0.75}>
                <StarIcon filled={v <= rating} size={44} />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {['', '아쉬워요', '별로예요', '보통이에요', '좋았어요', '최고예요'][rating]}
            </Text>
          )}

          {/* 한줄 후기 */}
          <View style={styles.commentSection}>
            <View style={styles.commentLabelRow}>
              <Text style={styles.commentLabel}>한줄 후기</Text>
              <View style={styles.optionalBadge}><Text style={styles.optionalText}>선택</Text></View>
            </View>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={(t) => setComment(t.slice(0, COMMENT_MAX))}
              placeholder="한줄 후기를 남겨주세요"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={COMMENT_MAX}
            />
            <Text style={styles.commentCount}>
              <Text style={{ color: comment.length > 0 ? colors.primary : colors.textTertiary }}>{comment.length}</Text>
              {`/${COMMENT_MAX}`}
            </Text>
          </View>

          {/* 공유 유도 */}
          <TouchableOpacity
            style={styles.shareNudge}
            onPress={() => router.push('/shares/new')}
            activeOpacity={0.85}
          >
            <Text style={styles.shareNudgeText}>📷  독서 기록을 공유해볼까요?</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          disabled={!canSubmit}
          onPress={() => reviewMutation.mutate()}
          activeOpacity={0.85}
        >
          {reviewMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>평가 완료</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.s4, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.s5, gap: 16, paddingBottom: 24 },

  completedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5', borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  completedBadgeText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  title: {
    fontSize: 22, fontWeight: '700', color: colors.text,
    lineHeight: 32, letterSpacing: -0.5,
  },
  accent: { color: colors.primary },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: -4 },

  starsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 8 },
  ratingLabel: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#F59E0B' },

  commentSection: { gap: 6 },
  commentLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  optionalBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: colors.surface2, borderRadius: 4,
  },
  optionalText: { fontSize: 11, color: colors.textTertiary },
  commentInput: {
    minHeight: 80, padding: 14,
    backgroundColor: colors.surface, borderWidth: 1.5,
    borderColor: colors.border, borderRadius: radius.lg,
    fontSize: 14, color: colors.text, textAlignVertical: 'top',
    lineHeight: 22,
  },
  commentCount: { fontSize: 12, color: colors.textTertiary, textAlign: 'right' },

  shareNudge: {
    backgroundColor: colors.primarySoft, borderRadius: radius.lg,
    padding: 16, alignItems: 'center',
  },
  shareNudgeText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  footer: {
    paddingHorizontal: spacing.s5, paddingVertical: 16, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  submitBtn: {
    height: 54, backgroundColor: colors.primary,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.borderStrong },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});
