import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  Image, StyleSheet, SafeAreaView, StatusBar, Platform,
  ActivityIndicator, Alert, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import {
  Canvas, useCanvasRef, useImage, Image as SkiaImage,
  Rect, Text as SkiaText, useFont, type SkFont,
} from '@shopify/react-native-skia';
import { colors, spacing, radius } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import { booksApi } from '../../src/features/books/api';
import { KakaoBookItem } from '../../src/features/books/types';

// 폰트 (Skia 캔버스 렌더링용 — 한글/라틴 모두 커버)
const FONT_BOLD = require('@expo-google-fonts/noto-serif-kr/700Bold/NotoSerifKR_700Bold.ttf');
const FONT_REGULAR = require('@expo-google-fonts/noto-serif-kr/400Regular/NotoSerifKR_400Regular.ttf');

const WATERMARK_COLOR = '#4F86C6';

// ─── 계산 헬퍼 ─────────────────────────────────────────────────────────────────

// pace = 시간(초) ÷ 페이지 = 초/페이지
function calcPaceSeconds(totalMinutes: number, pages: number): number | null {
  if (!pages || !totalMinutes) return null;
  return Math.round((totalMinutes * 60) / pages);
}

function formatTimeShort(totalMinutes: number): string {
  if (!totalMinutes) return '—';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTimeKo(totalMinutes: number): string {
  if (!totalMinutes) return '0분';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function formatPaceKo(seconds: number | null): string {
  if (seconds == null) return '-';
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

// ─── Skia 텍스트 폭 측정/말줄임 ────────────────────────────────────────────────

function measureWidth(font: SkFont | null, text: string): number {
  if (!font || !text) return 0;
  try {
    const anyFont = font as any;
    if (typeof anyFont.getTextWidth === 'function') return anyFont.getTextWidth(text);
    if (typeof anyFont.measureText === 'function') {
      const r = anyFont.measureText(text);
      if (r && typeof r.width === 'number') return r.width;
      if (r && typeof r.x2 === 'number') return r.x2 - (r.x1 ?? 0);
    }
  } catch {}
  return text.length * (font.getSize?.() ?? 16) * 0.5;
}

function ellipsize(font: SkFont | null, text: string, maxW: number): string {
  if (!font || measureWidth(font, text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && measureWidth(font, t + '…') > maxW) t = t.slice(0, -1);
  return t + '…';
}

// ─── Skia 카드 ────────────────────────────────────────────────────────────────

function ReadingCardCanvas({
  width, height, canvasRef, imageUri, title, pages, paceSeconds, totalMinutes,
}: {
  width: number;
  height: number;
  canvasRef: ReturnType<typeof useCanvasRef>;
  imageUri: string | null;
  title: string;
  pages: number;
  paceSeconds: number | null;
  totalMinutes: number;
}) {
  const skImage = useImage(imageUri);

  const P = Math.round(width * 0.075);
  const labelSize = Math.round(width * 0.042);
  const valueSize = Math.round(width * 0.115);
  const titleSize = Math.round(width * 0.05);
  const markSize = Math.round(width * 0.05);

  const labelFont = useFont(FONT_REGULAR, labelSize);
  const valueFont = useFont(FONT_BOLD, valueSize);
  const titleFont = useFont(FONT_BOLD, titleSize);
  const markFont = useFont(FONT_BOLD, markSize);

  const blocks = [
    { label: 'distance', value: pages > 0 ? `${pages}pages` : '—' },
    { label: 'pace', value: paceSeconds != null ? `${paceSeconds}s` : '—' },
    { label: 'time', value: formatTimeShort(totalMinutes) },
  ];

  // 상단 좌측 스탯 블록 세로 배치
  const blockGap = Math.round(valueSize * 0.5);
  const labelGap = Math.round(labelSize * 0.45);
  const lines: { x: number; y: number; text: string; font: SkFont | null; color: string }[] = [];
  let cursor = P + labelSize;
  for (const b of blocks) {
    lines.push({ x: P, y: cursor, text: b.label, font: labelFont, color: 'rgba(255,255,255,0.85)' });
    cursor += labelGap + valueSize;
    lines.push({ x: P, y: cursor, text: b.value, font: valueFont, color: '#FFFFFF' });
    cursor += blockGap + labelSize;
  }

  // 워터마크 (우하단)
  const markText = 'PageMate.';
  const markW = measureWidth(markFont, markText);
  const markX = width - P - markW;
  const bottomBaseline = height - P;

  // 책 제목 (좌하단) — 워터마크와 겹치지 않게 말줄임
  const titleMaxW = markX - P - Math.round(width * 0.04);
  const titleText = ellipsize(titleFont, title || '', titleMaxW);

  const fontsReady = labelFont && valueFont && titleFont && markFont;

  return (
    <Canvas ref={canvasRef} style={{ width, height }}>
      {/* 배경: 책 표지 사진 (전체) 또는 폴백 */}
      {skImage ? (
        <SkiaImage image={skImage} x={0} y={0} width={width} height={height} fit="cover" />
      ) : (
        <Rect x={0} y={0} width={width} height={height} color="#2C3E6B" />
      )}

      {/* 어두운 오버레이 */}
      <Rect x={0} y={0} width={width} height={height} color="rgba(0,0,0,0.4)" />

      {fontsReady && (
        <>
          {lines.map((l, i) => (
            <SkiaText key={i} x={l.x} y={l.y} text={l.text} font={l.font} color={l.color} />
          ))}
          {!!titleText && (
            <SkiaText x={P} y={bottomBaseline} text={titleText} font={titleFont} color="#FFFFFF" />
          )}
          <SkiaText x={markX} y={bottomBaseline} text={markText} font={markFont} color={WATERMARK_COLOR} />
        </>
      )}
    </Canvas>
  );
}

// ─── 메인 화면 ─────────────────────────────────────────────────────────────────

export default function ReadingCardScreen() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const canvasRef = useCanvasRef();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<KakaoBookItem | null>(null);
  const [pagesStr, setPagesStr] = useState('');
  const [hoursStr, setHoursStr] = useState('');
  const [minutesStr, setMinutesStr] = useState('');
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);

  const cardW = Math.min(screenW - 32, 420);
  const cardH = Math.round(cardW * 4 / 3);

  const { data: kakaoResults, isLoading: kakaoLoading, refetch } = useQuery({
    queryKey: ['kakao-reading-card-search', searchQuery],
    queryFn: () => booksApi.searchKakao(searchQuery),
    enabled: false,
  });

  const pages = parseInt(pagesStr, 10) || 0;
  const totalMinutes = (parseInt(hoursStr, 10) || 0) * 60 + (parseInt(minutesStr, 10) || 0);
  const paceSeconds = useMemo(() => calcPaceSeconds(totalMinutes, pages), [totalMinutes, pages]);

  const title = selectedBook?.title ?? '';

  // ─ 사진 선택 ─
  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', useCamera ? '카메라 권한을 허용해 주세요.' : '사진 접근 권한을 허용해 주세요.');
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.9 });
    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const choosePhoto = () => {
    Alert.alert('책 표지 사진', '사진을 어떻게 추가할까요?', [
      { text: '카메라로 촬영', onPress: () => pickImage(true) },
      { text: '갤러리에서 선택', onPress: () => pickImage(false) },
      { text: '취소', style: 'cancel' },
    ]);
  };

  // ─ 캔버스 → 파일 ─
  const captureToFile = async (): Promise<string> => {
    const snapshot = canvasRef.current?.makeImageSnapshot();
    if (!snapshot) throw new Error('snapshot-failed');
    const base64 = snapshot.encodeToBase64();
    const fileUri = `${FileSystem.cacheDirectory}pagemate-reading-card.png`;
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    return fileUri;
  };

  const validate = (): boolean => {
    if (!selectedBook) {
      Alert.alert('도서 선택', '공유할 도서를 검색해서 선택해 주세요.');
      return false;
    }
    if (!pages && !totalMinutes) {
      Alert.alert('기록 입력', '읽은 페이지 수 또는 독서 시간을 입력해 주세요.');
      return false;
    }
    return true;
  };

  // ─ 갤러리 저장 ─
  const handleSave = async () => {
    if (!validate()) return;
    setBusy('save');
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('권한 필요', '사진 앨범에 저장하려면 권한을 허용해 주세요.');
        return;
      }
      const fileUri = await captureToFile();
      await MediaLibrary.saveToLibraryAsync(fileUri);
      Alert.alert('저장 완료', '독서 기록 카드를 사진 앨범에 저장했어요.');
    } catch {
      Alert.alert('저장 실패', '카드를 저장하는 중 오류가 발생했어요.');
    } finally {
      setBusy(null);
    }
  };

  // ─ 공유 ─
  const handleShare = async () => {
    if (!validate()) return;
    setBusy('share');
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('공유 불가', '이 기기에서는 공유 기능을 사용할 수 없어요.');
        return;
      }
      const fileUri = await captureToFile();
      await Sharing.shareAsync(fileUri, { mimeType: 'image/png', dialogTitle: '독서 기록 공유' });
    } catch {
      Alert.alert('공유 실패', '공유하는 중 오류가 발생했어요.');
    } finally {
      setBusy(null);
    }
  };

  const handleSelectBook = (item: KakaoBookItem) => {
    setSelectedBook(item);
    setSearchQuery('');
    // 표지 사진을 아직 안 골랐으면 카카오 썸네일을 기본 배경으로
    if (!imageUri && item.thumbnail) setImageUri(item.thumbnail);
  };

  // 웹은 네이티브 모듈 미지원 → 안내
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <PMIcon name="chevronLeft" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>독서 기록 카드</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.webNotice}>
          <PMIcon name="book" size={40} color={colors.textTertiary} />
          <Text style={styles.webNoticeText}>독서 기록 카드는 모바일 앱에서 만들 수 있어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <PMIcon name="chevronLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>독서 기록 카드</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 미리보기 */}
        <View style={styles.previewSection}>
          <View style={[styles.cardShadow, { width: cardW, height: cardH }]}>
            <ReadingCardCanvas
              width={cardW}
              height={cardH}
              canvasRef={canvasRef}
              imageUri={imageUri}
              title={title}
              pages={pages}
              paceSeconds={paceSeconds}
              totalMinutes={totalMinutes}
            />
          </View>
        </View>

        {/* 표지 사진 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>책 표지 사진</Text>
          <TouchableOpacity style={styles.photoBtn} onPress={choosePhoto} activeOpacity={0.85}>
            <PMIcon name="plus" size={18} color={colors.primary} />
            <Text style={styles.photoBtnText}>{imageUri ? '사진 변경' : '사진 추가'}</Text>
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removePhoto} activeOpacity={0.7}>
              <Text style={styles.removePhotoText}>사진 제거</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 도서 검색 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>도서 선택</Text>
          {selectedBook ? (
            <View style={styles.selectedBook}>
              {selectedBook.thumbnail ? (
                <Image source={{ uri: selectedBook.thumbnail }} style={styles.selectedThumb} resizeMode="cover" />
              ) : null}
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedTitle} numberOfLines={2}>{selectedBook.title}</Text>
                <Text style={styles.selectedAuthor}>{selectedBook.authors.join(', ')}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedBook(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
                    onSubmitEditing={() => searchQuery.trim() && refetch()}
                  />
                </View>
                <TouchableOpacity style={styles.searchBtn} onPress={() => searchQuery.trim() && refetch()} activeOpacity={0.85}>
                  {kakaoLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.searchBtnText}>검색</Text>}
                </TouchableOpacity>
              </View>

              {kakaoResults?.books.map((item, i) => (
                <TouchableOpacity key={i} style={styles.kakaoItem} onPress={() => handleSelectBook(item)} activeOpacity={0.8}>
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.kakaoThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.kakaoThumb, styles.kakaoThumbEmpty]}>
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

        {/* 독서 기록 */}
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
              <View>
                <Text style={styles.paceLabel}>자동 계산된 페이스</Text>
                <Text style={styles.paceSub}>{formatTimeKo(totalMinutes)} · {pages}p</Text>
              </View>
              <Text style={styles.paceValue}>{formatPaceKo(paceSeconds)}<Text style={styles.paceUnit}>/페이지</Text></Text>
            </View>
          )}
        </View>

        {/* 버튼 */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.saveBtn, busy != null && styles.btnDisabled]}
            onPress={handleSave}
            disabled={busy != null}
            activeOpacity={0.85}
          >
            {busy === 'save' ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.saveBtnText}>갤러리 저장</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, busy != null && styles.btnDisabled]}
            onPress={handleShare}
            disabled={busy != null}
            activeOpacity={0.85}
          >
            {busy === 'share' ? <ActivityIndicator color="#fff" /> : <Text style={styles.shareBtnText}>공유하기</Text>}
          </TouchableOpacity>
        </View>
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

  previewSection: { alignItems: 'center', paddingTop: spacing.s5, paddingBottom: spacing.s2 },
  cardShadow: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A1D24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, letterSpacing: -0.2, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },

  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primarySoft,
  },
  photoBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary, letterSpacing: -0.2 },
  removePhoto: { alignSelf: 'center', marginTop: 10 },
  removePhotoText: { fontSize: 12, color: colors.textTertiary, textDecorationLine: 'underline' },

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
  kakaoThumbEmpty: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
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
  paceSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  paceValue: { fontSize: 18, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  paceUnit: { fontSize: 12, fontWeight: '400', color: colors.textTertiary },

  btnRow: { flexDirection: 'row', gap: 10, marginHorizontal: spacing.s4, marginTop: spacing.s5 },
  saveBtn: {
    flex: 1,
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.primary, letterSpacing: -0.2 },
  shareBtn: {
    flex: 1,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  btnDisabled: { opacity: 0.6 },

  webNotice: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  webNoticeText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
