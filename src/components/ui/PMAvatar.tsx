import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { radius } from '../../theme/tokens';

export type AvatarColor = 'blue' | 'orange' | 'sage' | 'plum' | 'sand' | 'ink';

interface PMAvatarProps {
  name: string;
  size?: number;
  color?: AvatarColor | string;
  imageUrl?: string;
}

const palette: Record<AvatarColor, string> = {
  blue: '#4F86C6',
  orange: '#F4A261',
  sage: '#8FA889',
  plum: '#7B5E8C',
  sand: '#C9B79C',
  ink: '#2A3340',
};

const PMAvatar: React.FC<PMAvatarProps> = ({ name, size = 40, color = 'blue', imageUrl }) => {
  const initial = (name || '?').trim()[0];
  const bg = palette[color as AvatarColor] ?? palette.blue;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.base, { width: size, height: size, borderRadius: radius.full }]}
      />
    );
  }

  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: radius.full, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default PMAvatar;
