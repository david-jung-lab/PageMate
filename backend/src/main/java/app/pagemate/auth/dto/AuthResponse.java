package app.pagemate.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    private final String accessToken;
    private final String refreshToken;
    private final long accessTokenExpiresIn;
    private final UserSummary user;

    @Getter
    @Builder
    public static class UserSummary {
        private final Long id;
        private final String nickname;
        private final String handle;
        private final String profileImage;
        @JsonProperty("isNewUser")
        private final boolean isNewUser;
    }

    @Getter
    @Builder
    public static class Refresh {
        private final String accessToken;
        private final long accessTokenExpiresIn;
    }
}
