package app.pagemate.auth;

import app.pagemate.auth.dto.AuthResponse;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.common.security.JwtProvider;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService - 심사용 체험 로그인")
class AuthServiceDemoLoginTest {

    @Mock UserRepository userRepository;
    @Mock JwtProvider jwtProvider;
    @Mock app.pagemate.auth.client.KakaoOAuthClient kakaoOAuthClient;
    @Mock app.pagemate.auth.client.GoogleOAuthClient googleOAuthClient;

    @InjectMocks AuthService authService;

    private User seedUser(DemoAccount account, Long id) {
        User u = User.builder()
                .oauthProvider(account.getProvider())
                .oauthId(account.getOauthId())
                .nickname(account.getNickname())
                .handle("demo_" + id)
                .build();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private void enableDemo(boolean enabled, String key) {
        ReflectionTestUtils.setField(authService, "demoLoginEnabled", enabled);
        ReflectionTestUtils.setField(authService, "demoLoginKey", key);
    }

    @BeforeEach
    void setUp() {
        enableDemo(true, "");
    }

    private void stubTokens() {
        given(jwtProvider.createAccessToken(anyLong())).willReturn("access");
        given(jwtProvider.createRefreshToken(anyLong())).willReturn("refresh");
    }

    @Test
    @DisplayName("서버에서 닫으면 계정 목록이 비어 앱에서 버튼이 사라진다")
    void accountsUnavailableWhenDisabled() {
        enableDemo(false, "");

        var res = authService.getDemoAccounts();

        assertThat(res.available()).isFalse();
        assertThat(res.accounts()).isEmpty();
    }

    @DisplayName("열려 있으면 빌리는 사람·빌려주는 사람 두 계정을 반환한다")
    @Test
    void accountsAvailable() {
        var res = authService.getDemoAccounts();

        assertThat(res.available()).isTrue();
        assertThat(res.accounts()).hasSize(2);
        assertThat(res.accounts()).extracting("key")
                .containsExactly("BORROWER", "LENDER");
    }

    @Test
    @DisplayName("계정을 지정하지 않으면 요청자(민준) 계정으로 로그인한다")
    void defaultsToBorrower() {
        User minjun = seedUser(DemoAccount.BORROWER, 1L);
        given(userRepository.findByOauthProviderAndOauthId(
                DemoAccount.BORROWER.getProvider(), DemoAccount.BORROWER.getOauthId()))
                .willReturn(Optional.of(minjun));
        stubTokens();

        AuthResponse res = authService.loginAsDemo(null, null);

        assertThat(res.getUser().getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("소유자 계정을 지정하면 서연 계정으로 로그인한다")
    void loginAsLender() {
        User seoyeon = seedUser(DemoAccount.LENDER, 2L);
        given(userRepository.findByOauthProviderAndOauthId(
                DemoAccount.LENDER.getProvider(), DemoAccount.LENDER.getOauthId()))
                .willReturn(Optional.of(seoyeon));
        stubTokens();

        AuthResponse res = authService.loginAsDemo(null, DemoAccount.LENDER);

        assertThat(res.getUser().getId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("서버에서 닫으면 로그인 자체가 거부된다")
    void loginRejectedWhenDisabled() {
        enableDemo(false, "");

        assertThatThrownBy(() -> authService.loginAsDemo(null, DemoAccount.BORROWER))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.DEMO_LOGIN_DISABLED);
    }

    @Test
    @DisplayName("키가 설정된 경우 틀린 키는 거부한다")
    void loginRejectedWithWrongKey() {
        enableDemo(true, "correct-key");

        assertThatThrownBy(() -> authService.loginAsDemo("wrong-key", DemoAccount.BORROWER))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.DEMO_LOGIN_DISABLED);
    }
}
