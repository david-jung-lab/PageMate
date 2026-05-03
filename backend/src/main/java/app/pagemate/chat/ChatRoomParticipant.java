package app.pagemate.chat;

import app.pagemate.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_room_participants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChatRoomParticipant {

    @EmbeddedId
    private ChatRoomParticipantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roomId")
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    public void markRead(Long messageId) {
        this.lastReadMessageId = messageId;
        this.lastReadAt = LocalDateTime.now();
    }
}
