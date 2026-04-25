import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, fontSize } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';

const SECTIONS = [
  {
    title: '제1조 (목적)',
    body: '본 약관은 회사가 제공하는 모바일 애플리케이션 "PageMate"(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (용어의 정의)',
    body: '1. 서비스: 회사가 제공하는 도서 교환 매칭, 채팅, 독서 기록 공유 등 PageMate 애플리케이션의 모든 기능을 의미합니다.\n2. 회원: 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 말합니다.\n3. 도서 교환: 회원 간 보유 도서를 직접 교환하는 행위를 의미하며, 회사는 이를 매개·연결하는 플랫폼을 제공합니다.\n4. 콘텐츠: 회원이 서비스에 등록·게시한 도서 정보, 사진, 독서 기록, 채팅 메시지 등 일체의 정보를 의미합니다.',
  },
  {
    title: '제3조 (약관의 게시와 개정)',
    body: '1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면 및 설정 메뉴에 게시합니다.\n2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 시행일 7일 전(회원에게 불리한 변경의 경우 30일 전)부터 공지합니다.\n3. 회원이 개정 약관에 동의하지 않는 경우 서비스 이용계약을 해지할 수 있습니다.',
  },
  {
    title: '제4조 (서비스의 제공)',
    body: '1. 회사는 회원에게 다음과 같은 서비스를 제공합니다.\n   • 도서 검색, 등록 및 보유 도서 관리\n   • 회원 간 도서 교환 요청 및 매칭\n   • 1:1 채팅 서비스\n   • 독서 기록 작성 및 공유\n   • 기타 회사가 추가로 개발하거나 제휴를 통해 제공하는 서비스\n2. 서비스는 연중무휴 24시간 제공함을 원칙으로 하나, 시스템 점검·교체·고장, 통신 두절 등 부득이한 사유가 있을 경우 일시 중단될 수 있습니다.\n3. 본 서비스는 무료로 제공되며, 회원 간 도서 교환에 따른 별도의 금전 거래는 회사의 서비스 영역에 포함되지 않습니다.',
  },
  {
    title: '제5조 (회원가입)',
    body: '1. 이용을 희망하는 자는 회사가 정한 방법(카카오·구글 소셜 로그인 등)에 따라 회원가입을 신청합니다.\n2. 회사는 다음 각 호에 해당하는 신청에 대하여는 가입을 거절하거나 사후 해지할 수 있습니다.\n   • 타인의 정보를 이용하여 가입한 경우\n   • 만 14세 미만의 아동이 법정대리인의 동의 없이 가입한 경우\n   • 허위 정보를 기재하거나 회사가 제시한 내용을 기재하지 않은 경우\n   • 부정한 용도 또는 영리를 추구할 목적으로 신청한 경우',
  },
  {
    title: '제6조 (회원 정보의 관리)',
    body: '1. 회원은 자신의 계정 정보를 안전하게 관리할 책임이 있으며, 제3자에게 양도·대여할 수 없습니다.\n2. 회원은 등록 정보에 변경이 있을 경우 즉시 수정해야 하며, 미수정으로 인한 불이익은 회원이 부담합니다.',
  },
  {
    title: '제7조 (회원의 의무)',
    body: '회원은 서비스를 이용함에 있어 다음 행위를 해서는 안 됩니다.\n1. 타인의 정보 도용 또는 허위 정보 등록\n2. 회사 또는 제3자의 저작권 등 지적재산권 침해\n3. 음란·폭력적·차별적 콘텐츠 게시\n4. 도서 교환을 가장한 금전 거래, 사기, 영리 목적의 광고·홍보 행위\n5. 불법 복제 도서, 위조 도서, 도난 도서의 등록 또는 교환\n6. 채팅 기능을 통한 욕설, 협박, 스팸 발송\n7. 서비스의 정상적 운영을 방해하는 행위\n8. 기타 관련 법령에 위배되는 행위',
  },
  {
    title: '제8조 (도서 등록 및 콘텐츠)',
    body: '1. 회원이 등록하는 도서 정보 및 사진의 정확성·진정성에 대한 책임은 등록 회원에게 있습니다.\n2. 회원은 자신이 등록한 콘텐츠에 대한 저작권을 보유하며, 회사는 서비스 운영·개선·홍보 목적으로 해당 콘텐츠를 무상으로 사용할 수 있는 라이선스를 보유합니다.\n3. 회사는 본 약관 또는 관련 법령을 위반한 콘텐츠, 타인의 권리를 침해하거나 부적절하다고 판단된 콘텐츠를 사전 통지 없이 삭제할 수 있습니다.',
  },
  {
    title: '제9조 (도서 교환 및 회사의 지위)',
    body: '1. 회사는 회원 간 도서 교환을 매개·연결하는 플랫폼을 제공할 뿐, 도서 교환의 당사자가 아닙니다.\n2. 회사는 회원이 등록한 도서의 진위, 상태, 품질 및 회원 간 교환 과정에서 발생하는 모든 분쟁에 대하여 어떠한 책임도 지지 않습니다.\n3. 회원은 도서 교환 시 직접 만남, 택배 등 교환 방식을 자율적으로 협의하며, 그에 따른 비용 및 위험은 회원이 부담합니다.\n4. 교환 과정에서 분쟁이 발생할 경우 회원 간 자율적으로 해결함을 원칙으로 합니다.',
  },
  {
    title: '제10조 (채팅 서비스)',
    body: '1. 채팅 서비스는 도서 교환을 위한 협의 목적으로 제공됩니다.\n2. 회사는 채팅 내용을 모니터링하지 않음을 원칙으로 하나, 신고 접수·법령에 따른 요청·서비스 운영상 필요한 경우 열람할 수 있습니다.\n3. 채팅 메시지는 관련 법령이 정한 기간 동안 보관 후 파기됩니다.',
  },
  {
    title: '제11조 (서비스 이용 제한)',
    body: '1. 회사는 회원이 본 약관을 위반하거나 서비스의 정상적 운영을 방해한 경우, 경고·일시정지·영구이용정지 등의 조치를 할 수 있습니다.\n2. 회사는 이용 제한 시 그 사유와 기간을 회원에게 통지합니다. 단, 긴급한 경우 사후 통지할 수 있습니다.',
  },
  {
    title: '제12조 (계약 해지)',
    body: '1. 회원은 언제든지 앱 내 설정 메뉴를 통해 회원 탈퇴를 신청할 수 있습니다.\n2. 회원 탈퇴 시 회원이 작성한 콘텐츠는 개인정보처리방침에 따라 처리되며, 진행 중인 교환은 상대 회원과 협의하여 마무리해야 합니다.',
  },
  {
    title: '제13조 (책임의 제한)',
    body: '1. 회사는 천재지변, 전쟁, 정전, 통신망 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.\n2. 회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.\n3. 회사는 무료로 제공되는 서비스에 대해 관련 법령에 특별한 규정이 없는 한 손해배상 책임을 지지 않습니다.',
  },
  {
    title: '제14조 (분쟁 해결 및 관할)',
    body: '1. 본 약관 및 서비스 이용과 관련하여 발생한 분쟁은 회사와 회원 간 상호 협의를 통해 해결함을 원칙으로 합니다.\n2. 협의가 이루어지지 않을 경우, 관할 법원은 민사소송법에 따른 법원으로 합니다.',
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <PMIcon name="chevronLeft" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이용약관</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>시행일: 2026년 4월 26일</Text>
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
  updated: { fontSize: fontSize.caption, color: colors.textTertiary, marginBottom: 4 },
  section: { gap: 8 },
  sectionTitle: { fontSize: fontSize.small, fontWeight: '700', color: colors.text },
  sectionBody: { fontSize: fontSize.small, color: colors.textSecondary, lineHeight: 22 },
});
