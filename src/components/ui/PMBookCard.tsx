import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, LayoutChangeEvent,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { BookSummary, CoverColor } from '../../features/books/types';

const C = {
  card:  '#FFFFFF',
  text:  '#1A1D24',
  text2: '#5C6270',
  text3: '#9097A3',
  line:  '#ECEEF2',
  line2: '#F0F2F6',
} as const;

const COVER_PALETTE: Record<CoverColor, { bg: string; fg: string }> = {
  blue:   { bg: '#2C3E6B', fg: '#FFFFFF' },
  orange: { bg: '#EFE4D0', fg: '#6B5230' },
  sage:   { bg: '#355238', fg: '#E8DDB0' },
  plum:   { bg: '#7A4F6A', fg: '#FFFFFF' },
  sand:   { bg: '#F4F1E8', fg: '#1A1D24' },
  ink:    { bg: '#3A3E59', fg: '#FFFFFF' },
};

const PinIcon = ({ size = 10, color = C.text3 }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={2} />
  </Svg>
);

function formatDist(d: number | null): string {
  if (d == null) return '근처';
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

interface PMBookCardProps {
  book: BookSummary;
  onPress?: () => void;
}

const PMBookCard: React.FC<PMBookCardProps> = ({ book, onPress }) => {
  const [cardW, setCardW] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== cardW) setCardW(w);
  };

  // 홈 NearBookCard 비율 그대로 (card 155 → book 104×155, imageArea 200)
  const bookW      = cardW > 0 ? Math.round(cardW * 0.67) : 0;
  const bookH      = cardW > 0 ? Math.round(cardW * 1.00) : 0;
  const imageAreaH = cardW > 0 ? Math.round(cardW * 1.29) : 0;

  const { bg, fg } = COVER_PALETTE[book.coverColor] ?? COVER_PALETTE.blue;

  return (
    <TouchableOpacity
      style={styles.card}
      onLayout={onLayout}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* 회색 표지 배경 영역 */}
      <View style={[styles.imageArea, imageAreaH > 0 && { height: imageAreaH }]}>
        {bookW > 0 && (
          // 그림자용 outer (overflow 없음)
          <View style={[styles.bookShadow, { width: bookW, height: bookH }]}>
            {/* 클리핑용 inner */}
            <View style={[styles.bookInner, { width: bookW, height: bookH }]}>
              {book.imageUrl ? (
                <Image source={{ uri: book.imageUrl }} style={styles.bookImage} resizeMode="cover" />
              ) : (
                <View style={[styles.bookPlaceholder, { backgroundColor: bg }]}>
                  <Text style={[styles.bookPTitle, { color: fg }]} numberOfLines={3}>{book.title}</Text>
                  <Text style={[styles.bookPAuthor, { color: fg }]} numberOfLines={2}>{book.author}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* 텍스트 영역 */}
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        <View style={styles.locRow}>
          <PinIcon />
          <Text style={styles.locText}>
            {formatDist(book.distance)} · {book.owner.nickname}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },

  imageArea: {
    height: 180,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: C.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookShadow: {
    borderRadius: 8,
    shadowColor: '#1A1D24',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },

  bookInner: {
    borderRadius: 8,
    overflow: 'hidden',
  },

  bookImage: { width: '100%', height: '100%' },

  bookPlaceholder: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  bookPTitle:  { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, lineHeight: 21, color: '#fff' },
  bookPAuthor: { fontSize: 11, opacity: 0.8, letterSpacing: -0.2, color: '#fff' },

  meta: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 4,
  },
  title:  { fontSize: 14, fontWeight: '700', color: C.text,  letterSpacing: -0.3 },
  author: { fontSize: 12, color: C.text2, letterSpacing: -0.2, marginBottom: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText:{ fontSize: 12, color: C.text3 },
});

export default PMBookCard;
