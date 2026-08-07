package app.pagemate.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Expo Push 발송 클라이언트.
 * 기기 FCM/APNs 라우팅은 Expo(exp.host)가 대신 처리하므로, Expo 푸시 토큰으로 HTTP 요청만 보낸다.
 * 발송은 @Async 로 요청 스레드/트랜잭션 밖에서 수행하며, 실패해도 인앱 알림에는 영향을 주지 않는다.
 */
@Slf4j
@Component
public class ExpoPushClient {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    /** Expo 푸시 토큰 형식: ExponentPushToken[xxxxxxxx] */
    private static final String EXPO_TOKEN_PREFIX = "ExponentPushToken";

    private final RestClient restClient = RestClient.create();

    @Async
    public void send(String token, String title, String body, Map<String, Object> data) {
        if (token == null || !token.startsWith(EXPO_TOKEN_PREFIX)) {
            return; // 토큰 미등록이거나 Expo 토큰이 아니면 조용히 무시 (인앱 알림은 이미 저장됨)
        }
        try {
            Map<String, Object> message = Map.of(
                    "to", token,
                    "title", title,
                    "body", body,
                    "sound", "default",
                    "data", data == null ? Map.of() : data
            );
            restClient.post()
                    .uri(EXPO_PUSH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(message)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            // 푸시 실패는 치명적이지 않음 — 로그만 남기고 삼킨다
            log.warn("Expo 푸시 발송 실패 (token={}): {}", token, e.getMessage());
        }
    }
}
