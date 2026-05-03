package app.pagemate.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.sender " +
           "WHERE m.chatRoom.id = :roomId AND (:cursor IS NULL OR m.id < :cursor) " +
           "ORDER BY m.id DESC")
    List<Message> findByRoomIdWithCursor(@Param("roomId") Long roomId,
                                         @Param("cursor") Long cursor,
                                         org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.chatRoom.id = :roomId AND (:lastReadId IS NULL OR m.id > :lastReadId)")
    long countUnreadAfter(@Param("roomId") Long roomId, @Param("lastReadId") Long lastReadId);

    @Query("SELECT m FROM Message m WHERE m.chatRoom.id = :roomId ORDER BY m.id DESC LIMIT 1")
    Optional<Message> findLatestByRoomId(@Param("roomId") Long roomId);
}
