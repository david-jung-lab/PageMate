package app.pagemate.exchange;

import app.pagemate.auth.OAuthProvider;
import app.pagemate.auth.client.GoogleOAuthClient;
import app.pagemate.auth.client.KakaoOAuthClient;
import app.pagemate.book.Book;
import app.pagemate.book.BookRepository;
import app.pagemate.common.security.JwtProvider;
import app.pagemate.common.service.S3Service;
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

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Transactional
class ExchangeControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired BookRepository bookRepository;
    @Autowired ExchangeRepository exchangeRepository;
    @Autowired JwtProvider jwtProvider;

    @MockitoBean KakaoOAuthClient kakaoOAuthClient;
    @MockitoBean GoogleOAuthClient googleOAuthClient;
    @MockitoBean S3Service s3Service;

    private String requesterToken;
    private String respondentToken;
    private Long requesterId;
    private Long respondentId;
    private Long requestedBookId;  // respondent 소유
    private Long offeredBookId;    // requester 소유

    @BeforeEach
    void setUp() {
        long nano = System.nanoTime();

        User requester = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("req_" + nano)
                .nickname("요청자")
                .handle("req_" + nano)
                .avatarColor("blue")
                .build());

        User respondent = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("resp_" + nano)
                .nickname("응답자")
                .handle("resp_" + nano)
                .avatarColor("orange")
                .build());

        requesterId = requester.getId();
        respondentId = respondent.getId();
        requesterToken = jwtProvider.createAccessToken(requesterId);
        respondentToken = jwtProvider.createAccessToken(respondentId);

        Book requestedBook = bookRepository.save(Book.builder()
                .owner(respondent)
                .title("상대방 책")
                .author("작가A")
                .genre("소설")
                .coverColor("blue")
                .build());

        Book offeredBook = bookRepository.save(Book.builder()
                .owner(requester)
                .title("내 제안 책")
                .author("작가B")
                .genre("SF")
                .coverColor("orange")
                .build());

        requestedBookId = requestedBook.getId();
        offeredBookId = offeredBook.getId();
    }

    private String body(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }

    @Test
    @DisplayName("POST /v1/exchanges - 교환 요청 생성")
    void createExchange() throws Exception {
        mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.requestedBook.id").value(requestedBookId))
                .andExpect(jsonPath("$.data.offeredBook.id").value(offeredBookId));
    }

    @Test
    @DisplayName("POST /v1/exchanges - 본인 도서에 요청 시 400")
    void createExchange_selfExchange() throws Exception {
        mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", offeredBookId,
                                "offeredBookId", offeredBookId))))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("SELF_EXCHANGE"));
    }

    @Test
    @DisplayName("POST /v1/exchanges - 중복 요청 시 409")
    void createExchange_duplicate() throws Exception {
        mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andDo(print())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE_REQUEST"));
    }

    @Test
    @DisplayName("GET /v1/exchanges - 내 교환 목록 조회")
    void getMyExchanges() throws Exception {
        mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("PATCH /v1/exchanges/{id}/accept - 응답자가 수락")
    void acceptExchange() throws Exception {
        String createResult = mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(patch("/v1/exchanges/{id}/accept", exchangeId)
                        .header("Authorization", "Bearer " + respondentToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }

    @Test
    @DisplayName("PATCH /v1/exchanges/{id}/accept - 요청자가 수락 시 403")
    void acceptExchange_forbidden() throws Exception {
        String createResult = mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(patch("/v1/exchanges/{id}/accept", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andDo(print())
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /v1/exchanges/{id}/reject - 응답자가 거절")
    void rejectExchange() throws Exception {
        String createResult = mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(patch("/v1/exchanges/{id}/reject", exchangeId)
                        .header("Authorization", "Bearer " + respondentToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
    }

    @Test
    @DisplayName("PATCH /v1/exchanges/{id}/complete - 수락 후 완료")
    void completeExchange() throws Exception {
        String createResult = mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(patch("/v1/exchanges/{id}/accept", exchangeId)
                        .header("Authorization", "Bearer " + respondentToken))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/v1/exchanges/{id}/complete", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("PATCH /v1/exchanges/{id}/cancel - 요청자가 취소")
    void cancelExchange() throws Exception {
        String createResult = mockMvc.perform(post("/v1/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(patch("/v1/exchanges/{id}/cancel", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("POST /v1/exchanges - 인증 없으면 401")
    void createExchange_unauthorized() throws Exception {
        mockMvc.perform(post("/v1/exchanges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of(
                                "requestedBookId", requestedBookId,
                                "offeredBookId", offeredBookId))))
                .andExpect(status().isUnauthorized());
    }
}
