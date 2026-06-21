package app.pagemate.exchange;

import app.pagemate.notification.NotificationService;
import app.pagemate.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

// WF10: 반납 기한 D-3/D-1/D-Day 알림 스케줄러 (매일 오전 9시)
@Component
@RequiredArgsConstructor
public class ExchangeDueDateScheduler {

    private final ExchangeRepository exchangeRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *")
    public void sendDueDateReminders() {
        LocalDate today = LocalDate.now();
        sendReminders(today.plusDays(3), "D-3 · 반납 기한 3일 전이에요. 책 반납 준비를 해주세요!");
        sendReminders(today.plusDays(1), "D-1 · 반납 기한 하루 전이에요. 내일까지 책을 돌려드려야 해요!");
        sendReminders(today,             "D-Day · 오늘이 반납 기한이에요. 책을 돌려드려야 해요!");
    }

    private void sendReminders(LocalDate dueDate, String content) {
        List<Exchange> exchanges = exchangeRepository.findByStatusAndDueDate(
                ExchangeStatus.FIRST_EXCHANGED, dueDate);
        for (Exchange exchange : exchanges) {
            notificationService.send(exchange.getRequester().getId(),
                    NotificationType.SECOND_DUE, content, exchange.getId());
            notificationService.send(exchange.getRespondent().getId(),
                    NotificationType.SECOND_DUE, content, exchange.getId());
        }
    }
}
