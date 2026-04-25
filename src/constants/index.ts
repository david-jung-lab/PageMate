export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export const GENRES = ['소설', '에세이', '자기계발', 'SF', '인문', '시', '역사', '과학'];

export const CONDITION_LABELS: Record<string, string> = {
  LIKE_NEW: '상',
  GOOD: '중',
  ACCEPTABLE: '하',
};

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: '교환가능',
  IN_PROGRESS: '교환중',
  COMPLETED: '교환완료',
};
