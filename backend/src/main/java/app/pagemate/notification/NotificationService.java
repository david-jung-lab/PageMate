package app.pagemate.notification;

import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.notification.dto.NotificationListResponse;
import app.pagemate.notification.dto.NotificationResponse;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationListResponse getNotifications(Long userId, int page, int size) {
        Page<Notification> result = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        int unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);

        return new NotificationListResponse(
                result.getContent().stream().map(NotificationResponse::of).toList(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.hasNext(),
                unreadCount
        );
    }

    @Transactional
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new PagemateException(ErrorCode.NOTIFICATION_NOT_FOUND));
        if (!notification.getUser().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.NOTIFICATION_ACCESS_DENIED);
        }
        notification.markAsRead();
        return NotificationResponse.of(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    /** 다른 서비스(Exchange, Chat 등)에서 알림 생성 시 호출 */
    @Transactional
    public void send(Long targetUserId, NotificationType type, String content, Long referenceId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        notificationRepository.save(Notification.builder()
                .user(user)
                .type(type)
                .content(content)
                .isRead(false)
                .referenceId(referenceId)
                .build());
    }
}
