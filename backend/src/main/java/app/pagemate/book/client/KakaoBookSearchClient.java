package app.pagemate.book.client;

import app.pagemate.book.dto.KakaoBookSearchResponse;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Arrays;
import java.util.List;

@Component
public class KakaoBookSearchClient {

    private final String apiKey;
    private final String bookSearchUrl;
    private final RestClient restClient;

    public KakaoBookSearchClient(
            @Value("${kakao.api-key}") String apiKey,
            @Value("${kakao.book-search-url}") String bookSearchUrl
    ) {
        this.apiKey = apiKey;
        this.bookSearchUrl = bookSearchUrl;
        this.restClient = RestClient.create();
    }

    public KakaoBookSearchResponse search(String query, int page, int size) {
        try {
            KakaoResponse response = restClient.get()
                    .uri(bookSearchUrl + "?query={q}&page={p}&size={s}", query, page, size)
                    .header("Authorization", "KakaoAK " + apiKey)
                    .retrieve()
                    .body(KakaoResponse.class);

            List<KakaoBookSearchResponse.BookItem> books = response.getDocuments().stream()
                    .map(doc -> new KakaoBookSearchResponse.BookItem(
                            doc.getTitle(),
                            doc.getAuthors(),
                            doc.getPublisher(),
                            extractIsbn13(doc.getIsbn()),
                            doc.getThumbnail(),
                            doc.getContents(),
                            extractDate(doc.getDatetime())
                    ))
                    .toList();

            return new KakaoBookSearchResponse(
                    books,
                    response.getMeta().getTotalCount(),
                    response.getMeta().isEnd()
            );
        } catch (RestClientException e) {
            throw new PagemateException(ErrorCode.KAKAO_API_ERROR);
        }
    }

    // Kakao returns "isbn10 isbn13" — take isbn13 (13 digits)
    private String extractIsbn13(String isbn) {
        if (isbn == null || isbn.isBlank()) return null;
        return Arrays.stream(isbn.split(" "))
                .filter(s -> s.length() == 13)
                .findFirst()
                .orElse(isbn.trim());
    }

    // Kakao returns ISO-8601 datetime — take date part only
    private String extractDate(String datetime) {
        if (datetime == null || datetime.isBlank()) return null;
        return datetime.substring(0, 10);
    }

    @Getter
    private static class KakaoResponse {
        private Meta meta;
        private List<Document> documents;

        @Getter
        private static class Meta {
            @JsonProperty("total_count")
            private int totalCount;
            @JsonProperty("is_end")
            private boolean isEnd;
        }

        @Getter
        private static class Document {
            private String title;
            private List<String> authors;
            private String publisher;
            private String isbn;
            private String thumbnail;
            private String contents;
            private String datetime;
        }
    }
}
