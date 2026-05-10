import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radius } from '../../../src/theme/tokens';
import { exchangeApi } from '../../../src/features/exchange/api';
import { useAuthStore } from '../../../src/store';

const ChevronLeft = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PLEDGE_ITEMS = [
  '책을 소중히 읽겠습니다',
  '약속한 날짜에 반드시 돌려드리겠습니다',
  '책에 남기는 메모는 진심을 담아 쓰겠습니다',
];

export default function AgreementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const myUserId = useAuthStore((s) => s.user?.id);

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

  const handleAgree = () => {
    if (exchange?.chatRoomId) {
      router.replace(`/chat/${exchange.chatRoomId}` as any);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>교환독서 약속</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.intro}>
          <Text style={styles.accent}>{partnerNickname}</Text>
          {'님과 교환독서를\n시작하기 전, 약속해주세요'}
        </Text>

        <View style={styles.pledgeCard}>
          <Text style={styles.pledgeTitle}>교환독서 약속</Text>
          <Text style={styles.pledgeBody}>
            {'저는 소중한 책을 빌려주신\n분의 신뢰에 보답하겠습니다.'}
          </Text>

          <View style={styles.pledgeDivider} />

          {PLEDGE_ITEMS.map((item, i) => (
            <View key={i} style={styles.pledgeItem}>
              <View style={styles.pledgeBullet} />
              <Text style={styles.pledgeItemText}>{item}</Text>
            </View>
          ))}

          <View style={styles.pledgeDivider} />

          <Text style={styles.pledgeClosing}>
            {'독서인의 교양을 믿으며,\n우리의 교환독서를 시작합니다.'}
          </Text>
        </View>

        {/* 동의 진행 상태 */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <View style={styles.progressDot} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, styles.progressDotFilled]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>나</Text>
            <Text style={[styles.progressLabel, styles.progressLabelRight]}>{partnerNickname}</Text>
          </View>
          <Text style={styles.progressSub}>동의 후 채팅방에서 교환을 진행해요</Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.agreeBtn} onPress={handleAgree} activeOpacity={0.85}>
          <Text style={styles.agreeBtnText}>동의하고 교환독서 시작하기</Text>
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

  intro: {
    fontSize: 20, fontWeight: '700', color: colors.text,
    lineHeight: 30, letterSpacing: -0.4,
  },
  accent: { color: colors.primary },

  pledgeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 24, gap: 14,
  },
  pledgeTitle: {
    fontSize: 16, fontWeight: '700', color: colors.text,
    letterSpacing: -0.3, textAlign: 'center',
  },
  pledgeBody: {
    fontSize: 14, color: colors.textSecondary,
    lineHeight: 22, textAlign: 'center', letterSpacing: -0.2,
  },
  pledgeDivider: { height: 1, backgroundColor: colors.border },
  pledgeItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pledgeBullet: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary, marginTop: 7, flexShrink: 0,
  },
  pledgeItemText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 22, letterSpacing: -0.2 },
  pledgeClosing: {
    fontSize: 13, color: colors.textSecondary,
    lineHeight: 22, textAlign: 'center', fontStyle: 'italic',
  },

  progressSection: { gap: 8, alignItems: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', width: 160 },
  progressDot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.bg,
  },
  progressDotFilled: { backgroundColor: colors.primary },
  progressLine: { flex: 1, height: 2, backgroundColor: colors.primary },
  progressLabels: {
    flexDirection: 'row', justifyContent: 'space-between', width: 160,
  },
  progressLabel: { fontSize: 12, fontWeight: '600', color: colors.primary },
  progressLabelRight: { textAlign: 'right' },
  progressSub: { fontSize: 12, color: colors.textTertiary, textAlign: 'center' },

  footer: {
    paddingHorizontal: spacing.s5, paddingVertical: 16, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  agreeBtn: {
    height: 54, backgroundColor: colors.primary,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  agreeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});
