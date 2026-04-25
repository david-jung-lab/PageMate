package app.pagemate.book.dto;

import app.pagemate.book.Book;
import app.pagemate.book.BookCondition;
import app.pagemate.book.BookStatus;

import java.time.LocalDateTime;
import java.util.List;

public record BookDetailResponse(
        Long id,
        String title,
        String author,
        String publisher,
        String isbn,
        String genre,
        BookCondition condition,
        String description,
        String imageUrl,
        String coverColor,
        BookStatus status,
        Double distance,
        OwnerDetailInfo owner,
        LocalDateTime createdAt
) {
    public record OwnerDetailInfo(
            Long id,
            String nickname,
            String handle,
            String profileImage,
            String bio,
            List<String> tags,
            int bookCount,
            int exchangeCount,
            Double rating
    ) {}

    public static BookDetailResponse of(Book book, Double distance, int bookCount, int exchangeCount) {
        var u = book.getOwner();
        return new BookDetailResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getPublisher(),
                book.getIsbn(),
                book.getGenre(),
                book.getCondition(),
                book.getDescription(),
                book.getImageUrl(),
                book.getCoverColor(),
                book.getStatus(),
                distance,
                new OwnerDetailInfo(
                        u.getId(), u.getNickname(), u.getHandle(),
                        u.getProfileImage(), u.getBio(), u.getTags(),
                        bookCount, exchangeCount, null
                ),
                book.getCreatedAt()
        );
    }
}
