import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radius } from '../../../src/theme/tokens';
import { exchangeApi } from '../../../src/features/exchange/api';

const ChevronLeft = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [dateInput, setDateInput] = useState('');
  const [place, setPlace] = useState('');

  const { data: exchange } = useQuery({
    queryKey: ['exchange', id],
    queryFn: () => exchangeApi.getExchange(Number(id)),
    enabled: !!id,
  });

  const scheduleMutation = useMutation({
    mutationFn: () => exchangeApi.scheduleExchange(Number(id), dateInput, place.trim()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['exchange', id] });
      qc.invalidateQueries({ queryKey: ['exchanges'] });
      const msg = `${dateInput} ${place.trim()}에서 만남 일정이 확정됐어요!`;
      if (Platform.OS === 'web') {
        window.alert(msg);
        if (data.chatRoomId) {
          router.replace(`/chat/${data.chatRoomId}` as any);
        } else {
          router.back();
        }
      } else {
        Alert.alert('일정 확정', msg, [
          { text: '채팅방으로', onPress: () => {
            if (data.chatRoomId) {
              router.replace(`/chat/${data.chatRoomId}` as any);
            } else {
              router.back();
            }
          }},
        ]);
      }
    },
    onError: () => {
      if (Platform.OS === 'web') {
        window.alert('일정 확정에 실패했어요. 다시 시도해주세요.');
      } else {
        Alert.alert('오류', '일정 확정에 실패했어요. 다시 시도해주세요.');
      }
    },
  });

  const canSubmit = isValidDate(dateInput) && place.trim().length > 0 && !scheduleMutation.isPending;

  const requestedTitle = exchange?.requestedBook.title ?? '';
  const selectedTitle = exchange?.selectedBook?.title ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>만남 일정 확정</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={styles.intro}>
            {'언제, 어디서\n만날까요?'}
          </Text>
          <Text style={styles.sub}>일정을 확정하면 채팅방에도 알림이 전달돼요</Text>

          {/* 날짜 입력 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>만남 날짜</Text>
            <TextInput
              style={styles.input}
              value={dateInput}
              onChangeText={(t) => setDateInput(formatDateInput(t))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              maxLength={10}
            />
            {dateInput.length > 0 && !isValidDate(dateInput) && (
              <Text style={styles.errorText}>올바른 날짜 형식을 입력해주세요 (예: 2025-06-15)</Text>
            )}
          </View>

          {/* 장소 입력 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>만남 장소</Text>
            <TextInput
              style={styles.input}
              value={place}
              onChangeText={setPlace}
              placeholder="예: 홍대입구역 2번 출구"
              placeholderTextColor={colors.textTertiary}
              maxLength={100}
            />
          </View>

          {/* 교환 정보 요약 */}
          {exchange && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>교환 도서</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>내가 빌려줄</Text>
                <Text style={styles.summaryBook} numberOfLines={1}>{requestedTitle || selectedTitle}</Text>
              </View>
              {selectedTitle ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>내가 빌릴</Text>
                  <Text style={styles.summaryBook} numberOfLines={1}>{requestedTitle}</Text>
                </View>
              ) : null}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canSubmit && styles.confirmBtnDisabled]}
          onPress={() => scheduleMutation.mutate()}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {scheduleMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.confirmBtnText}>일정 확정하기</Text>
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
  scrollContent: { padding: spacing.s5, gap: 20, paddingBottom: 40 },

  intro: { fontSize: 22, fontWeight: '700', color: colors.text, lineHeight: 32, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: -8 },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    height: 48, paddingHorizontal: 14,
    backgroundColor: colors.surface, borderWidth: 1.5,
    borderColor: colors.border, borderRadius: radius.lg,
    fontSize: 15, color: colors.text,
  },
  errorText: { fontSize: 12, color: colors.danger },

  summaryCard: {
    backgroundColor: colors.surface2, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: 16, gap: 8,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: colors.textTertiary, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: colors.textTertiary, width: 60 },
  summaryBook: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },

  footer: {
    paddingHorizontal: spacing.s5, paddingVertical: 16, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  confirmBtn: {
    height: 54, backgroundColor: colors.primary,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: colors.borderStrong },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});
