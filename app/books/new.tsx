import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMBookCover from '../../src/components/ui/PMBookCover';
import { booksApi } from '../../src/features/books/api';
import { BookCondition, CoverColor, KakaoBookItem } from '../../src/features/books/types';
import { GENRES, CONDITION_LABELS } from '../../src/constants';
import { bookCoverPalettes } from '../../src/theme/tokens';

const CONDITIONS: BookCondition[] = ['LIKE_NEW', 'GOOD', 'ACCEPTABLE'];
const COVER_COLORS = Object.keys(bookCoverPalettes) as CoverColor[];

export default function NewBookScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKakao, setSelectedKakao] = useState<KakaoBookItem | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  const [genre, setGenre] = useState('');
  const [condition, setCondition] = useState<BookCondition>('GOOD');
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState<CoverColor>('sage');

  const { data: kakaoResults, isLoading: kakaoLoading, refetch } = useQuery({
    queryKey: ['kakao-search', searchQuery],
    queryFn: () => booksApi.searchKakao(searchQuery),
    enabled: false,
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      if (publisher) formData.append('publisher', publisher);
      if (isbn) formData.append('isbn', isbn);
      formData.append('genre', genre);
      formData.append('condition', condition);
      if (description) formData.append('description', description);
      formData.append('coverColor', coverColor);
      if (selectedKakao?.thumbnail) formData.append('kakaoThumbnailUrl', selectedKakao.thumbnail);
      return booksApi.createBook(formData);
    },
    onSuccess: () => {
      Alert.alert('등록 완료', '도서가 등록되었어요!');
      router.back();
    },
    onError: () => {
      Alert.alert('오류', '도서 등록에 실패했어요. 다시 시도해주세요.');
    },
  });

  const handleKakaoSelect = (item: KakaoBookItem) => {
    setSelectedKakao(item);
    setTitle(item.title);
    setAuthor(item.authors.join(', '));
    setPublisher(item.publisher ?? '');
    setIsbn(item.isbn ?? '');
    setSearchQuery('');
  };

  const handleSubmit = () => {
    if (!title.trim()) return Alert.alert('오류', '제목을 입력해주세요');
    if (!author.trim()) return Alert.alert('오류', '저자를 입력해주세요');
    if (!genre) return Alert.alert('오류', '장르를 선택해주세요');
    submit();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <PMIcon name="chevronRight" size={20} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>책 등록하기</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 카카오 검색 */}
        <View style={styles.section}>
          <Text style={styles.label}>카카오 도서 검색</Text>
          <View style={styles.searchRow}>
            <View style={styles.searchInput}>
              <PMIcon name="search" size={16} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="제목, 저자 검색"
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={() => refetch()}
              />
            </View>
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => refetch()}
              activeOpacity={0.85}
            >
              {kakaoLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.searchBtnText}>검색</Text>}
            </TouchableOpacity>
          </View>

          {kakaoResults?.books.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.kakaoItem}
              onPress={() => handleKakaoSelect(item)}
              activeOpacity={0.8}
            >
              <PMBookCover
                title={item.title}
                author={item.authors.join(', ')}
                color="sage"
                width={40}
                height={58}
              />
              <View style={styles.kakaoMeta}>
                <Text style={styles.kakaoTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.kakaoAuthor} numberOfLines={1}>{item.authors.join(', ')}</Text>
                <Text style={styles.kakaoPublisher} numberOfLines={1}>{item.publisher}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 표지 미리보기 */}
        <View style={styles.previewSection}>
          <PMBookCover
            title={title || '제목'}
            author={author || '저자'}
            color={coverColor}
            width={100}
            height={144}
          />
        </View>

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="책 제목"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>저자 *</Text>
          <TextInput
            style={styles.textInput}
            value={author}
            onChangeText={setAuthor}
            placeholder="저자명"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>출판사</Text>
          <TextInput
            style={styles.textInput}
            value={publisher}
            onChangeText={setPublisher}
            placeholder="출판사 (선택)"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* 장르 */}
        <View style={styles.section}>
          <Text style={styles.label}>장르 *</Text>
          <View style={styles.chipGrid}>
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, genre === g && styles.chipActive]}
                onPress={() => setGenre(g)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, genre === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 컨디션 */}
        <View style={styles.section}>
          <Text style={styles.label}>상태 *</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.conditionChip, condition === c && styles.conditionChipActive]}
                onPress={() => setCondition(c)}
                activeOpacity={0.75}
              >
                <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                  {CONDITION_LABELS[c]}
                </Text>
                <Text style={[styles.conditionSub, condition === c && { color: 'rgba(255,255,255,0.8)' }]}>
                  {c === 'LIKE_NEW' ? '거의 새 책' : c === 'GOOD' ? '읽은 흔적 있음' : '사용감 있음'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 표지 색상 */}
        <View style={styles.section}>
          <Text style={styles.label}>표지 색상</Text>
          <View style={styles.colorRow}>
            {COVER_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: bookCoverPalettes[c][0] },
                  coverColor === c && styles.colorDotActive,
                ]}
                onPress={() => setCoverColor(c)}
                activeOpacity={0.8}
              />
            ))}
          </View>
        </View>

        {/* 한줄 소개 */}
        <View style={styles.section}>
          <Text style={styles.label}>한줄 소개</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="책에 대한 짧은 소개를 적어주세요 (최대 200자)"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        {/* 등록 버튼 */}
        <TouchableOpacity
          style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isPending}
        >
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>등록하기</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  section: {
    marginHorizontal: spacing.s4,
    marginBottom: spacing.s5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 14, color: colors.text },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  kakaoItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  kakaoMeta: { flex: 1 },
  kakaoTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  kakaoAuthor: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  kakaoPublisher: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },

  previewSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  textInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: colors.textTertiary, textAlign: 'right', marginTop: 6 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 32, paddingHorizontal: 14,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  conditionRow: { flexDirection: 'row', gap: 8 },
  conditionChip: {
    flex: 1, paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.border,
  },
  conditionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  conditionText: { fontSize: 16, fontWeight: '800', color: colors.text },
  conditionTextActive: { color: '#fff' },
  conditionSub: { fontSize: 10, color: colors.textTertiary, textAlign: 'center' },

  colorRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  colorDot: {
    width: 32, height: 32,
    borderRadius: radius.full,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },

  submitBtn: {
    marginHorizontal: spacing.s4,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.borderStrong },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});
