import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, fontSize } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';

const SECTIONS = [
  {
    title: '제1조 (개인정보의 처리 목적)',
    body: 'PageMate는 다음의 목적을 위하여 개인정보를 처리합니다.\n\n1. 회원 가입 및 관리: 회원 식별, 본인 확인, 부정 이용 방지, 각종 고지·통지\n2. 서비스 제공: 도서 검색·등록·교환 매칭, 채팅 서비스, 독서 기록 관리\n3. 고객 지원: 문의 응대, 분쟁 조정, 불만 처리\n4. 서비스 개선 및 마케팅 (별도 동의 시): 신규 기능 개발, 통계 분석, 이벤트 안내, 푸시 알림 발송',
  },
  {
    title: '제2조 (수집하는 개인정보 항목)',
    body: '• 회원가입 (필수): 이메일, 닉네임, 프로필 이미지, 소셜 로그인 식별자(카카오·구글 ID) — 소셜 로그인 연동\n• 서비스 이용: 등록 도서 정보, 도서 이미지, 독서 기록, 채팅 메시지 — 회원 직접 입력\n• 자동 수집: 기기정보(OS, 모델), IP 주소, 앱 사용 기록, 광고식별자(ADID/IDFA), 푸시 토큰(FCM)\n• 선택 항목: 위치정보(근거리 매칭 서비스 이용 시) — 회원 동의 시 수집\n\nPageMate는 주민등록번호, 금융정보 등 민감정보를 수집하지 않습니다.',
  },
  {
    title: '제3조 (개인정보의 보유 및 이용 기간)',
    body: '1. 회원 정보는 회원 탈퇴 시까지 보유하며, 탈퇴 즉시 지체 없이 파기합니다.\n2. 단, 다음 정보는 관련 법령에 따라 일정 기간 보관합니다.\n   • 서비스 방문 기록: 3개월 (통신비밀보호법)\n3. 부정 이용 방지를 위해 부정 이용자의 정보는 1년간 보관 후 파기할 수 있습니다.',
  },
  {
    title: '제4조 (개인정보의 제3자 제공)',
    body: 'PageMate는 이용자의 개인정보를 제1조의 목적 범위 내에서만 처리하며, 정보주체의 사전 동의 없이는 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다.\n\n1. 정보주체가 사전에 동의한 경우\n2. 법령의 규정에 따르거나 수사 목적으로 법령에서 정한 절차와 방법에 따라 수사기관의 요구가 있는 경우',
  },
  {
    title: '제5조 (개인정보 처리의 위탁)',
    body: 'PageMate는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.\n\n• Amazon Web Services (AWS): 클라우드 서버 및 도서 이미지 저장소 운영\n• Google LLC (Firebase Cloud Messaging): 푸시 알림 발송\n• Kakao Corp.: 카카오 소셜 로그인 인증\n• Google LLC: 구글 소셜 로그인 인증\n\nPageMate는 위탁 계약 체결 시 개인정보 보호법 제26조에 따라 안전한 처리를 위한 사항을 명시하고, 수탁업체가 이를 준수하도록 관리·감독합니다.',
  },
  {
    title: '제6조 (정보주체와 법정대리인의 권리·의무 및 행사 방법)',
    body: '1. 정보주체는 PageMate에 대해 언제든지 개인정보의 열람, 정정, 삭제, 처리정지, 동의 철회를 요구할 수 있습니다.\n2. 권리 행사는 앱 내 설정 메뉴 또는 개인정보 보호책임자 이메일을 통해 요청할 수 있으며, PageMate는 지체 없이 조치합니다.\n3. 만 14세 미만 아동의 경우 법정대리인이 권리를 행사할 수 있습니다.',
  },
  {
    title: '제7조 (개인정보의 파기)',
    body: '1. PageMate는 보유 기간이 경과하거나 처리 목적이 달성된 개인정보를 지체 없이 파기합니다.\n2. 전자적 파일 형태의 정보는 복구·재생할 수 없는 방법으로 영구 삭제하며, 종이 문서는 분쇄 또는 소각하여 파기합니다.',
  },
  {
    title: '제8조 (개인정보의 안전성 확보 조치)',
    body: '1. 관리적 조치: 개인정보 처리 직원의 최소화 및 정기 교육\n2. 기술적 조치: 개인정보 암호화(전송 구간 TLS, 비밀번호 단방향 암호화), 접근 제어, 침입 차단 시스템\n3. 물리적 조치: 데이터센터 접근 통제',
  },
  {
    title: '제9조 (자동 수집 장치의 설치·운영 및 거부)',
    body: '1. PageMate는 서비스 개선을 위해 광고식별자(ADID/IDFA)를 수집·이용할 수 있습니다.\n2. 이용자는 모바일 기기 설정에서 광고식별자 재설정 또는 추적 제한 기능을 통해 거부할 수 있습니다.\n   • iOS: 설정 > 개인정보 보호 및 보안 > 추적\n   • Android: 설정 > Google > 광고',
  },
  {
    title: '제10조 (위치정보의 처리)',
    body: '1. PageMate는 근거리 도서 교환 매칭 서비스를 제공하기 위해 이용자의 동의 하에 위치정보를 수집·이용할 수 있습니다.\n2. 위치정보는 매칭 처리 후 즉시 폐기되며, 이용자는 언제든지 기기 설정 또는 앱 내에서 위치정보 제공 동의를 철회할 수 있습니다.',
  },
  {
    title: '제11조 (개인정보 보호책임자)',
    body: '운영사: Serial Viber\n개인정보 보호책임자: [성명 / 직책]\n연락처: [이메일] / [전화번호]\n\n기타 개인정보 침해 신고 및 상담은 아래 기관에 문의하실 수 있습니다.\n• 개인정보침해신고센터 (privacy.kisa.or.kr / 118)\n• 개인정보분쟁조정위원회 (kopico.go.kr / 1833-6972)\n• 대검찰청 사이버수사과 (1301)\n• 경찰청 사이버수사국 (182)',
  },
  {
    title: '제12조 (개인정보처리방침의 변경)',
    body: '본 방침은 시행일로부터 적용되며, 법령 및 정책 변경에 따라 내용이 추가·삭제·수정될 경우 시행 7일 전부터 앱 공지사항을 통해 고지합니다.',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <PMIcon name="chevronLeft" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인정보처리방침</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          {"Serial Viber(이하 \"PageMate\")은 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위하여 다음과 같은 개인정보처리방침을 두고 있습니다."}
        </Text>
        <Text style={styles.updated}>공고일: 2026년 4월 26일 · 시행일: 2026년 4월 26일</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  headerRight: { width: 30 },
  scroll: { flex: 1 },
  content: { padding: spacing.s5, gap: 24, paddingBottom: 48 },
  intro: { fontSize: fontSize.small, color: colors.textSecondary, lineHeight: 22 },
  updated: { fontSize: fontSize.caption, color: colors.textTertiary },
  section: { gap: 8 },
  sectionTitle: { fontSize: fontSize.small, fontWeight: '700', color: colors.text },
  sectionBody: { fontSize: fontSize.small, color: colors.textSecondary, lineHeight: 22 },
});
