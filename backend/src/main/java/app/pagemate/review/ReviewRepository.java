package app.pagemate.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByExchangeIdAndReviewerId(Long exchangeId, Long reviewerId);
    Optional<Review> findByExchangeIdAndReviewerId(Long exchangeId, Long reviewerId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.reviewee.id = :userId")
    double averageRatingByRevieweeId(Long userId);

    long countByRevieweeId(Long userId);

    List<Review> findByRevieweeIdOrderByCreatedAtDesc(Long revieweeId);
}
