import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { notificationApi } from '@/features/notifications/api';
import type { NotificationType } from '@/features/notifications/types';

// 앱이 포그라운드일 때도 배너·사운드·배지를 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * 권한 요청 → Expo 푸시 토큰 획득.
 * 실기기가 아니거나 권한 거부 시 null (앱 동작엔 영향 없음).
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // 시뮬레이터/에뮬레이터는 원격 푸시 불가

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#4A6CF7',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;
  if (!projectId) return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

/** 로그인 후 호출: 토큰 획득 → 백엔드 등록. 실패해도 조용히 무시. */
export async function registerPushToken(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await notificationApi.registerPushToken(token);
  } catch {
    // 푸시 등록 실패는 앱 사용에 영향 없음
  }
}

/** 알림 data 페이로드 기준으로 해당 화면 이동 */
export function routeFromNotification(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const { type, referenceId } = data as { type?: NotificationType; referenceId?: number | string };

  if (type === 'CHAT_MESSAGE' && referenceId != null) {
    router.push(`/chat/${referenceId}` as any);
    return;
  }
  // 교환 관련 알림은 교환 목록(swap)으로, 그 외는 알림함으로
  const exchangeTypes: NotificationType[] = [
    'EXCHANGE_REQUEST',
    'EXCHANGE_ACCEPTED',
    'EXCHANGE_REJECTED',
    'EXCHANGE_COMPLETED',
    'PLEDGE_REQUESTED',
    'SECOND_DUE',
    'REVIEW_REQUESTED',
  ];
  if (type && exchangeTypes.includes(type)) {
    router.push('/swap' as any);
    return;
  }
  router.push('/notifications' as any);
}
