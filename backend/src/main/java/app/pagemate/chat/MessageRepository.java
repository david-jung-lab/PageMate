package app.pagemate.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // 커서 기반 페이지네이션 — id DESC (최신이 맨 위)
    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.sender " +
           "WHERE m.chatRoom.id = :roomId AND (:cursor IS NULL OR m.id < :cursor) " +
           "ORDER BY m.id DESC")
    List<Message> findByRoomIdWithCursor(@Param("roomId") Long roomId,
                                         @Param("cursor") Long cursor,
                                         org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.isRead = false")
    long countUnread(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true " +
           "WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.isRead = false")
    void markAllAsRead(@Param("roomId") Long roomId, @Param("userId") Long userId);
}
