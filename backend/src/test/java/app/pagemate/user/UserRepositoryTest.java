package app.pagemate.user;

import app.pagemate.auth.OAuthProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.annotation.Commit;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Commit
class UserRepositoryTest {

    @Autowired
    UserRepository userRepository;

    @Test
    void Railway_DB_연결_및_유저_저장() {
        User kakaoUser = User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("kakao_test_001")
                .nickname("카카오테스터")
                .handle("user_kakaotest01")
                .avatarColor("#FF6B6B")
                .bio("PageMate DB 연결 테스트 유저입니다.")
                .build();

        User googleUser = User.builder()
                .oauthProvider(OAuthProvider.GOOGLE)
                .oauthId("google_test_001")
                .nickname("구글테스터")
                .handle("user_googletest01")
                .avatarColor("#4ECDC4")
                .bio("Google OAuth 테스트 유저입니다.")
                .build();

        User savedKakao = userRepository.save(kakaoUser);
        User savedGoogle = userRepository.save(googleUser);

        assertThat(savedKakao.getId()).isNotNull();
        assertThat(savedGoogle.getId()).isNotNull();

        Optional<User> found = userRepository.findByOauthProviderAndOauthId(OAuthProvider.KAKAO, "kakao_test_001");
        assertThat(found).isPresent();
        assertThat(found.get().getNickname()).isEqualTo("카카오테스터");

        List<User> all = userRepository.findAll();
        assertThat(all.size()).isGreaterThanOrEqualTo(2);

        System.out.println("=== Railway DB 연결 성공 ===");
        all.forEach(u -> System.out.printf("id=%d | %s | %s | %s%n",
                u.getId(), u.getOauthProvider(), u.getNickname(), u.getHandle()));
    }
}
