package app.pagemate.exchange;

import app.pagemate.book.Book;
import app.pagemate.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "exchanges")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Exchange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "respondent_id", nullable = false)
    private User respondent;

    /** 내가 원하는 책 (상대방 소유) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_book_id", nullable = false)
    private Book requestedBook;

    /** 내가 제안하는 책 (본인 소유) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offered_book_id", nullable = false)
    private Book offeredBook;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ExchangeStatus status = ExchangeStatus.PENDING;

    @Column(length = 300)
    private String message;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void accept()   { this.status = ExchangeStatus.ACCEPTED; }
    public void reject()   { this.status = ExchangeStatus.REJECTED; }
    public void complete() { this.status = ExchangeStatus.COMPLETED; this.completedAt = LocalDateTime.now(); }
    public void cancel()   { this.status = ExchangeStatus.CANCELLED; }
}
