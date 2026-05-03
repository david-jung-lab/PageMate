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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final KakaoOAuthClient kakaoOAuthClient;
    private final GoogleOAuthClient googleOAuthClient;

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

        if (!refreshToken.equals(user.getRefreshToken())) {
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

    private String generateUniqueHandle() {
        String handle;
        do {
            handle = "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        } while (userRepository.existsByHandle(handle));
        return handle;
    }
}
