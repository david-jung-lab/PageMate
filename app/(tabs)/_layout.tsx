import { useEffect } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import PMTabBar from '../../src/components/ui/PMTabBar';
import { useAuthStore } from '../../src/store';

type TabId = 'home' | 'search' | 'swap' | 'chat' | 'me';

const pathToTab: Record<string, TabId> = {
  '/': 'home',
  '/search': 'search',
  '/swap': 'swap',
  '/chat': 'chat',
  '/me': 'me',
};

const tabToPath: Record<TabId, string> = {
  home: '/',
  search: '/search',
  swap: '/swap',
  chat: '/chat',
  me: '/me',
};

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathToTab[pathname] ?? 'home';
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isHydrated, isAuthenticated]);

  return (
    <Tabs
      tabBar={() => (
        <PMTabBar
          active={active}
          onChange={(id) => router.push(tabToPath[id] as any)}
        />
      )}
      screenOptions={{ headerShown: false }}
    />
  );
}
