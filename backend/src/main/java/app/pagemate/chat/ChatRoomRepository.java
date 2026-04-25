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
}
