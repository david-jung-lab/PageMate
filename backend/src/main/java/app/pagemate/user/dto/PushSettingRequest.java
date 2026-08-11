package app.pagemate.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PushSettingRequest {
    /** 푸시 알림 수신 여부 */
    @NotNull
    private Boolean pushEnabled;
}
