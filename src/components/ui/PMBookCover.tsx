import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { bookCoverPalettes } from '../../theme/tokens';

interface PMBookCoverProps {
  title: string;
  author: string;
  color?: string;
  width?: number;
  height?: number;
}

const PMBookCover: React.FC<PMBookCoverProps> = ({
  title,
  author,
  color = 'sage',
  width = 80,
  height = 116,
}) => {
  const palette = bookCoverPalettes[color] ?? bookCoverPalettes.sage;
  const isLarge = width > 90;

  return (
    <LinearGradient
      colors={palette}
      start={{ x: 0.15, y: 0.15 }}
      end={{ x: 1, y: 1 }}
      style={[styles.cover, { width, height }]}
    >
      {/* Spine accent */}
      <View style={styles.spine} />
      <Text style={[styles.title, { fontSize: isLarge ? 13 : 11 }]} numberOfLines={4}>
        {title}
      </Text>
      <Text style={[styles.author, { fontSize: isLarge ? 10 : 9 }]} numberOfLines={1}>
        {author}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cover: {
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    padding: 12,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  spine: {
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  title: {
    color: '#fff',
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: -0.1,
  },
  author: {
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
  },
});

export default PMBookCover;
