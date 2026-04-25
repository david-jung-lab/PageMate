import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMBookCover from '../../src/components/ui/PMBookCover';
import { readingApi } from '../../src/features/reading/api';
import { CoverColor } from '../../src/features/reading/types';

const COVER_COLORS: CoverColor[] = ['blue', 'orange', 'sage', 'plum', 'sand', 'ink'];
const COVER_PALETTE: Record<CoverColor, string> = {
  blue: '#4F86C6', orange: '#F4A261', sage: '#8FA889',
  plum: '#7B5E8C', sand: '#C9B79C', ink: '#2A3340',
};

export default function ReadingNewScreen() {
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(3);
  const [memo, setMemo] = useState('');
  const [coverColor, setCoverColor] = useState<CoverColor>('sage');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSave = async () => {
    if (!bookTitle.trim()) { Alert.alert('책 제목을 입력해주세요.'); return; }
    if (!author.trim()) { Alert.alert('저자를 입력해주세요.'); return; }
    setSaving(true);
    try {
      await readingApi.create({
        bookTitle: bookTitle.trim(),
        author: author.trim(),
        rating,
        memo: memo.trim() || undefined,
        coverColor,
        isPublic,
        readAt: today,
      });
      router.back();
    } catch {
      Alert.alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <PMIcon name="chevronLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>독서 기록 추가</Text>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.saveBtn}>저장</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 미리보기 */}
        <View style={styles.previewRow}>
          <PMBookCover title={bookTitle || '제목'} author={author || '저자'} color={coverColor} width={80} height={116} />
          <View style={styles.colorPickerCol}>
            <Text style={styles.colorLabel}>표지 색상</Text>
            <View style={styles.colorRow}>
              {COVER_COLORS.map(c => (
                <TouchableOpacity
                  key={c} onPress={() => setCoverColor(c)} activeOpacity={0.8}
                  style={[styles.colorDot, { backgroundColor: COVER_PALETTE[c] }, coverColor === c && styles.colorDotSelected]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* 책 정보 */}
        <View style={styles.card}>
          <Field label="책 제목 *">
            <TextInput style={styles.input} value={bookTitle} onChangeText={setBookTitle}
              placeholder="책 제목을 입력하세요" placeholderTextColor={colors.textTertiary} />
          </Field>
          <Field label="저자 *" last>
            <TextInput style={styles.input} value={author} onChangeText={setAuthor}
              placeholder="저자를 입력하세요" placeholderTextColor={colors.textTertiary} />
          </Field>
        </View>

        {/* 별점 */}
        <View style={styles.card}>
          <Field label="별점" last>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
                  <PMIcon name="star" size={28}
                    color={i <= rating ? colors.secondary : colors.borderStrong}
                    strokeWidth={1.6} />
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </View>

        {/* 감상 */}
        <View style={styles.card}>
          <Field label="감상 (선택)" last>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={memo} onChangeText={setMemo}
              placeholder="책에 대한 감상을 남겨보세요"
              placeholderTextColor={colors.textTertiary}
              multiline maxLength={500}
            />
          </Field>
        </View>

        {/* 공개 설정 */}
        <View style={styles.card}>
          <View style={[styles.field, styles.switchRow]}>
            <View>
              <Text style={styles.fieldLabel}>공개 여부</Text>
              <Text style={styles.switchSub}>다른 사람도 내 독서 기록을 볼 수 있어요</Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic}
              trackColor={{ true: colors.primary }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Field: React.FC<{ label: string; last?: boolean; children: React.ReactNode }> = ({ label, last, children }) => (
  <View style={[styles.field, !last && styles.fieldBorder]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.s4, paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  saveBtn: { fontSize: 15, fontWeight: '700', color: colors.primary },
  body: { padding: spacing.s4, paddingBottom: 40, gap: 16 },

  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 8 },
  colorPickerCol: { flex: 1, gap: 12 },
  colorLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 28, height: 28, borderRadius: radius.full },
  colorDotSelected: { borderWidth: 3, borderColor: colors.text },

  card: {
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden',
  },
  field: { padding: 14, paddingHorizontal: 18 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel: { fontSize: 11, color: colors.textTertiary, marginBottom: 6, fontWeight: '600' },
  input: { fontSize: 14, color: colors.text, padding: 0 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  starsRow: { flexDirection: 'row', gap: 6 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
});
