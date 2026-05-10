import { Stack, useRouter, useSegments } from 'expo-router';
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

// 로그인 없이 접근 가능한 최상위 세그먼트
const PUBLIC_SEGMENTS = new Set(['(auth)', 'legal']);

function AuthGuard() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    const root = segments[0] as string | undefined;

    // 스플래시(root index) / 공개 세그먼트는 통과
    if (!root || PUBLIC_SEGMENTS.has(root)) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isHydrated, segments]);

  return null;
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useFonts({ NotoSerifKR_400Regular, NotoSerifKR_700Bold });

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
