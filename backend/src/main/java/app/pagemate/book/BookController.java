package app.pagemate.book;

import app.pagemate.book.client.KakaoBookSearchClient;
import app.pagemate.book.dto.*;
import app.pagemate.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
@Validated
public class BookController {

    private final KakaoBookSearchClient kakaoBookSearchClient;
    private final BookService bookService;

    @GetMapping("/search/kakao")
    public ResponseEntity<ApiResponse<KakaoBookSearchResponse>> searchKakaoBooks(
            @RequestParam @NotBlank String query,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(kakaoBookSearchClient.search(query, page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookDetailResponse>> createBook(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody BookCreateRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(bookService.createBook(userId, req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BookPageResponse<BookSummaryResponse>>> getBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String genre,
            @RequestParam(defaultValue = "LATEST") String sort,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                bookService.getBooks(keyword, genre, sort, page, size)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<BookPageResponse<BookSummaryResponse>>> getMyBooks(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) BookStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(bookService.getMyBooks(userId, status, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookDetailResponse>> getBook(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(bookService.getBook(id)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<BookDetailResponse>> updateBook(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody BookUpdateRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok(bookService.updateBook(userId, id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBook(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        bookService.deleteBook(userId, id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
