package app.pagemate.chat.dto;

import app.pagemate.chat.Message;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long senderId,
        String senderNickname,
        String content,
        String messageType,
        LocalDateTime createdAt
) {
    public static MessageResponse of(Message m) {
        return new MessageResponse(
                m.getId(),
                m.getSender() != null ? m.getSender().getId() : null,
                m.getSender() != null ? m.getSender().getNickname() : null,
                m.getContent(),
                m.getMessageType().name(),
                m.getCreatedAt()
        );
    }
}
