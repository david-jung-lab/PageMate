package app.pagemate.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PushTokenRequest {
    /** Expo 푸시 토큰: ExponentPushToken[...] */
    @NotBlank
    private String token;
}
