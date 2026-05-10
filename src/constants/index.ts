import { Platform } from 'react-native';

// 웹(브라우저)에서는 localhost, 네이티브 기기에서는 로컬 네트워크 IP 사용
const NATIVE_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
export const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:8080' : NATIVE_API_URL;

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
export const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '';

export const GENRES = ['소설', '에세이', '자기계발', 'SF', '인문', '시', '역사', '과학'];

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: '교환가능',
  IN_PROGRESS: '교환중',
  COMPLETED: '교환완료',
};
