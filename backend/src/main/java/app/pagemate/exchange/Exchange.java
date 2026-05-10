package app.pagemate.exchange;

import app.pagemate.book.Book;
import app.pagemate.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
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

    /** 요청자가 원하는 책 (응답자 소유) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_book_id", nullable = false)
    private Book requestedBook;

    /** 응답자가 수락 시 선택한 요청자 소유 책 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_book_id")
    private Book selectedBook;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ExchangeStatus status = ExchangeStatus.PENDING;

    @Column(length = 300)
    private String message;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void accept(Book selectedBook) {
        this.status = ExchangeStatus.ACCEPTED;
        this.selectedBook = selectedBook;
    }
    public void reject()   { this.status = ExchangeStatus.REJECTED; }
    public void firstComplete(int durationDays) {
        this.status = ExchangeStatus.FIRST_EXCHANGED;
        this.completedAt = LocalDateTime.now();
        this.dueDate = LocalDate.now().plusDays(durationDays);
    }
    public void secondComplete() { this.status = ExchangeStatus.COMPLETED; }
    public void cancel()   { this.status = ExchangeStatus.CANCELLED; }
}
