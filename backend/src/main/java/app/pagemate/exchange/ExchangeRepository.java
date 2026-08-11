package app.pagemate.exchange;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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

    @Query("SELECT COUNT(e) FROM Exchange e WHERE (e.requester.id = :userId OR e.respondent.id = :userId) AND e.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") ExchangeStatus status);

    @Query("SELECT e FROM Exchange e WHERE (e.requester.id = :userId OR e.respondent.id = :userId) AND e.status IN :statuses")
    List<Exchange> findByUserIdAndStatusIn(@Param("userId") Long userId,
                                           @Param("statuses") List<ExchangeStatus> statuses);

    // WF10: D-3/D-1/D-Day 알림 스케줄러용 - 특정 due_date의 FIRST_EXCHANGED 목록 조회
    @Query("SELECT e FROM Exchange e JOIN FETCH e.requester JOIN FETCH e.respondent WHERE e.status = :status AND e.dueDate = :dueDate")
    List<Exchange> findByStatusAndDueDate(@Param("status") ExchangeStatus status, @Param("dueDate") LocalDate dueDate);
}
