package app.pagemate.notification;

import app.pagemate.auth.OAuthProvider;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.notification.dto.NotificationListResponse;
import app.pagemate.notification.dto.NotificationResponse;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock UserRepository userRepository;
    @Mock ExpoPushClient expoPushClient;

    @InjectMocks NotificationService service;

    private User user;
    private Notification notification;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("kakao_001")
                .nickname("김독서")
                .handle("kimbook")
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        notification = Notification.builder()
                .user(user)
                .type(NotificationType.EXCHANGE_REQUEST)
                .content("민지님이 교환을 요청했습니다.")
                .isRead(false)
                .referenceId(7L)
                .build();
        ReflectionTestUtils.setField(notification, "id", 10L);
    }

    // ─── getNotifications ────────────────────────────────────────────────────

    @Nested
    @DisplayName("getNotifications")
    class GetNotifications {

        @Test
        @DisplayName("성공 - 알림 목록과 unreadCount 함께 반환")
        void success() {
            given(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any()))
                    .willReturn(new PageImpl<>(List.of(notification), PageRequest.of(0, 20), 1));
            given(notificationRepository.countByUserIdAndIsReadFalse(1L)).willReturn(3);

            NotificationListResponse res = service.getNotifications(1L, 0, 20);

            assertThat(res.content()).hasSize(1);
            assertThat(res.content().get(0).type()).isEqualTo(NotificationType.EXCHANGE_REQUEST);
            assertThat(res.unreadCount()).isEqualTo(3);
        }

        @Test
        @DisplayName("성공 - 알림 없으면 빈 목록, unreadCount=0")
        void empty() {
            given(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any()))
                    .willReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));
            given(notificationRepository.countByUserIdAndIsReadFalse(1L)).willReturn(0);

            NotificationListResponse res = service.getNotifications(1L, 0, 20);

            assertThat(res.content()).isEmpty();
            assertThat(res.unreadCount()).isZero();
        }
    }

    // ─── markAsRead ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("markAsRead")
    class MarkAsRead {

        @Test
        @DisplayName("성공 - isRead가 true로 변경됨")
        void success() {
            given(notificationRepository.findById(10L)).willReturn(Optional.of(notification));

            NotificationResponse res = service.markAsRead(1L, 10L);

            assertThat(res.isRead()).isTrue();
            assertThat(notification.isRead()).isTrue();
        }

        @Test
        @DisplayName("실패 - 없는 알림 → NOTIFICATION_NOT_FOUND")
        void notFound() {
            given(notificationRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> service.markAsRead(1L, 99L))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOTIFICATION_NOT_FOUND);
        }

        @Test
        @DisplayName("실패 - 타인 알림 읽음 처리 → NOTIFICATION_ACCESS_DENIED")
        void accessDenied() {
            given(notificationRepository.findById(10L)).willReturn(Optional.of(notification));

            assertThatThrownBy(() -> service.markAsRead(999L, 10L))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.NOTIFICATION_ACCESS_DENIED);
        }
    }

    // ─── markAllAsRead ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("markAllAsRead")
    class MarkAllAsRead {

        @Test
        @DisplayName("성공 - markAllAsRead 쿼리 호출됨")
        void success() {
            service.markAllAsRead(1L);
            verify(notificationRepository).markAllAsRead(1L);
        }
    }

    // ─── send ─────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("send")
    class Send {

        @Test
        @DisplayName("성공 - 알림 저장됨")
        void success() {
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            service.send(1L, NotificationType.EXCHANGE_ACCEPTED, "교환이 수락됐습니다.", 5L);

            verify(notificationRepository).save(any(Notification.class));
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 대상 유저 → USER_NOT_FOUND")
        void userNotFound() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> service.send(99L, NotificationType.EXCHANGE_REQUEST, "요청", 1L))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.USER_NOT_FOUND);
        }
    }
}
