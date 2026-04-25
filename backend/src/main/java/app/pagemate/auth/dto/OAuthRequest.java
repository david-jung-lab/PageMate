package app.pagemate.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class OAuthRequest {

    @NotBlank
    private String authorizationCode;
}
