package app.pagemate.review;

import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.exchange.Exchange;
import app.pagemate.exchange.ExchangeRepository;
import app.pagemate.exchange.ExchangeStatus;
import app.pagemate.review.dto.ReviewCreateRequest;
import app.pagemate.review.dto.ReviewResponse;
import app.pagemate.review.dto.UserReviewsResponse;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ExchangeRepository exchangeRepository;
    private final UserRepository userRepository;

    // WF12: 사용자 평가 - SECOND_EXCHANGED 상태에서 리뷰 가능, 양측 완료 시 COMPLETED
    @Transactional
    public ReviewResponse createReview(Long reviewerId, Long exchangeId, ReviewCreateRequest req) {
        Exchange exchange = exchangeRepository.findById(exchangeId)
                .orElseThrow(() -> new PagemateException(ErrorCode.EXCHANGE_NOT_FOUND));

        if (exchange.getStatus() != ExchangeStatus.SECOND_EXCHANGED) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        boolean isRequester  = exchange.getRequester().getId().equals(reviewerId);
        boolean isRespondent = exchange.getRespondent().getId().equals(reviewerId);
        if (!isRequester && !isRespondent) {
            throw new PagemateException(ErrorCode.EXCHANGE_ACCESS_DENIED);
        }

        if (reviewRepository.existsByExchangeIdAndReviewerId(exchangeId, reviewerId)) {
            throw new PagemateException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        User reviewee = isRequester ? exchange.getRespondent() : exchange.getRequester();

        Review review = reviewRepository.save(Review.builder()
                .exchange(exchange)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(req.getRating())
                .comment(req.getComment())
                .build());

        // 양측 모두 평가 완료 시 교환 상태를 COMPLETED로 전환
        boolean requesterReviewed = reviewRepository.existsByExchangeIdAndReviewerId(
                exchangeId, exchange.getRequester().getId());
        boolean respondentReviewed = reviewRepository.existsByExchangeIdAndReviewerId(
                exchangeId, exchange.getRespondent().getId());
        if (requesterReviewed && respondentReviewed) {
            exchange.complete();
        }

        return ReviewResponse.of(review);
    }

    public boolean hasReviewed(Long reviewerId, Long exchangeId) {
        return reviewRepository.existsByExchangeIdAndReviewerId(exchangeId, reviewerId);
    }

    public UserReviewsResponse getUserReviews(Long userId) {
        double avg = reviewRepository.averageRatingByRevieweeId(userId);
        int count = (int) reviewRepository.countByRevieweeId(userId);
        var reviews = reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(UserReviewsResponse.ReviewItem::of)
                .toList();
        return new UserReviewsResponse(avg, count, reviews);
    }
}
