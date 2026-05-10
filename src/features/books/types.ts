export type BookStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
export type CoverColor = 'blue' | 'orange' | 'sage' | 'plum' | 'sand' | 'ink';

export interface BookOwner {
  id: number;
  nickname: string;
  profileImage: string | null;
}

export interface BookOwnerDetail extends BookOwner {
  handle: string | null;
  bio: string | null;
  tags: string[];
  bookCount: number;
  exchangeCount: number;
  rating: number | null;
}

export interface BookSummary {
  id: number;
  title: string;
  author: string;
  genre: string;
  imageUrl: string | null;
  coverColor: CoverColor;
  owner: BookOwner;
  status: BookStatus;
  neighborhood: string | null;
  createdAt: string;
}

export interface BookDetail {
  id: number;
  title: string;
  author: string;
  publisher: string | null;
  isbn: string | null;
  genre: string;
  description: string | null;
  imageUrl: string | null;
  coverColor: CoverColor;
  status: BookStatus;
  neighborhood: string | null;
  owner: BookOwnerDetail;
  createdAt: string;
}

export interface BookPage {
  content: BookSummary[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}

export interface KakaoBookItem {
  title: string;
  authors: string[];
  publisher: string;
  isbn: string | null;
  thumbnail: string | null;
  contents: string | null;
  datetime: string | null;
}

export interface KakaoBookSearchResult {
  books: KakaoBookItem[];
  totalCount: number;
  isEnd: boolean;
}
