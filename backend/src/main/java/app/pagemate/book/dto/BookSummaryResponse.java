package app.pagemate.book.dto;

import app.pagemate.book.Book;
import app.pagemate.book.BookStatus;

import java.time.LocalDateTime;

public record BookSummaryResponse(
        Long id,
        String title,
        String author,
        String genre,
        String imageUrl,
        String coverColor,
        OwnerInfo owner,
        BookStatus status,
        Double distance,
        LocalDateTime createdAt
) {
    public record OwnerInfo(Long id, String nickname, String profileImage) {}

    public static BookSummaryResponse of(Book book, Double distance) {
        return new BookSummaryResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getGenre(),
                book.getImageUrl(),
                book.getCoverColor(),
                new OwnerInfo(
                        book.getOwner().getId(),
                        book.getOwner().getNickname(),
                        book.getOwner().getProfileImage()
                ),
                book.getStatus(),
                distance,
                book.getCreatedAt()
        );
    }
}
