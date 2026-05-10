package app.pagemate.book;

import app.pagemate.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 100)
    private String author;

    @Column(length = 100)
    private String publisher;

    @Column(length = 20)
    private String isbn;

    @Column(nullable = false, length = 50)
    private String genre;

    @Column(length = 200)
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "cover_color", nullable = false, length = 20)
    @Builder.Default
    private String coverColor = "sage";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BookStatus status = BookStatus.AVAILABLE;

    @Column(precision = 10, scale = 7)
    private BigDecimal lat;

    @Column(precision = 10, scale = 7)
    private BigDecimal lng;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void updateStatus(BookStatus status) {
        this.status = status;
    }

    public void update(String description, String coverColor) {
        if (description != null) this.description = description;
        if (coverColor != null) this.coverColor = coverColor;
    }
}
