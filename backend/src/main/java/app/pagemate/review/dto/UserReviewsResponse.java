package app.pagemate.review.dto;

import app.pagemate.review.Review;

import java.time.LocalDateTime;
import java.util.List;

public record UserReviewsResponse(
        double averageRating,
        int reviewCount,
        List<ReviewItem> reviews
) {
    public record ReviewItem(
            Long id,
            String reviewerNickname,
            int rating,
            String comment,
            LocalDateTime createdAt
    ) {
        public static ReviewItem of(Review r) {
            return new ReviewItem(
                    r.getId(),
                    r.getReviewer().getNickname(),
                    r.getRating(),
                    r.getComment(),
                    r.getCreatedAt()
            );
        }
    }
}
