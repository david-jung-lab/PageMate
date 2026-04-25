import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/store';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="books" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="reading" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="users" />
        <Stack.Screen name="legal" />
      </Stack>
    </QueryClientProvider>
  );
}
