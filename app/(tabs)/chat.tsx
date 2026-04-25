import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { colors, spacing } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.topBar}>
        <Text style={styles.title}>메시지</Text>
      </View>
      <View style={styles.center}>
        <PMIcon name="chat" size={40} color={colors.borderStrong} />
        <Text style={styles.text}>채팅 기능은 준비 중이에요</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    paddingHorizontal: spacing.s4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { fontSize: 14, color: colors.textTertiary },
});
