package app.pagemate.chat.dto;

import app.pagemate.exchange.Exchange;

import java.time.LocalDate;

/**
 * 채팅방 상단 배너용 교환 요약.
 * secondExchangeDueDate 는 1차 교환 완료 시 설정되는 반납(2차 교환) 기한(Exchange.dueDate)을 의미한다.
 */
public record ExchangeSummaryResponse(
        Long exchangeId,
        String status,
        LocalDate firstExchangeDate,
        String firstExchangePlace,
        LocalDate secondExchangeDueDate
) {
    public static ExchangeSummaryResponse of(Exchange e) {
        return new ExchangeSummaryResponse(
                e.getId(),
                e.getStatus().name(),
                e.getFirstExchangeDate(),
                e.getFirstExchangePlace(),
                e.getDueDate()
        );
    }
}
