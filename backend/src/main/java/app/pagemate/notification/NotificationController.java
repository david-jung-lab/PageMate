package app.pagemate.notification;

import app.pagemate.common.response.ApiResponse;
import app.pagemate.notification.dto.NotificationListResponse;
import app.pagemate.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @GetMapping
    public ApiResponse<NotificationListResponse> getNotifications(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.ok(service.getNotifications(userId, page, size));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        return ApiResponse.ok(service.markAsRead(userId, id));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(@AuthenticationPrincipal Long userId) {
        service.markAllAsRead(userId);
        return ApiResponse.ok(null);
    }
}
