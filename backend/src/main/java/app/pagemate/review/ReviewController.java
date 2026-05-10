package app.pagemate.review;

import app.pagemate.common.response.ApiResponse;
import app.pagemate.review.dto.ReviewCreateRequest;
import app.pagemate.review.dto.ReviewResponse;
import app.pagemate.review.dto.UserReviewsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/exchanges/{exchangeId}/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> create(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long exchangeId,
            @Valid @RequestBody ReviewCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.createReview(userId, exchangeId, req)));
    }

    @GetMapping("/exchanges/{exchangeId}/reviews/status")
    public ResponseEntity<ApiResponse<Boolean>> hasReviewed(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long exchangeId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.hasReviewed(userId, exchangeId)));
    }

    @GetMapping("/v1/users/{userId}/reviews")
    public ResponseEntity<ApiResponse<UserReviewsResponse>> getUserReviews(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getUserReviews(userId)));
    }
}
