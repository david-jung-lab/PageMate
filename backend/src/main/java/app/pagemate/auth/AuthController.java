package app.pagemate.auth;

import app.pagemate.auth.dto.AuthResponse;
import app.pagemate.auth.dto.DemoAccountsResponse;
import app.pagemate.auth.dto.OAuthRequest;
import app.pagemate.auth.dto.RefreshRequest;
import app.pagemate.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/oauth/kakao/callback")
    public void kakaoCallback(
            @RequestParam String code,
            HttpServletResponse response
    ) throws IOException {
        String encoded = URLEncoder.encode(code, StandardCharsets.UTF_8);
        response.sendRedirect("pagemate://oauth?code=" + encoded + "&provider=kakao");
    }

    @PostMapping("/oauth/kakao")
    public ApiResponse<AuthResponse> kakaoLogin(@Valid @RequestBody OAuthRequest request) {
        return ApiResponse.ok(authService.loginWithKakao(request.getAuthorizationCode(), request.getRedirectUri()));
    }

    @PostMapping("/oauth/google")
    public ApiResponse<AuthResponse> googleLogin(@Valid @RequestBody OAuthRequest request) {
        return ApiResponse.ok(authService.loginWithGoogle(request.getAuthorizationCode(), request.getRedirectUri()));
    }

    /** 체험 로그인 가용 여부 + 선택 가능한 계정 목록 (앱이 버튼 노출을 결정하는 데 사용) */
    @GetMapping("/demo/accounts")
    public ApiResponse<DemoAccountsResponse> demoAccounts() {
        return ApiResponse.ok(authService.getDemoAccounts());
    }

    /**
     * Apple App Store 심사관용 데모 로그인.
     * account 를 지정하면 해당 역할(요청자/소유자)의 시드 계정으로 로그인한다.
     */
    @PostMapping("/demo")
    public ApiResponse<AuthResponse> demoLogin(
            @RequestHeader(value = "X-Demo-Key", required = false) String demoKey,
            @RequestParam(required = false) DemoAccount account
    ) {
        return ApiResponse.ok(authService.loginAsDemo(demoKey, account));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse.Refresh> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok(authService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal Long userId) {
        authService.logout(userId);
        return ApiResponse.ok();
    }
}
