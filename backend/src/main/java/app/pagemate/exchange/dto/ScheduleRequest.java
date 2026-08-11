package app.pagemate.exchange.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class ScheduleRequest {

    @NotNull
    private LocalDate exchangeDate;

    @NotBlank
    private String place;
}
