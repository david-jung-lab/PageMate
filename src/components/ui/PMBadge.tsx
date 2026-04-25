import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../../theme/tokens';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'solid';
type BadgeSize = 'sm' | 'md';

interface PMBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: colors.surface2, color: colors.textSecondary },
  primary: { bg: colors.primarySoft, color: colors.primary },
  secondary: { bg: colors.secondarySoft, color: '#B6713A' },
  success: { bg: colors.successSoft, color: colors.success },
  warning: { bg: colors.warningSoft, color: '#A07626' },
  danger: { bg: colors.dangerSoft, color: colors.danger },
  solid: { bg: colors.text, color: '#fff' },
};

const PMBadge: React.FC<PMBadgeProps> = ({ children, variant = 'default', size = 'md' }) => {
  const v = variantStyles[variant];
  const isSm = size === 'sm';

  return (
    <View style={[
      styles.base,
      { backgroundColor: v.bg, height: isSm ? 20 : 24, paddingHorizontal: isSm ? 8 : 10 },
    ]}>
      <Text style={[
        styles.text,
        { color: v.color, fontSize: isSm ? 11 : 12 },
      ]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});

export default PMBadge;
