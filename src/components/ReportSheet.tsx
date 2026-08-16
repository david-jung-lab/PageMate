import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { colors, radius } from '../theme/tokens';
import PMIcon from './ui/PMIcon';
import { safetyApi } from '../features/safety/api';
import {
  ReportReason, ReportTargetType, REPORT_REASON_LABELS,
} from '../features/safety/types';

const REASONS: ReportReason[] = ['SPAM', 'ABUSE', 'INAPPROPRIATE', 'FRAUD', 'OTHER'];

interface Props {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: number;
  /** 시트 제목에 쓰일 대상 이름 (예: 닉네임, 책 제목) */
  targetLabel?: string;
  onClose: () => void;
  onReported?: () => void;
}

/** 신고 사유를 고르고 접수하는 바텀시트. 접수된 신고는 운영자가 확인 후 처리한다. */
const ReportSheet: React.FC<Props> = ({
  visible, targetType, targetId, targetLabel, onClose, onReported,
}) => {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(null);
    setDetail('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await safetyApi.report({
        targetType,
        targetId,
        reason,
        detail: detail.trim() || undefined,
      });
      reset();
      onClose();
      onReported?.();
      Alert.alert(
        '신고가 접수되었습니다',
        '확인 후 조치하겠습니다. 24시간 이내에 검토됩니다.',
      );
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = status === 409
        ? '이미 신고한 대상입니다.'
        : e?.response?.data?.error?.message ?? '잠시 후 다시 시도해주세요.';
      Alert.alert('신고 실패', msg);
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>신고하기</Text>
          {targetLabel ? (
            <Text style={styles.subtitle} numberOfLines={1}>{targetLabel}</Text>
          ) : null}

          <View style={styles.reasonList}>
            {REASONS.map((r, i) => {
              const selected = reason === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonItem, i > 0 && styles.reasonBorder]}
                  onPress={() => setReason(r)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.reasonText, selected && styles.reasonTextActive]}>
                    {REPORT_REASON_LABELS[r]}
                  </Text>
                  {selected && <PMIcon name="check" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.detailInput}
            value={detail}
            onChangeText={setDetail}
            placeholder="상세 내용 (선택, 500자 이내)"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!reason || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!reason || submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.submitText}>신고 접수</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 14,
  },
  handle: {
    width: 40, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: -8 },

  reasonList: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, overflow: 'hidden',
  },
  reasonItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  reasonBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  reasonText: { fontSize: 14, color: colors.text },
  reasonTextActive: { color: colors.primary, fontWeight: '700' },

  detailInput: {
    minHeight: 80, maxHeight: 140, padding: 14, textAlignVertical: 'top',
    backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, fontSize: 14, color: colors.text,
  },

  submitBtn: {
    height: 52, borderRadius: radius.lg, backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },
});

export default ReportSheet;
