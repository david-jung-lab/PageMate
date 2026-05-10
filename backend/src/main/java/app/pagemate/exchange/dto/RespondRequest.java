package app.pagemate.exchange.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RespondRequest {

    @NotNull
    private String action; // "ACCEPT" or "REJECT"

    private Long selectedBookId; // ACCEPT 시 필수
}
