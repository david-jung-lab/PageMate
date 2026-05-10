package app.pagemate.review;

import app.pagemate.common.response.ApiResponse;
import app.pagemate.review.dto.ReviewCreateRequest;
import app.pagemate.review.dto.ReviewResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/exchanges/{exchangeId}/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> create(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long exchangeId,
            @Valid @RequestBody ReviewCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.createReview(userId, exchangeId, req)));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Boolean>> hasReviewed(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long exchangeId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.hasReviewed(userId, exchangeId)));
    }
}
