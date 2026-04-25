package app.pagemate.book;

import app.pagemate.TestJwtHelper;
import app.pagemate.auth.OAuthProvider;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BookControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired BookRepository bookRepository;
    @Autowired TestJwtHelper jwt;

    private static Long testUserId;
    private static Long otherUserId;
    private static Long testBookId;

    @BeforeAll
    static void setUp(@Autowired UserRepository userRepository) {
        User user = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO).oauthId("book_test_001")
                .nickname("책테스터").build());
        User other = userRepository.save(User.builder()
                .oauthProvider(OAuthProvider.KAKAO).oauthId("book_test_002")
                .nickname("다른유저").build());
        testUserId = user.getId();
        otherUserId = other.getId();
    }

    @AfterAll
    static void tearDown(@Autowired BookRepository bookRepository,
                         @Autowired UserRepository userRepository) {
        bookRepository.deleteAll(bookRepository.findAll().stream()
                .filter(b -> b.getOwner().getId().equals(testUserId)
                          || b.getOwner().getId().equals(otherUserId))
                .toList());
        userRepository.deleteById(testUserId);
        userRepository.deleteById(otherUserId);
    }

    @Test
    @Order(1)
    @DisplayName("GET /books - 전체 도서 목록 공개 조회")
    void getBooks() throws Exception {
        mockMvc.perform(get("/books?page=0&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @Order(2)
    @DisplayName("POST /books - 도서 등록 (인증 필요)")
    void createBook() throws Exception {
        var result = mockMvc.perform(multipart("/books")
                        .param("title", "테스트 도서")
                        .param("author", "테스트 저자")
                        .param("genre", "소설")
                        .param("condition", "GOOD")
                        .param("coverColor", "blue")
                        .header("Authorization", jwt.token(testUserId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("테스트 도서"))
                .andExpect(jsonPath("$.data.condition").value("GOOD"))
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        testBookId = objectMapper.readTree(body).path("data").path("id").asLong();
    }

    @Test
    @Order(3)
    @DisplayName("GET /books/{id} - 도서 상세 조회")
    void getBook() throws Exception {
        mockMvc.perform(get("/books/" + testBookId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(testBookId))
                .andExpect(jsonPath("$.data.owner.id").value(testUserId));
    }

    @Test
    @Order(4)
    @DisplayName("GET /books/{id} - 존재하지 않는 도서 404")
    void getBook_notFound() throws Exception {
        mockMvc.perform(get("/books/99999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("BOOK_NOT_FOUND"));
    }

    @Test
    @Order(5)
    @DisplayName("GET /books/me - 내 도서 목록")
    void getMyBooks() throws Exception {
        mockMvc.perform(get("/books/me")
                        .header("Authorization", jwt.token(testUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @Order(6)
    @DisplayName("PATCH /books/{id} - 내 도서 수정")
    void updateBook() throws Exception {
        mockMvc.perform(patch("/books/" + testBookId)
                        .header("Authorization", jwt.token(testUserId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"description":"수정된 설명","condition":"LIKE_NEW","coverColor":"green"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.condition").value("LIKE_NEW"))
                .andExpect(jsonPath("$.data.description").value("수정된 설명"));
    }

    @Test
    @Order(7)
    @DisplayName("PATCH /books/{id} - 타인 도서 수정 시 403")
    void updateBook_forbidden() throws Exception {
        mockMvc.perform(patch("/books/" + testBookId)
                        .header("Authorization", jwt.token(otherUserId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"condition":"ACCEPTABLE"}
                        """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("BOOK_ACCESS_DENIED"));
    }

    @Test
    @Order(8)
    @DisplayName("DELETE /books/{id} - 도서 삭제 후 404 확인")
    void deleteBook() throws Exception {
        mockMvc.perform(delete("/books/" + testBookId)
                        .header("Authorization", jwt.token(testUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/books/" + testBookId))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(9)
    @DisplayName("GET /books - 장르 필터")
    void getBooks_genreFilter() throws Exception {
        mockMvc.perform(get("/books?genre=소설&page=0&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @Order(10)
    @DisplayName("GET /books - 위치 기반 거리 정렬")
    void getBooks_locationSort() throws Exception {
        mockMvc.perform(get("/books?lat=37.4979&lng=127.0276&radiusKm=10&sort=DISTANCE&page=0&size=3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].distance").isNumber());
    }
}
