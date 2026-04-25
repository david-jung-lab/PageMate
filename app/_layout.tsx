import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/store';
import {
  useFonts,
  NotoSerifKR_400Regular,
  NotoSerifKR_700Bold,
} from '@expo-google-fonts/noto-serif-kr';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useFonts({ NotoSerifKR_400Regular, NotoSerifKR_700Bold });

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
