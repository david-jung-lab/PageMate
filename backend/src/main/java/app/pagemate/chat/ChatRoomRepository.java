package app.pagemate.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    @Query("SELECT r FROM ChatRoom r " +
           "JOIN FETCH r.book JOIN FETCH r.requester JOIN FETCH r.owner " +
           "WHERE r.requester.id = :userId OR r.owner.id = :userId " +
           "ORDER BY COALESCE(r.lastMessageAt, r.createdAt) DESC")
    List<ChatRoom> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM ChatRoom r WHERE r.book.id = :bookId " +
           "AND r.requester.id = :requesterId")
    Optional<ChatRoom> findByBookIdAndRequesterId(@Param("bookId") Long bookId,
                                                  @Param("requesterId") Long requesterId);

    @Query("SELECT r FROM ChatRoom r WHERE r.exchange.id = :exchangeId")
    Optional<ChatRoom> findByExchangeId(@Param("exchangeId") Long exchangeId);

    @Query("SELECT COUNT(r) > 0 FROM ChatRoom r WHERE r.id = :roomId " +
           "AND (r.requester.id = :userId OR r.owner.id = :userId)")
    boolean existsByIdAndParticipant(@Param("roomId") Long roomId, @Param("userId") Long userId);

    /** 해당 방의 상대와 차단 관계(양방향)인지 */
    @Query("""
            SELECT COUNT(b) > 0 FROM ChatRoom r, UserBlock b
            WHERE r.id = :roomId
              AND ((b.blocker.id = :userId AND b.blocked.id = CASE WHEN r.requester.id = :userId THEN r.owner.id ELSE r.requester.id END)
                OR (b.blocked.id = :userId AND b.blocker.id = CASE WHEN r.requester.id = :userId THEN r.owner.id ELSE r.requester.id END))
            """)
    boolean existsBlockedParticipant(@Param("roomId") Long roomId, @Param("userId") Long userId);
}
