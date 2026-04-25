package app.pagemate.user;

import app.pagemate.auth.OAuthProvider;
import app.pagemate.auth.client.GoogleOAuthClient;
import app.pagemate.auth.client.KakaoOAuthClient;
import app.pagemate.common.security.JwtProvider;
import app.pagemate.common.service.S3Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Transactional
class ProfileControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired JwtProvider jwtProvider;

    @MockitoBean KakaoOAuthClient kakaoOAuthClient;
    @MockitoBean GoogleOAuthClient googleOAuthClient;
    @MockitoBean S3Service s3Service;

    private String accessToken;
    private Long userId;

    @BeforeEach
    void setUp() {
        when(s3Service.upload(any(), anyString())).thenReturn("https://s3.example.com/profiles/test.jpg");

        // 매 테스트마다 새 유저 저장 (@Transactional 롤백으로 격리됨)
        User user = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("profile_test_" + System.nanoTime())
                .nickname("테스트유저")
                .handle("user_pt_" + System.nanoTime())
                .avatarColor("blue")
                .build());

        userId = user.getId();
        accessToken = jwtProvider.createAccessToken(userId);
    }

    @Test
    @DisplayName("GET /v1/users/me - 내 프로필 조회")
    void getMyProfile() throws Exception {
        mockMvc.perform(get("/v1/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("테스트유저"))
                .andExpect(jsonPath("$.data.bookCount").isNumber());
    }

    @Test
    @DisplayName("PATCH /v1/users/me - 프로필 수정")
    void updateMyProfile() throws Exception {
        mockMvc.perform(multipart("/v1/users/me")
                        .file(new MockMultipartFile("image", "profile.jpg",
                                MediaType.IMAGE_JPEG_VALUE, "fake-image".getBytes()))
                        .param("nickname", "수정된닉네임")
                        .param("bio", "수정된 자기소개입니다.")
                        .param("location", "연남동")
                        .param("avatarColor", "orange")
                        .param("tags", objectMapper.writeValueAsString(List.of("소설", "SF")))
                        .with(req -> { req.setMethod("PATCH"); return req; })
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("수정된닉네임"))
                .andExpect(jsonPath("$.data.bio").value("수정된 자기소개입니다."))
                .andExpect(jsonPath("$.data.location").value("연남동"))
                .andExpect(jsonPath("$.data.avatarColor").value("orange"))
                .andExpect(jsonPath("$.data.profileImage").value("https://s3.example.com/profiles/test.jpg"));
    }

    @Test
    @DisplayName("GET /v1/users/{id} - 타인 프로필 조회 (인증 불필요)")
    void getUserProfile() throws Exception {
        mockMvc.perform(get("/v1/users/{id}", userId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(userId))
                .andExpect(jsonPath("$.data.bookCount").isNumber());
    }

    @Test
    @DisplayName("GET /v1/users/{id}/books - 타인 도서 조회")
    void getUserBooks() throws Exception {
        mockMvc.perform(get("/v1/users/{id}/books", userId)
                        .param("page", "0").param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("GET /v1/users/me/books - 내 도서 목록")
    void getMyBooks() throws Exception {
        mockMvc.perform(get("/v1/users/me/books")
                        .header("Authorization", "Bearer " + accessToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("GET /v1/users/me - 인증 없으면 401")
    void getMyProfile_unauthorized() throws Exception {
        mockMvc.perform(get("/v1/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /v1/users/99999 - 존재하지 않는 유저 404")
    void getUserProfile_notFound() throws Exception {
        mockMvc.perform(get("/v1/users/99999"))
                .andDo(print())
                .andExpect(status().isNotFound());
    }
}
