export interface Review {
  id: number;
  exchangeId: number;
  revieweeId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface UserReviewItem {
  id: number;
  reviewerNickname: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface UserReviews {
  averageRating: number;
  reviewCount: number;
  reviews: UserReviewItem[];
}
