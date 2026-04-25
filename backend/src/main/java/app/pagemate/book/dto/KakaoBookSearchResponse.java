package app.pagemate.book.dto;

import java.util.List;

public record KakaoBookSearchResponse(
        List<BookItem> books,
        int totalCount,
        boolean isEnd
) {
    public record BookItem(
            String title,
            List<String> authors,
            String publisher,
            String isbn,
            String thumbnail,
            String contents,
            String datetime
    ) {}
}
