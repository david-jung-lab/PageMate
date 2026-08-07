import { Platform } from 'react-native';

// 웹(브라우저)에서는 localhost, 네이티브 기기에서는 로컬 네트워크 IP 사용
const NATIVE_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
export const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:8080' : NATIVE_API_URL;

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
export const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '';

// App Store 심사관용 체험 로그인 키. 비어 있으면 체험 로그인 버튼을 노출하지 않는다.
export const DEMO_LOGIN_KEY = process.env.EXPO_PUBLIC_DEMO_LOGIN_KEY ?? '';

export const GENRES = [
  { id: 'novel',      label: '소설' },
  { id: 'essay',      label: '에세이' },
  { id: 'selfdev',    label: '자기계발' },
  { id: 'biz',        label: '경제경영' },
  { id: 'humanities', label: '인문사회' },
  { id: 'scienceSF',  label: '과학SF' },
  { id: 'poetry',     label: '시' },
] as const;

export const GENRE_LABELS: Record<string, string> = {
  novel: '소설',
  essay: '에세이',
  selfdev: '자기계발',
  biz: '경제경영',
  humanities: '인문사회',
  scienceSF: '과학SF',
  poetry: '시',
  science: '과학SF',
  scifi: 'SF',
  인문: '인문사회',
  역사: '역사',
  과학: '과학SF',
  소설: '소설',
  에세이: '에세이',
  자기계발: '자기계발',
  시: '시',
};

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: '교환가능',
  IN_PROGRESS: '교환중',
  COMPLETED: '교환완료',
};
