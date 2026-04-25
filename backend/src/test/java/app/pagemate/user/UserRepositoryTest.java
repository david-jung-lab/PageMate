package app.pagemate.user;

import app.pagemate.auth.OAuthProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
// @Commit 제거 → 테스트 후 롤백하여 DB 오염 방지 (재실행 시 중복 키 오류 없음)
class UserRepositoryTest {

    @Autowired
    UserRepository userRepository;

    @Test
    @org.junit.jupiter.api.DisplayName("Railway DB 연결 확인 - 저장/조회 후 롤백")
    void saveAndFindByOauthProviderAndId() {
        long nano = System.nanoTime();
        User user = User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("kakao_test_" + nano)
                .nickname("카카오테스터")
                .handle("user_kt_" + nano)
                .avatarColor("blue")
                .bio("PageMate DB 연결 테스트 유저입니다.")
                .build();

        User saved = userRepository.save(user);

        assertThat(saved.getId()).isNotNull();

        Optional<User> found = userRepository.findByOauthProviderAndOauthId(
                OAuthProvider.KAKAO, "kakao_test_" + nano);
        assertThat(found).isPresent();
        assertThat(found.get().getNickname()).isEqualTo("카카오테스터");

        System.out.println("=== Railway DB 연결 성공 (롤백 예정) id=" + saved.getId() + " ===");
    }

    @Test
    @org.junit.jupiter.api.DisplayName("handle 중복 여부 확인")
    void existsByHandle() {
        long nano = System.nanoTime();
        userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.GOOGLE)
                .oauthId("google_test_" + nano)
                .nickname("구글테스터")
                .handle("unique_handle_" + nano)
                .build());

        assertThat(userRepository.existsByHandle("unique_handle_" + nano)).isTrue();
        assertThat(userRepository.existsByHandle("nonexistent_handle")).isFalse();
    }
}
