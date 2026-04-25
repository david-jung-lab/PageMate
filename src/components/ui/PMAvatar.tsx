import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius } from '../../theme/tokens';

type AvatarColor = 'blue' | 'orange' | 'sage' | 'plum' | 'sand' | 'ink';

interface PMAvatarProps {
  name: string;
  size?: number;
  color?: AvatarColor;
}

const palette: Record<AvatarColor, string> = {
  blue: '#4F86C6',
  orange: '#F4A261',
  sage: '#8FA889',
  plum: '#7B5E8C',
  sand: '#C9B79C',
  ink: '#2A3340',
};

const PMAvatar: React.FC<PMAvatarProps> = ({ name, size = 40, color = 'blue' }) => {
  const initial = (name || '?').trim()[0];
  return (
    <View style={[
      styles.base,
      {
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor: palette[color] ?? palette.blue,
      },
    ]}>
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
