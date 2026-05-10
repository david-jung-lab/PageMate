package app.pagemate.review.dto;

import app.pagemate.review.Review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long exchangeId,
        Long revieweeId,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {
    public static ReviewResponse of(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getExchange().getId(),
                r.getReviewee().getId(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
