package app.pagemate.auth.client;

import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Component
public class KakaoOAuthClient {

    private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";

    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final RestClient restClient;

    public KakaoOAuthClient(
            @Value("${spring.security.oauth2.client.registration.kakao.client-id}") String clientId,
            @Value("${spring.security.oauth2.client.registration.kakao.client-secret}") String clientSecret,
            @Value("${oauth.kakao.redirect-uri}") String redirectUri
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.restClient = RestClient.create();
    }

    public UserInfo getUserInfo(String authorizationCode, String overrideRedirectUri) {
        try {
            String kakaoAccessToken = getAccessToken(authorizationCode, overrideRedirectUri);
            return fetchUserInfo(kakaoAccessToken);
        } catch (RestClientException e) {
            log.error("[Kakao] 토큰 교환 실패: {}", e.getMessage());
            throw new PagemateException(ErrorCode.UNAUTHORIZED);
        }
    }

    private String getAccessToken(String authorizationCode, String overrideRedirectUri) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            params.add("client_secret", clientSecret);
        }
        params.add("redirect_uri", overrideRedirectUri != null ? overrideRedirectUri : redirectUri);
        params.add("code", authorizationCode);
        log.debug("[Kakao] 토큰 요청 redirect_uri={}", overrideRedirectUri != null ? overrideRedirectUri : redirectUri);

        TokenResponse response = restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(params)
                .retrieve()
                .body(TokenResponse.class);

        return response.getAccess_token();
    }

    private UserInfo fetchUserInfo(String kakaoAccessToken) {
        KakaoUser kakaoUser = restClient.get()
                .uri(USER_INFO_URL)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + kakaoAccessToken)
                .retrieve()
                .body(KakaoUser.class);

        String nickname = null;
        String email = null;
        String profileImage = null;
        if (kakaoUser.getKakao_account() != null) {
            KakaoUser.KakaoAccount account = kakaoUser.getKakao_account();
            email = account.getEmail();
            if (account.getProfile() != null) {
                nickname = account.getProfile().getNickname();
                profileImage = account.getProfile().getProfile_image_url();
            }
        }

        return new UserInfo(String.valueOf(kakaoUser.getId()), nickname, email, profileImage);
    }

    @Getter
    private static class TokenResponse {
        private String access_token;
    }

    @Getter
    private static class KakaoUser {
        private Long id;
        private KakaoAccount kakao_account;

        @Getter
        private static class KakaoAccount {
            private String email;
            private Profile profile;

            @Getter
            private static class Profile {
                private String nickname;
                private String profile_image_url;
            }
        }
    }

    public record UserInfo(String oauthId, String nickname, String email, String profileImage) {}
}
