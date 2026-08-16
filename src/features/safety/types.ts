export type ReportTargetType = 'USER' | 'BOOK' | 'MESSAGE' | 'REVIEW';

export type ReportReason = 'SPAM' | 'ABUSE' | 'INAPPROPRIATE' | 'FRAUD' | 'OTHER';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: '스팸·광고',
  ABUSE: '욕설·괴롭힘',
  INAPPROPRIATE: '부적절하거나 불쾌한 내용',
  FRAUD: '사기·거래 불이행',
  OTHER: '기타',
};

export interface ReportRequest {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  detail?: string;
}

export interface BlockedUser {
  id: number;
  nickname: string | null;
  handle: string | null;
  profileImage: string | null;
  avatarColor: string | null;
  blockedAt: string;
}
