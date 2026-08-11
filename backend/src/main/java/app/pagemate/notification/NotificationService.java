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

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ExpoPushClient expoPushClient;

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

        // 인앱 알림 저장 후, 푸시를 켠 사용자에게만 Expo 푸시 발송 (비동기·실패 무해)
        if (user.isPushEnabled()) {
            Map<String, Object> data = new HashMap<>();
            data.put("type", type.name());
            if (referenceId != null) data.put("referenceId", referenceId);
            expoPushClient.send(user.getFcmToken(), pushTitle(type), content, data);
        }
    }

    /** 알림 타입 → 푸시 제목 */
    private String pushTitle(NotificationType type) {
        return switch (type) {
            case EXCHANGE_REQUEST   -> "교환 요청";
            case EXCHANGE_ACCEPTED  -> "교환 수락";
            case EXCHANGE_REJECTED  -> "교환 거절";
            case EXCHANGE_COMPLETED -> "교환 완료";
            case CHAT_MESSAGE       -> "새 메시지";
            case PLEDGE_REQUESTED   -> "약속 동의";
            case SECOND_DUE         -> "반납 안내";
            case REVIEW_REQUESTED   -> "후기 요청";
        };
    }
}
