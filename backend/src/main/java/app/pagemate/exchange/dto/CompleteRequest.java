package app.pagemate.exchange.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CompleteRequest {
    @NotNull
    @Min(1) @Max(30)
    private Integer durationDays = 7;
}
