import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, LayoutChangeEvent,
} from 'react-native';
import PMBookCover from './PMBookCover';
import PMIcon from './PMIcon';
import { BookSummary } from '../../features/books/types';

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

  // cover = 70% of card inner area (card padding 12px * 2 = 24px)
  const coverW = cardW > 0 ? Math.round((cardW - 24) * 0.70) : 0;
  const coverH = coverW > 0 ? Math.round(coverW * 1.45) : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onLayout={onLayout}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* 표지 컨테이너 */}
      <View style={styles.coverContainer}>
        {coverW > 0 && (
          <View style={[styles.coverWrap, { width: coverW, height: coverH }]}>
            {book.imageUrl ? (
              <Image
                source={{ uri: book.imageUrl }}
                style={styles.coverImg}
                resizeMode="cover"
              />
            ) : (
              <PMBookCover
                title={book.title}
                author={book.author}
                color={book.coverColor}
                width={coverW}
                height={coverH}
              />
            )}
          </View>
        )}
      </View>

      {/* 텍스트 영역 */}
      <View style={styles.textArea}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        <View style={styles.distanceRow}>
          <PMIcon name="location" size={11} color="#9CA3AF" />
          <Text style={styles.distanceText}>
            {book.distance != null
              ? book.distance < 1
                ? `${Math.round(book.distance * 1000)}m`
                : `${book.distance.toFixed(1)}km`
              : '위치 정보 없음'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#D8D8D4',
  },

  /* 표지 컨테이너 - 회색 배경, 여백 */
  coverContainer: {
    backgroundColor: '#F5F5F3',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 표지 자체 */
  coverWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  coverImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },

  /* 상태 뱃지 */
  condBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  condBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  /* 텍스트 영역 */
  textArea: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 20,
    paddingBottom: 10,
  },
  author: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 5,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
  },
  distanceText: {
    fontSize: 11,
    lineHeight: 11,
    color: '#9CA3AF',
    includeFontPadding: false,
  },
});

export default PMBookCard;
