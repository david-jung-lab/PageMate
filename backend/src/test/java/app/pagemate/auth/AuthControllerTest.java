package app.pagemate.auth;

import app.pagemate.auth.client.GoogleOAuthClient;
import app.pagemate.auth.client.KakaoOAuthClient;
import app.pagemate.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;

    @MockitoBean KakaoOAuthClient kakaoOAuthClient;
    @MockitoBean GoogleOAuthClient googleOAuthClient;

    @BeforeEach
    void setUp() {
        when(kakaoOAuthClient.getUserInfo(anyString()))
                .thenReturn(new KakaoOAuthClient.UserInfo("kakao_test_888", "카카오유저", "https://k.kakao.com/photo.jpg"));
        when(googleOAuthClient.getUserInfo(anyString()))
                .thenReturn(new GoogleOAuthClient.UserInfo("google_test_888", "구글유저", "https://lh3.google.com/photo.jpg"));
    }

    private String body(String code) throws Exception {
        return objectMapper.writeValueAsString(Map.of("authorizationCode", code));
    }

    @Test
    @DisplayName("카카오 로그인 - 신규 유저 생성 및 JWT 발급")
    void kakaoLogin() throws Exception {
        mockMvc.perform(post("/v1/auth/oauth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("fake-kakao-code")))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.nickname").value("카카오유저"))
                .andExpect(jsonPath("$.data.user.isNewUser").isBoolean());
    }

    @Test
    @DisplayName("카카오 로그인 - 재로그인 시 isNewUser=false")
    void kakaoLogin_existingUser() throws Exception {
        mockMvc.perform(post("/v1/auth/oauth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("fake-kakao-code")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/v1/auth/oauth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("fake-kakao-code")))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.isNewUser").value(false));
    }

    @Test
    @DisplayName("구글 로그인 - 신규 유저 생성 및 JWT 발급")
    void googleLogin() throws Exception {
        mockMvc.perform(post("/v1/auth/oauth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("fake-google-code")))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.nickname").value("구글유저"))
                .andExpect(jsonPath("$.data.user.isNewUser").isBoolean());
    }
}
