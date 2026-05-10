package app.pagemate.chat;

import app.pagemate.TestJwtHelper;
import app.pagemate.auth.OAuthProvider;
import app.pagemate.book.Book;
import app.pagemate.book.BookRepository;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ChatControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired BookRepository bookRepository;
    @Autowired ChatRoomRepository chatRoomRepository;
    @Autowired MessageRepository messageRepository;
    @Autowired TestJwtHelper jwt;

    private static Long requesterId;
    private static Long ownerId;
    private static Long outsiderId;
    private static Long bookId;
    private static Long roomId;

    @BeforeAll
    static void setUp(@Autowired UserRepository userRepository,
                      @Autowired BookRepository bookRepository) {
        User requester = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO).oauthId("chat_test_req").nickname("교환요청자").build());
        User owner = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO).oauthId("chat_test_own").nickname("책주인").build());
        User outsider = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO).oauthId("chat_test_out").nickname("외부인").build());

        Book book = bookRepository.save(Book.builder()
                .owner(owner).title("채팅테스트책").author("저자").genre("소설")
                .coverColor("blue").build());

        requesterId = requester.getId();
        ownerId = owner.getId();
        outsiderId = outsider.getId();
        bookId = book.getId();
    }

    @AfterAll
    static void tearDown(@Autowired ChatRoomRepository chatRoomRepository,
                         @Autowired BookRepository bookRepository,
                         @Autowired UserRepository userRepository) {
        chatRoomRepository.findAll().stream()
                .filter(r -> r.getRequester().getId().equals(requesterId))
                .forEach(chatRoomRepository::delete);
        bookRepository.deleteById(bookId);
        userRepository.deleteById(requesterId);
        userRepository.deleteById(ownerId);
        userRepository.deleteById(outsiderId);
    }

    @Test
    @Order(1)
    @DisplayName("POST /chat/rooms - 채팅방 생성 + 시스템 메시지 자동 발송")
    void createRoom() throws Exception {
        var result = mockMvc.perform(post("/chat/rooms")
                        .header("Authorization", jwt.token(requesterId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":" + bookId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookTitle").value("채팅테스트책"))
                .andExpect(jsonPath("$.data.partnerNickname").value("책주인"))
                .andExpect(jsonPath("$.data.lastMessage").value("교환 요청이 시작되었어요."))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        roomId = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(body).path("data").path("id").asLong();
    }

    @Test
    @Order(2)
    @DisplayName("POST /chat/rooms - 동일 책 중복 요청 시 기존 방 반환")
    void createRoom_duplicate() throws Exception {
        mockMvc.perform(post("/chat/rooms")
                        .header("Authorization", jwt.token(requesterId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":" + bookId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(roomId));
    }

    @Test
    @Order(3)
    @DisplayName("GET /chat/rooms - 채팅방 목록 조회")
    void getRooms() throws Exception {
        mockMvc.perform(get("/chat/rooms")
                        .header("Authorization", jwt.token(requesterId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @Order(4)
    @DisplayName("GET /chat/rooms/{id}/messages - 메시지 내역 (시스템 메시지 포함)")
    void getMessages() throws Exception {
        mockMvc.perform(get("/chat/rooms/" + roomId + "/messages?size=10")
                        .header("Authorization", jwt.token(requesterId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.messages", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.messages[0].messageType").value("SYSTEM"))
                .andExpect(jsonPath("$.data.messages[0].content").value("교환 요청이 시작되었어요."));
    }

    @Test
    @Order(5)
    @DisplayName("GET /chat/rooms/{id}/messages - 비참여자 접근 시 403")
    void getMessages_forbidden() throws Exception {
        mockMvc.perform(get("/chat/rooms/" + roomId + "/messages")
                        .header("Authorization", jwt.token(outsiderId)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("CHAT_ACCESS_DENIED"));
    }

    @Test
    @Order(6)
    @DisplayName("GET /chat/rooms/{id}/messages - 커서 기반 페이지네이션")
    void getMessages_cursor() throws Exception {
        // size=1로 첫 페이지 조회
        var first = mockMvc.perform(get("/chat/rooms/" + roomId + "/messages?size=1")
                        .header("Authorization", jwt.token(requesterId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.messages", hasSize(1)))
                .andReturn();

        // hasMore, nextCursor 검증 — 메시지가 1건이면 hasMore=false
        String body = first.getResponse().getContentAsString();
        boolean hasMore = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(body).path("data").path("hasMore").asBoolean();
        // 시스템 메시지 1건이므로 hasMore=false
        org.junit.jupiter.api.Assertions.assertFalse(hasMore);
    }

    @Test
    @Order(7)
    @DisplayName("PATCH /chat/rooms/{id}/read - 읽음 처리")
    void markAsRead() throws Exception {
        mockMvc.perform(patch("/chat/rooms/" + roomId + "/read")
                        .header("Authorization", jwt.token(ownerId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 읽음 처리 후 unreadCount = 0
        mockMvc.perform(get("/chat/rooms")
                        .header("Authorization", jwt.token(ownerId)))
                .andExpect(jsonPath("$.data[0].unreadCount").value(0));
    }
}
