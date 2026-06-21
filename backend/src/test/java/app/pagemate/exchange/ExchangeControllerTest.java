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
    private Long targetBookId;   // respondent 소유 — requester가 원하는 책
    private Long requesterBookId; // requester 소유 — 응답자가 선택할 책

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

        Book targetBook = bookRepository.save(Book.builder()
                .owner(respondent)
                .title("상대방 책")
                .author("작가A")
                .genre("소설")
                .coverColor("blue")
                .build());

        Book requesterBook = bookRepository.save(Book.builder()
                .owner(requester)
                .title("내 책")
                .author("작가B")
                .genre("SF")
                .coverColor("orange")
                .build());

        targetBookId = targetBook.getId();
        requesterBookId = requesterBook.getId();
    }

    private String body(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }

    @Test
    @DisplayName("POST /exchanges - 교환 요청 생성 (targetBookId만 전달)")
    void createExchange() throws Exception {
        mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.requestedBook.id").value(targetBookId))
                .andExpect(jsonPath("$.data.selectedBook").isEmpty());
    }

    @Test
    @DisplayName("POST /exchanges - 본인 도서에 요청 시 400")
    void createExchange_selfExchange() throws Exception {
        mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", requesterBookId))))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("SELF_EXCHANGE"));
    }

    @Test
    @DisplayName("POST /exchanges - 중복 요청 시 409")
    void createExchange_duplicate() throws Exception {
        mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andDo(print())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE_REQUEST"));
    }

    @Test
    @DisplayName("GET /exchanges - 내 교환 목록 조회")
    void getMyExchanges() throws Exception {
        mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /exchanges/{id}/requester-books - 응답자가 요청자 보유 책 목록 조회")
    void getRequesterBooks() throws Exception {
        String createResult = mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(get("/exchanges/{id}/requester-books", exchangeId)
                        .header("Authorization", "Bearer " + respondentToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").value(requesterBookId));
    }

    @Test
    @DisplayName("GET /exchanges/{id}/requester-books - 요청자 접근 시 403")
    void getRequesterBooks_forbidden() throws Exception {
        String createResult = mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(get("/exchanges/{id}/requester-books", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andDo(print())
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /exchanges/{id}/respond - 응답자가 책 선택 후 수락")
    void respondAccept() throws Exception {
        String createResult = mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(patch("/exchanges/{id}/respond", exchangeId)
                        .header("Authorization", "Bearer " + respondentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("action", "ACCEPT", "selectedBookId", requesterBookId))))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.selectedBook.id").value(requesterBookId))
                .andExpect(jsonPath("$.data.chatRoomId").isNotEmpty());
    }

    @Test
    @DisplayName("PATCH /exchanges/{id}/respond - 응답자가 거절")
    void respondReject() throws Exception {
        String createResult = mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(patch("/exchanges/{id}/respond", exchangeId)
                        .header("Authorization", "Bearer " + respondentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("action", "REJECT"))))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
    }

    @Test
    @DisplayName("PATCH /exchanges/{id}/respond - 요청자가 수락 시도 시 403")
    void respondAccept_forbidden() throws Exception {
        String createResult = mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(patch("/exchanges/{id}/respond", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("action", "ACCEPT", "selectedBookId", requesterBookId))))
                .andDo(print())
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /exchanges/{id}/complete - 약속·일정 후 양측 확인 시 1차 교환 완료")
    void completeExchange() throws Exception {
        String createResult = mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        // 수락
        mockMvc.perform(patch("/exchanges/{id}/respond", exchangeId)
                        .header("Authorization", "Bearer " + respondentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("action", "ACCEPT", "selectedBookId", requesterBookId))))
                .andExpect(status().isOk());

        // WF7: 양측 약속문 동의 → PLEDGED
        mockMvc.perform(post("/exchanges/{id}/pledge", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/exchanges/{id}/pledge", exchangeId)
                        .header("Authorization", "Bearer " + respondentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PLEDGED"));

        // WF8: 일정 확정 → SCHEDULED
        mockMvc.perform(patch("/exchanges/{id}/schedule", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("exchangeDate", "2026-07-01", "place", "홍대입구역 2번 출구"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SCHEDULED"));

        // WF9: 한쪽만 확인 → 아직 SCHEDULED 유지
        mockMvc.perform(patch("/exchanges/{id}/complete", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("durationDays", 7))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.data.requesterFirstConfirmed").value(true));

        // WF9: 양측 모두 확인 → FIRST_EXCHANGED + dueDate
        mockMvc.perform(patch("/exchanges/{id}/complete", exchangeId)
                        .header("Authorization", "Bearer " + respondentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("durationDays", 7))))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("FIRST_EXCHANGED"))
                .andExpect(jsonPath("$.data.dueDate").isNotEmpty());
    }

    @Test
    @DisplayName("PATCH /exchanges/{id}/cancel - 요청자가 취소")
    void cancelExchange() throws Exception {
        String createResult = mockMvc.perform(post("/exchanges")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long exchangeId = objectMapper.readTree(createResult).path("data").path("id").asLong();

        mockMvc.perform(patch("/exchanges/{id}/cancel", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("POST /exchanges - 인증 없으면 401")
    void createExchange_unauthorized() throws Exception {
        mockMvc.perform(post("/exchanges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetBookId", targetBookId))))
                .andExpect(status().isUnauthorized());
    }
}
