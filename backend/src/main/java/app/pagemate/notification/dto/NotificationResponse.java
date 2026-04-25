package app.pagemate.notification.dto;

import app.pagemate.notification.Notification;
import app.pagemate.notification.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String content,
        boolean isRead,
        Long referenceId,
        LocalDateTime createdAt
) {
    public static NotificationResponse of(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getContent(),
                n.isRead(),
                n.getReferenceId(),
                n.getCreatedAt()
        );
    }
}
