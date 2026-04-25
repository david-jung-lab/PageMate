package app.pagemate.auth.client;

import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

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

    public UserInfo getUserInfo(String authorizationCode) {
        try {
            String kakaoAccessToken = getAccessToken(authorizationCode);
            return fetchUserInfo(kakaoAccessToken);
        } catch (RestClientException e) {
            throw new PagemateException(ErrorCode.UNAUTHORIZED);
        }
    }

    private String getAccessToken(String authorizationCode) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("code", authorizationCode);

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
        String profileImage = null;
        if (kakaoUser.getKakao_account() != null && kakaoUser.getKakao_account().getProfile() != null) {
            nickname = kakaoUser.getKakao_account().getProfile().getNickname();
            profileImage = kakaoUser.getKakao_account().getProfile().getProfile_image_url();
        }

        return new UserInfo(String.valueOf(kakaoUser.getId()), nickname, profileImage);
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
            private Profile profile;

            @Getter
            private static class Profile {
                private String nickname;
                private String profile_image_url;
            }
        }
    }

    public record UserInfo(String oauthId, String nickname, String profileImage) {}
}
