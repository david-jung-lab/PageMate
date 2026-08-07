package app.pagemate.auth;

import app.pagemate.auth.client.GoogleOAuthClient;
import app.pagemate.auth.client.KakaoOAuthClient;
import app.pagemate.auth.dto.AuthResponse;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.common.security.JwtProvider;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    /** Apple App Store 심사용 데모 계정 식별자 (V16 시드 마이그레이션과 일치) */
    private static final OAuthProvider DEMO_PROVIDER = OAuthProvider.GOOGLE;
    private static final String DEMO_OAUTH_ID = "demo-reviewer-apple";

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final KakaoOAuthClient kakaoOAuthClient;
    private final GoogleOAuthClient googleOAuthClient;

    @Value("${demo.login.enabled:false}")
    private boolean demoLoginEnabled;

    @Value("${demo.login.key:}")
    private String demoLoginKey;

    /**
     * 심사관용 데모 로그인: 시드된 데모 계정으로 즉시 토큰 발급.
     * 공개 엔드포인트이므로 DEMO_LOGIN_ENABLED 가 켜진 심사 기간에만 열리며,
     * 심사 통과 후에는 플래그를 내려 완전히 닫는다.
     *
     * DEMO_LOGIN_KEY 를 설정하면 그 키를 보낸 클라이언트만 허용한다.
     * (키를 보내지 않는 기존 제출 빌드와의 호환을 위해 키 미설정 시에는 검사하지 않는다)
     */
    @Transactional
    public AuthResponse loginAsDemo(String providedKey) {
        if (!demoLoginEnabled) {
            throw new PagemateException(ErrorCode.DEMO_LOGIN_DISABLED);
        }
        if (StringUtils.hasText(demoLoginKey) && !matchesDemoKey(providedKey)) {
            throw new PagemateException(ErrorCode.DEMO_LOGIN_DISABLED);
        }

        User user = userRepository.findByOauthProviderAndOauthId(DEMO_PROVIDER, DEMO_OAUTH_ID)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        return issueTokens(user, false);
    }

    @Transactional
    public AuthResponse loginWithKakao(String authorizationCode, String redirectUri) {
        KakaoOAuthClient.UserInfo info = kakaoOAuthClient.getUserInfo(authorizationCode, redirectUri);
        return processLogin(OAuthProvider.KAKAO, info.oauthId(), info.nickname(), info.email(), info.profileImage());
    }

    @Transactional
    public AuthResponse loginWithGoogle(String authorizationCode, String redirectUri) {
        GoogleOAuthClient.UserInfo info = googleOAuthClient.getUserInfo(authorizationCode, redirectUri);
        return processLogin(OAuthProvider.GOOGLE, info.oauthId(), info.nickname(), info.email(), info.profileImage());
    }

    private AuthResponse processLogin(OAuthProvider provider, String oauthId, String nickname, String email, String profileImage) {
        boolean isNewUser = false;
        User user = userRepository.findByOauthProviderAndOauthId(provider, oauthId).orElse(null);

        if (user == null) {
            isNewUser = true;
            user = userRepository.save(User.builder()
                    .oauthProvider(provider)
                    .oauthId(oauthId)
                    .nickname(nickname)
                    .email(email)
                    .handle(generateUniqueHandle())
                    .profileImage(profileImage)
                    .build());
        } else if (email != null && !email.equals(user.getEmail())) {
            user.updateEmail(email);
        }

        return issueTokens(user, isNewUser);
    }

    private AuthResponse issueTokens(User user, boolean isNewUser) {
        String accessToken = jwtProvider.createAccessToken(user.getId());
        String refreshToken = jwtProvider.createRefreshToken(user.getId());
        user.updateRefreshToken(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(jwtProvider.getAccessExpiresIn())
                .user(AuthResponse.UserSummary.builder()
                        .id(user.getId())
                        .nickname(user.getNickname())
                        .handle(user.getHandle())
                        .profileImage(user.getProfileImage())
                        .isNewUser(isNewUser)
                        .build())
                .build();
    }

    @Transactional
    public AuthResponse.Refresh refresh(String refreshToken) {
        if (!jwtProvider.isValid(refreshToken)) {
            throw new PagemateException(ErrorCode.INVALID_TOKEN);
        }

        Long userId = jwtProvider.getUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));

        if (user.isDeleted() || !refreshToken.equals(user.getRefreshToken())) {
            throw new PagemateException(ErrorCode.INVALID_TOKEN);
        }

        return AuthResponse.Refresh.builder()
                .accessToken(jwtProvider.createAccessToken(userId))
                .accessTokenExpiresIn(jwtProvider.getAccessExpiresIn())
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        if (userId == null) return;
        userRepository.findById(userId).ifPresent(User::clearRefreshToken);
    }

    /** 타이밍 공격을 피하기 위해 상수 시간 비교를 사용한다. */
    private boolean matchesDemoKey(String providedKey) {
        if (providedKey == null) return false;
        return MessageDigest.isEqual(
                demoLoginKey.getBytes(StandardCharsets.UTF_8),
                providedKey.getBytes(StandardCharsets.UTF_8));
    }

    private String generateUniqueHandle() {
        String handle;
        do {
            handle = "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        } while (userRepository.existsByHandle(handle));
        return handle;
    }
}
