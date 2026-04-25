import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';
import { BookSummary } from '../../features/books/types';
import { CONDITION_LABELS, STATUS_LABELS } from '../../constants';
import PMBookCover from './PMBookCover';
import PMBadge from './PMBadge';
import PMIcon from './PMIcon';

interface PMBookCardProps {
  book: BookSummary;
  onPress?: () => void;
}

const statusVariant = (status: string) => {
  if (status === 'AVAILABLE') return 'success' as const;
  if (status === 'IN_PROGRESS') return 'primary' as const;
  return 'default' as const;
};

const PMBookCard: React.FC<PMBookCardProps> = ({ book, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.coverWrap}>
      {book.imageUrl ? (
        <Image source={{ uri: book.imageUrl }} style={styles.coverImg} resizeMode="cover" />
      ) : (
        <PMBookCover
          title={book.title}
          author={book.author}
          color={book.coverColor}
          width={72}
          height={104}
        />
      )}
    </View>

    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
      <Text style={styles.author} numberOfLines={1}>{book.author}</Text>

      <View style={styles.badges}>
        <PMBadge variant="default" size="sm">{book.genre}</PMBadge>
        <PMBadge variant="default" size="sm">{CONDITION_LABELS[book.condition]}</PMBadge>
        <PMBadge variant={statusVariant(book.status)} size="sm">
          {STATUS_LABELS[book.status]}
        </PMBadge>
      </View>

      <View style={styles.footer}>
        <Text style={styles.owner} numberOfLines={1}>{book.owner.nickname}</Text>
        {book.distance != null && (
          <View style={styles.distanceRow}>
            <PMIcon name="location" size={11} color={colors.textTertiary} />
            <Text style={styles.distance}>
              {book.distance < 1
                ? `${Math.round(book.distance * 1000)}m`
                : `${book.distance.toFixed(1)}km`}
            </Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  coverWrap: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  coverImg: {
    width: 72,
    height: 104,
    borderRadius: radius.sm,
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  author: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  owner: {
    fontSize: 11,
    color: colors.textTertiary,
    flex: 1,
    marginRight: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distance: {
    fontSize: 11,
    color: colors.textTertiary,
  },
});

export default PMBookCard;
