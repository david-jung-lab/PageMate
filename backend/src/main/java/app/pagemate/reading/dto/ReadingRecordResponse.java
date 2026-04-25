package app.pagemate.reading.dto;

import app.pagemate.reading.ReadingRecord;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReadingRecordResponse(
        Long id,
        Long userId,
        String bookTitle,
        String author,
        String isbn,
        int rating,
        String memo,
        String imageUrl,
        String coverColor,
        boolean isPublic,
        LocalDate readAt,
        LocalDateTime createdAt
) {
    public static ReadingRecordResponse of(ReadingRecord r) {
        return new ReadingRecordResponse(
                r.getId(),
                r.getUser().getId(),
                r.getBookTitle(),
                r.getAuthor(),
                r.getIsbn(),
                r.getRating(),
                r.getMemo(),
                r.getImageUrl(),
                r.getCoverColor(),
                r.isPublic(),
                r.getReadAt(),
                r.getCreatedAt()
        );
    }
}
