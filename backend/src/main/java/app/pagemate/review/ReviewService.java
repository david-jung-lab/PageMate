package app.pagemate.review;

import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.exchange.Exchange;
import app.pagemate.exchange.ExchangeRepository;
import app.pagemate.exchange.ExchangeStatus;
import app.pagemate.review.dto.ReviewCreateRequest;
import app.pagemate.review.dto.ReviewResponse;
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

    @Transactional
    public ReviewResponse createReview(Long reviewerId, Long exchangeId, ReviewCreateRequest req) {
        Exchange exchange = exchangeRepository.findById(exchangeId)
                .orElseThrow(() -> new PagemateException(ErrorCode.EXCHANGE_NOT_FOUND));

        if (exchange.getStatus() != ExchangeStatus.COMPLETED) {
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

        return ReviewResponse.of(review);
    }

    public boolean hasReviewed(Long reviewerId, Long exchangeId) {
        return reviewRepository.existsByExchangeIdAndReviewerId(exchangeId, reviewerId);
    }
}
