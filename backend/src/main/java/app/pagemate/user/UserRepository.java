package app.pagemate.user;

import app.pagemate.auth.OAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByOauthProviderAndOauthId(OAuthProvider oauthProvider, String oauthId);
    boolean existsByHandle(String handle);
}
