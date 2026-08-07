import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Tabs, usePathname, useRouter } from 'expo-router';
import PMTabBar from '../../src/components/ui/PMTabBar';
import { registerPushToken, routeFromNotification } from '../../src/lib/push';

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

  // 로그인 후 진입 시: 푸시 토큰 등록 + 알림 탭 시 딥링크 처리
  useEffect(() => {
    registerPushToken();
    Notifications.setBadgeCountAsync(0).catch(() => {});

    // 앱이 종료 상태에서 알림 탭으로 열린 경우
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) routeFromNotification(response.notification.request.content.data);
    });

    // 앱 실행 중 알림 탭
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromNotification(response.notification.request.content.data);
    });
    return () => sub.remove();
  }, []);

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
