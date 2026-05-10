package app.pagemate.exchange.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ExchangeCreateRequest {

    @NotNull
    private Long targetBookId;
}
