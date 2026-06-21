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

    @Column(name = "requester_pledged", nullable = false)
    @Builder.Default
    private boolean requesterPledged = false;

    @Column(name = "respondent_pledged", nullable = false)
    @Builder.Default
    private boolean respondentPledged = false;

    @Column(name = "first_exchange_date")
    private LocalDate firstExchangeDate;

    @Column(name = "first_exchange_place", length = 200)
    private String firstExchangePlace;

    @Column(name = "requester_first_confirmed", nullable = false)
    @Builder.Default
    private boolean requesterFirstConfirmed = false;

    @Column(name = "respondent_first_confirmed", nullable = false)
    @Builder.Default
    private boolean respondentFirstConfirmed = false;

    @Column(name = "requester_second_confirmed", nullable = false)
    @Builder.Default
    private boolean requesterSecondConfirmed = false;

    @Column(name = "respondent_second_confirmed", nullable = false)
    @Builder.Default
    private boolean respondentSecondConfirmed = false;

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

    public void reject() { this.status = ExchangeStatus.REJECTED; }

    public void pledgeByRequester() {
        this.requesterPledged = true;
        if (this.respondentPledged) {
            this.status = ExchangeStatus.PLEDGED;
        }
    }

    public void pledgeByRespondent() {
        this.respondentPledged = true;
        if (this.requesterPledged) {
            this.status = ExchangeStatus.PLEDGED;
        }
    }

    public void schedule(LocalDate exchangeDate, String place) {
        this.firstExchangeDate = exchangeDate;
        this.firstExchangePlace = place;
        this.status = ExchangeStatus.SCHEDULED;
    }

    // WF9: 1차 교환 완료 확인 (양측 confirmed 필요)
    public void confirmFirstByRequester()  { this.requesterFirstConfirmed = true; }
    public void confirmFirstByRespondent() { this.respondentFirstConfirmed = true; }
    public boolean isFirstFullyConfirmed() { return requesterFirstConfirmed && respondentFirstConfirmed; }

    public void firstComplete(int durationDays) {
        this.status = ExchangeStatus.FIRST_EXCHANGED;
        this.completedAt = LocalDateTime.now();
        this.dueDate = LocalDate.now().plusDays(durationDays);
    }

    // WF11: 2차 교환 완료 확인 (양측 confirmed 필요)
    public void confirmSecondByRequester()  { this.requesterSecondConfirmed = true; }
    public void confirmSecondByRespondent() { this.respondentSecondConfirmed = true; }
    public boolean isSecondFullyConfirmed() { return requesterSecondConfirmed && respondentSecondConfirmed; }

    public void secondComplete() { this.status = ExchangeStatus.SECOND_EXCHANGED; }

    public void complete() { this.status = ExchangeStatus.COMPLETED; }

    public void cancel() { this.status = ExchangeStatus.CANCELLED; }
}
