package app.pagemate.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatRoomParticipantRepository extends JpaRepository<ChatRoomParticipant, ChatRoomParticipantId> {

    @Query("SELECT p FROM ChatRoomParticipant p WHERE p.chatRoom.id = :roomId AND p.user.id = :userId")
    Optional<ChatRoomParticipant> findByRoomIdAndUserId(@Param("roomId") Long roomId, @Param("userId") Long userId);
}
