package app.pagemate.auth.client;

import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class GoogleOAuthClient {

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final RestClient restClient;

    public GoogleOAuthClient(
            @Value("${spring.security.oauth2.client.registration.google.client-id}") String clientId,
            @Value("${spring.security.oauth2.client.registration.google.client-secret}") String clientSecret,
            @Value("${oauth.google.redirect-uri}") String redirectUri
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.restClient = RestClient.create();
    }

    public UserInfo getUserInfo(String authorizationCode, String overrideRedirectUri) {
        try {
            String googleAccessToken = getAccessToken(authorizationCode, overrideRedirectUri);
            return fetchUserInfo(googleAccessToken);
        } catch (RestClientException e) {
            throw new PagemateException(ErrorCode.UNAUTHORIZED);
        }
    }

    private String getAccessToken(String authorizationCode, String overrideRedirectUri) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", authorizationCode);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", overrideRedirectUri != null ? overrideRedirectUri : redirectUri);
        params.add("grant_type", "authorization_code");

        TokenResponse response = restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(params)
                .retrieve()
                .body(TokenResponse.class);

        return response.getAccess_token();
    }

    private UserInfo fetchUserInfo(String googleAccessToken) {
        GoogleUser user = restClient.get()
                .uri(USER_INFO_URL)
                .header("Authorization", "Bearer " + googleAccessToken)
                .retrieve()
                .body(GoogleUser.class);

        return new UserInfo(user.getSub(), user.getName(), user.getEmail(), user.getPicture());
    }

    @Getter
    private static class TokenResponse {
        private String access_token;
    }

    @Getter
    private static class GoogleUser {
        private String sub;
        private String name;
        private String email;
        private String picture;
    }

    public record UserInfo(String oauthId, String nickname, String email, String profileImage) {}
}
