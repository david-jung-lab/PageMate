package app.pagemate.reading;

import app.pagemate.auth.OAuthProvider;
import app.pagemate.auth.client.GoogleOAuthClient;
import app.pagemate.auth.client.KakaoOAuthClient;
import app.pagemate.common.security.JwtProvider;
import app.pagemate.user.User;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Transactional
class ReadingRecordControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ReadingRecordRepository recordRepository;
    @Autowired JwtProvider jwtProvider;

    @MockitoBean KakaoOAuthClient kakaoOAuthClient;
    @MockitoBean GoogleOAuthClient googleOAuthClient;

    private String token;
    private Long userId;
    private Long recordId;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("reading_test_" + System.nanoTime())
                .nickname("독서테스터")
                .handle("reader_" + System.nanoTime())
                .build());
        userId = user.getId();
        token = jwtProvider.createAccessToken(userId);

        ReadingRecord record = recordRepository.save(ReadingRecord.builder()
                .user(user)
                .bookTitle("아주 희미한 빛으로도")
                .author("최은영")
                .rating(5)
                .coverColor("sage")
                .isPublic(true)
                .readAt(LocalDate.of(2026, 3, 15))
                .build());
        recordId = record.getId();
    }

    @Test
    @DisplayName("GET /v1/reading-records - 내 독서 기록 조회")
    void getMyRecords() throws Exception {
        mockMvc.perform(get("/v1/reading-records")
                        .header("Authorization", "Bearer " + token))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].bookTitle").value("아주 희미한 빛으로도"));
    }

    @Test
    @DisplayName("GET /v1/reading-records - 인증 없으면 401")
    void getMyRecords_unauthorized() throws Exception {
        mockMvc.perform(get("/v1/reading-records"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /v1/reading-records - 독서 기록 등록")
    void createRecord() throws Exception {
        Map<String, Object> body = Map.of(
                "bookTitle", "채식주의자",
                "author", "한강",
                "rating", 5,
                "coverColor", "sage",
                "isPublic", true,
                "readAt", "2026-04-01"
        );

        mockMvc.perform(post("/v1/reading-records")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.bookTitle").value("채식주의자"))
                .andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.coverColor").value("sage"));
    }

    @Test
    @DisplayName("POST /v1/reading-records - 필수값 누락 시 400")
    void createRecord_validationFail() throws Exception {
        Map<String, Object> body = Map.of(
                "author", "한강"
                // bookTitle, rating, readAt 누락
        );

        mockMvc.perform(post("/v1/reading-records")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /v1/reading-records/{id} - 독서 기록 수정")
    void updateRecord() throws Exception {
        Map<String, Object> body = Map.of(
                "memo", "두 번 읽어도 좋은 책",
                "rating", 4
        );

        mockMvc.perform(patch("/v1/reading-records/{id}", recordId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.memo").value("두 번 읽어도 좋은 책"))
                .andExpect(jsonPath("$.data.rating").value(4))
                .andExpect(jsonPath("$.data.bookTitle").value("아주 희미한 빛으로도"));
    }

    @Test
    @DisplayName("PATCH /v1/reading-records/{id} - 타인 기록 수정 시 403")
    void updateRecord_accessDenied() throws Exception {
        User other = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.GOOGLE)
                .oauthId("other_" + System.nanoTime())
                .nickname("타인")
                .handle("other_" + System.nanoTime())
                .build());
        String otherToken = jwtProvider.createAccessToken(other.getId());

        mockMvc.perform(patch("/v1/reading-records/{id}", recordId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rating", 1))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /v1/reading-records/{id} - 독서 기록 삭제")
    void deleteRecord() throws Exception {
        mockMvc.perform(delete("/v1/reading-records/{id}", recordId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /v1/reading-records/{id} - 타인 기록 삭제 시 403")
    void deleteRecord_accessDenied() throws Exception {
        User other = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.GOOGLE)
                .oauthId("other2_" + System.nanoTime())
                .nickname("타인2")
                .handle("other2_" + System.nanoTime())
                .build());
        String otherToken = jwtProvider.createAccessToken(other.getId());

        mockMvc.perform(delete("/v1/reading-records/{id}", recordId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /v1/reading-records/{id} - 없는 기록 수정 시 404")
    void updateRecord_notFound() throws Exception {
        mockMvc.perform(patch("/v1/reading-records/99999")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rating", 3))))
                .andExpect(status().isNotFound());
    }
}
