package app.pagemate.notification.dto;

import java.util.List;

public record NotificationListResponse(
        List<NotificationResponse> content,
        long totalElements,
        int totalPages,
        int currentPage,
        boolean hasNext,
        int unreadCount
) {
}
