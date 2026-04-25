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
