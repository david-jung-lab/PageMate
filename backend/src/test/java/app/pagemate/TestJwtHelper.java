package app.pagemate;

import app.pagemate.common.security.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TestJwtHelper {

    @Autowired
    private JwtProvider jwtProvider;

    public String token(Long userId) {
        return "Bearer " + jwtProvider.createAccessToken(userId);
    }
}
