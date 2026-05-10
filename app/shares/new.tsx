import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  Image, StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Share, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import { booksApi } from '../../src/features/books/api';
import { KakaoBookItem } from '../../src/features/books/types';

// ─── Pace calculation helpers ─────────────────────────────────────────────────

function calcPaceSeconds(totalMinutes: number, pages: number): number | null {
  if (!pages || !totalMinutes) return null;
  return Math.round((totalMinutes * 60) / pages);
}

function formatTime(totalMinutes: number): string {
  if (!totalMinutes) return '0분';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function formatPace(seconds: number | null): string {
  if (seconds == null) return '-';
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

// ─── Template Preview ─────────────────────────────────────────────────────────

function TemplateCard({
  title,
  imageUri,
  pages,
  paceSeconds,
  totalMinutes,
}: {
  title: string;
  imageUri: string | null;
  pages: number;
  paceSeconds: number | null;
  totalMinutes: number;
}) {
  return (
    <View style={tplStyles.card}>
      {/* Book cover */}
      <View style={tplStyles.coverArea}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={tplStyles.coverImg} resizeMode="cover" />
        ) : (
          <View style={tplStyles.coverPlaceholder}>
            <PMIcon name="book" size={32} color="rgba(255,255,255,0.5)" />
            <Text style={tplStyles.coverPlaceholderText}>
              {title || '도서 제목'}
            </Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={tplStyles.statsRow}>
        <StatBox label="거리" value={pages > 0 ? `${pages}p` : '-'} />
        <View style={tplStyles.statDivider} />
        <StatBox label="페이스" value={formatPace(paceSeconds)} />
        <View style={tplStyles.statDivider} />
        <StatBox label="시간" value={totalMinutes > 0 ? formatTime(totalMinutes) : '-'} />
      </View>

      {/* Footer */}
      <View style={tplStyles.footer}>
        <Text style={tplStyles.bookTitle} numberOfLines={1}>
          {title || '도서 제목을 검색해 주세요'}
        </Text>
        <Text style={tplStyles.watermark}>PageMate.</Text>
      </View>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={tplStyles.statBox}>
      <Text style={tplStyles.statValue}>{value}</Text>
      <Text style={tplStyles.statLabel}>{label}</Text>
    </View>
  );
}

const tplStyles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#1A1D24',
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverArea: {
    flex: 1,
  },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: '#2C3E6B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  coverPlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1A1D24',
    paddingVertical: 14,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, backgroundColor: '#333' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: '#9097A3', letterSpacing: 0.5 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111318',
  },
  bookTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },
  watermark: { fontSize: 12, fontWeight: '700', color: '#4A6CF7', letterSpacing: 0.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ShareTemplateScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<KakaoBookItem | null>(null);
  const [pagesStr, setPagesStr] = useState('');
  const [hoursStr, setHoursStr] = useState('');
  const [minutesStr, setMinutesStr] = useState('');
  const [sharing, setSharing] = useState(false);

  const { data: kakaoResults, isLoading: kakaoLoading, refetch } = useQuery({
    queryKey: ['kakao-share-search', searchQuery],
    queryFn: () => booksApi.searchKakao(searchQuery),
    enabled: false,
  });

  const pages = parseInt(pagesStr, 10) || 0;
  const totalMinutes = (parseInt(hoursStr, 10) || 0) * 60 + (parseInt(minutesStr, 10) || 0);
  const paceSeconds = calcPaceSeconds(totalMinutes, pages);

  const handleSelectBook = (item: KakaoBookItem) => {
    setSelectedBook(item);
    setSearchQuery('');
  };

  const handleShare = async () => {
    if (!selectedBook) {
      Alert.alert('도서 선택', '공유할 도서를 검색해서 선택해 주세요.');
      return;
    }
    if (!pages && !totalMinutes) {
      Alert.alert('기록 입력', '읽은 페이지 수 또는 독서 시간을 입력해 주세요.');
      return;
    }

    setSharing(true);
    try {
      const pace = paceSeconds ? `페이스: ${formatPace(paceSeconds)}/p` : '';
      const timeStr = totalMinutes ? `시간: ${formatTime(totalMinutes)}` : '';
      const pagesText = pages ? `${pages}페이지` : '';

      const message = [
        `📚 ${selectedBook.title}`,
        `${[pagesText, pace, timeStr].filter(Boolean).join(' · ')}`,
        '',
        'PageMate로 독서 기록을 공유해 보세요!',
      ].join('\n');

      await Share.share({ message });
    } catch {
      Alert.alert('공유 실패', '공유 중 오류가 발생했어요.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <PMIcon name="chevronLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>독서 기록 공유</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Template Preview */}
        <View style={styles.previewSection}>
          <TemplateCard
            title={selectedBook?.title ?? ''}
            imageUri={selectedBook?.thumbnail ?? null}
            pages={pages}
            paceSeconds={paceSeconds}
            totalMinutes={totalMinutes}
          />
        </View>

        {/* Book Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>도서 검색</Text>
          {selectedBook ? (
            <View style={styles.selectedBook}>
              {selectedBook.thumbnail ? (
                <Image source={{ uri: selectedBook.thumbnail }} style={styles.selectedThumb} resizeMode="cover" />
              ) : null}
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedTitle} numberOfLines={2}>{selectedBook.title}</Text>
                <Text style={styles.selectedAuthor}>{selectedBook.authors.join(', ')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedBook(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <PMIcon name="close" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <PMIcon name="search" size={16} color={colors.textTertiary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="책 제목, 저자 검색"
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    onSubmitEditing={() => refetch()}
                  />
                </View>
                <TouchableOpacity style={styles.searchBtn} onPress={() => refetch()} activeOpacity={0.85}>
                  {kakaoLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.searchBtnText}>검색</Text>}
                </TouchableOpacity>
              </View>

              {kakaoResults?.books.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.kakaoItem}
                  onPress={() => handleSelectBook(item)}
                  activeOpacity={0.8}
                >
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.kakaoThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.kakaoThumb, { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }]}>
                      <PMIcon name="book" size={16} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={styles.kakaoMeta}>
                    <Text style={styles.kakaoTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.kakaoAuthor} numberOfLines={1}>{item.authors.join(', ')}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Reading Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>독서 기록</Text>

          <Text style={styles.fieldLabel}>읽은 페이지</Text>
          <TextInput
            style={styles.textInput}
            value={pagesStr}
            onChangeText={setPagesStr}
            placeholder="예: 234"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>독서 시간</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeInputWrap}>
              <TextInput
                style={styles.timeInput}
                value={hoursStr}
                onChangeText={setHoursStr}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
              <Text style={styles.timeUnit}>시간</Text>
            </View>
            <View style={styles.timeInputWrap}>
              <TextInput
                style={styles.timeInput}
                value={minutesStr}
                onChangeText={setMinutesStr}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
              <Text style={styles.timeUnit}>분</Text>
            </View>
          </View>

          {paceSeconds != null && (
            <View style={styles.paceResult}>
              <Text style={styles.paceLabel}>자동 계산된 페이스</Text>
              <Text style={styles.paceValue}>{formatPace(paceSeconds)}<Text style={styles.paceUnit}>/페이지</Text></Text>
            </View>
          )}
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
          onPress={handleShare}
          disabled={sharing}
          activeOpacity={0.85}
        >
          {sharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.shareBtnText}>공유하기</Text>
          )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  previewSection: {
    padding: spacing.s4,
    paddingBottom: 0,
  },

  section: {
    marginHorizontal: spacing.s4,
    marginTop: spacing.s5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },

  selectedBook: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  selectedThumb: { width: 40, height: 58, borderRadius: 4 },
  selectedInfo: { flex: 1 },
  selectedTitle: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 20 },
  selectedAuthor: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  searchInputWrap: {
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
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
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
  kakaoThumb: { width: 38, height: 54, borderRadius: 4, flexShrink: 0 },
  kakaoMeta: { flex: 1 },
  kakaoTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  kakaoAuthor: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

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
  timeRow: { flexDirection: 'row', gap: 12 },
  timeInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  timeInput: { flex: 1, fontSize: 14, color: colors.text },
  timeUnit: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  paceResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paceLabel: { fontSize: 13, color: colors.textSecondary },
  paceValue: { fontSize: 18, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  paceUnit: { fontSize: 12, fontWeight: '400', color: colors.textTertiary },

  shareBtn: {
    marginHorizontal: spacing.s4,
    marginTop: spacing.s5,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnDisabled: { backgroundColor: colors.borderStrong },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});
