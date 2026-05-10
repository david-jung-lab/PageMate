package app.pagemate.book.dto;

import app.pagemate.book.Book;
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
        String description,
        String imageUrl,
        String coverColor,
        BookStatus status,
        String neighborhood,
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
            double averageRating,
            int reviewCount
    ) {}

    public static BookDetailResponse of(Book book, int bookCount, int exchangeCount, double averageRating, int reviewCount) {
        var u = book.getOwner();
        return new BookDetailResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getPublisher(),
                book.getIsbn(),
                book.getGenre(),
                book.getDescription(),
                book.getImageUrl(),
                book.getCoverColor(),
                book.getStatus(),
                book.getNeighborhood(),
                new OwnerDetailInfo(
                        u.getId(), u.getNickname(), u.getHandle(),
                        u.getProfileImage(), u.getBio(), u.getTags(),
                        bookCount, exchangeCount, averageRating, reviewCount
                ),
                book.getCreatedAt()
        );
    }
}
