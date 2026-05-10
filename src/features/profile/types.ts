export interface Profile {
  id: number;
  nickname: string;
  handle: string;
  profileImage: string | null;
  bio: string | null;
  avatarColor: string | null;
  location: string | null;
  tags: string[];
  bookCount: number;
  exchangeCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ProfileUpdateParams {
  nickname?: string;
  bio?: string;
  location?: string;
  avatarColor?: string;
  tags?: string[];
  image?: { uri: string; type: string; name: string };
}
