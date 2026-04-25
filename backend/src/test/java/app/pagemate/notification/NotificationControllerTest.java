package app.pagemate.notification;

import app.pagemate.auth.OAuthProvider;
import app.pagemate.auth.client.GoogleOAuthClient;
import app.pagemate.auth.client.KakaoOAuthClient;
import app.pagemate.common.security.JwtProvider;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Transactional
class NotificationControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired NotificationRepository notificationRepository;
    @Autowired JwtProvider jwtProvider;

    @MockitoBean KakaoOAuthClient kakaoOAuthClient;
    @MockitoBean GoogleOAuthClient googleOAuthClient;

    private String token;
    private Long userId;
    private Long notificationId;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("noti_test_" + System.nanoTime())
                .nickname("알림테스터")
                .handle("noti_" + System.nanoTime())
                .build());
        userId = user.getId();
        token = jwtProvider.createAccessToken(userId);

        Notification notification = notificationRepository.save(Notification.builder()
                .user(user)
                .type(NotificationType.EXCHANGE_REQUEST)
                .content("민지님이 교환을 요청했습니다.")
                .isRead(false)
                .referenceId(42L)
                .build());
        notificationId = notification.getId();
    }

    @Test
    @DisplayName("GET /v1/notifications - 알림 목록 조회")
    void getNotifications() throws Exception {
        mockMvc.perform(get("/v1/notifications")
                        .header("Authorization", "Bearer " + token))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].type").value("EXCHANGE_REQUEST"))
                .andExpect(jsonPath("$.data.unreadCount").value(greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("GET /v1/notifications - 인증 없으면 401")
    void getNotifications_unauthorized() throws Exception {
        mockMvc.perform(get("/v1/notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PATCH /v1/notifications/{id}/read - 알림 읽음 처리")
    void markAsRead() throws Exception {
        mockMvc.perform(patch("/v1/notifications/{id}/read", notificationId)
                        .header("Authorization", "Bearer " + token))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRead").value(true))
                .andExpect(jsonPath("$.data.id").value(notificationId));
    }

    @Test
    @DisplayName("PATCH /v1/notifications/{id}/read - 없는 알림 → 404")
    void markAsRead_notFound() throws Exception {
        mockMvc.perform(patch("/v1/notifications/99999/read")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /v1/notifications/{id}/read - 타인 알림 읽음 처리 → 403")
    void markAsRead_accessDenied() throws Exception {
        User other = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.GOOGLE)
                .oauthId("other_noti_" + System.nanoTime())
                .nickname("타인")
                .handle("other_noti_" + System.nanoTime())
                .build());
        String otherToken = jwtProvider.createAccessToken(other.getId());

        mockMvc.perform(patch("/v1/notifications/{id}/read", notificationId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /v1/notifications/read-all - 전체 읽음 처리")
    void markAllAsRead() throws Exception {
        mockMvc.perform(patch("/v1/notifications/read-all")
                        .header("Authorization", "Bearer " + token))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /v1/notifications/read-all - 인증 없으면 401")
    void markAllAsRead_unauthorized() throws Exception {
        mockMvc.perform(patch("/v1/notifications/read-all"))
                .andExpect(status().isUnauthorized());
    }
}
