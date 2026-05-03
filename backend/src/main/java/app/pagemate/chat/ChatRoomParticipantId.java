package app.pagemate.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ChatRoomParticipantId implements Serializable {

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "user_id")
    private Long userId;
}
