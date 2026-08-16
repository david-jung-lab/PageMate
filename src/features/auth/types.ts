export interface AuthUser {
  id: number;
  nickname: string;
  handle: string;
  profileImage: string | null;
  isNewUser: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
}

/** 심사용 체험 계정 (BORROWER: 빌리는 사람, LENDER: 빌려주는 사람) */
export type DemoAccountKey = 'BORROWER' | 'LENDER';

export interface DemoAccount {
  key: DemoAccountKey;
  nickname: string;
  role: string;
  description: string;
}

export interface DemoAccountsResponse {
  available: boolean;
  accounts: DemoAccount[];
}
