package app.pagemate.exchange;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExchangeRepository extends JpaRepository<Exchange, Long> {

    boolean existsByRequesterIdAndRequestedBookIdAndStatusIn(
            Long requesterId, Long requestedBookId, List<ExchangeStatus> statuses);

    @Query("""
            SELECT e FROM Exchange e
            WHERE (e.requester.id = :userId OR e.respondent.id = :userId)
              AND (:status IS NULL OR e.status = :status)
            ORDER BY e.createdAt DESC
            """)
    Page<Exchange> findMyExchanges(
            @Param("userId") Long userId,
            @Param("status") ExchangeStatus status,
            Pageable pageable);
}
