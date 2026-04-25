package app.pagemate.reading;

import app.pagemate.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reading_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ReadingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "book_title", nullable = false, length = 200)
    private String bookTitle;

    @Column(nullable = false, length = 100)
    private String author;

    @Column(length = 20)
    private String isbn;

    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "cover_color", length = 20, nullable = false)
    private String coverColor;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic;

    @Column(name = "read_at", nullable = false)
    private LocalDate readAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void update(String bookTitle, String author, String isbn,
                       Integer rating, String memo, String imageUrl,
                       String coverColor, Boolean isPublic, LocalDate readAt) {
        if (bookTitle != null) this.bookTitle = bookTitle;
        if (author != null) this.author = author;
        if (isbn != null) this.isbn = isbn;
        if (rating != null) this.rating = rating;
        if (memo != null) this.memo = memo;
        if (imageUrl != null) this.imageUrl = imageUrl;
        if (coverColor != null) this.coverColor = coverColor;
        if (isPublic != null) this.isPublic = isPublic;
        if (readAt != null) this.readAt = readAt;
    }
}
