export interface Review {
  id: number;
  exchangeId: number;
  revieweeId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}
