package app.pagemate.report.dto;

import app.pagemate.report.ReportReason;
import app.pagemate.report.ReportTargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportCreateRequest(
        @NotNull ReportTargetType targetType,
        @NotNull Long targetId,
        @NotNull ReportReason reason,
        @Size(max = 500) String detail
) {
}
