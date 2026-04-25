export type CoverColor = 'blue' | 'orange' | 'sage' | 'plum' | 'sand' | 'ink';

export interface ReadingRecord {
  id: number;
  userId: number;
  bookTitle: string;
  author: string;
  isbn: string | null;
  rating: number;
  memo: string | null;
  imageUrl: string | null;
  coverColor: CoverColor;
  isPublic: boolean;
  readAt: string;      // 'YYYY-MM-DD'
  createdAt: string;
}

export interface ReadingRecordRequest {
  bookTitle: string;
  author: string;
  isbn?: string;
  rating: number;      // 1~5
  memo?: string;
  imageUrl?: string;
  coverColor?: CoverColor;
  isPublic?: boolean;
  readAt: string;      // 'YYYY-MM-DD'
}

export interface ReadingRecordPage {
  content: ReadingRecord[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}
