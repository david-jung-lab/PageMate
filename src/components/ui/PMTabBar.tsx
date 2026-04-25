import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';
import PMIcon from './PMIcon';

type TabId = 'home' | 'search' | 'swap' | 'chat' | 'me';

interface PMTabBarProps {
  active?: TabId;
  onChange?: (id: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: React.ComponentProps<typeof PMIcon>['name'] }[] = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'search', label: '탐색', icon: 'search' },
  { id: 'swap', label: '교환', icon: 'swap' },
  { id: 'chat', label: '메시지', icon: 'chat' },
  { id: 'me', label: '마이', icon: 'user' },
];

const PMTabBar: React.FC<PMTabBarProps> = ({ active = 'home', onChange }) => (
  <View style={styles.bar}>
    {TABS.map((t) => {
      const isActive = active === t.id;
      return (
        <TouchableOpacity
          key={t.id}
          style={styles.tab}
          onPress={() => onChange?.(t.id)}
          activeOpacity={0.7}
        >
          <PMIcon
            name={t.icon}
            size={22}
            color={isActive ? colors.primary : colors.textTertiary}
            strokeWidth={isActive ? 2 : 1.6}
          />
          <Text style={[styles.label, { color: isActive ? colors.primary : colors.textTertiary, fontWeight: isActive ? '700' : '500' }]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 64,
    paddingBottom: 4,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: -0.1,
    marginTop: 2,
  },
});

export default PMTabBar;
