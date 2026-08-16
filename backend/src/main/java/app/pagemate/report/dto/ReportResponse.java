package app.pagemate.report.dto;

import app.pagemate.report.Report;
import app.pagemate.report.ReportReason;
import app.pagemate.report.ReportStatus;
import app.pagemate.report.ReportTargetType;

import java.time.LocalDateTime;

public record ReportResponse(
        Long id,
        ReportTargetType targetType,
        Long targetId,
        ReportReason reason,
        ReportStatus status,
        LocalDateTime createdAt
) {
    public static ReportResponse of(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getTargetType(),
                report.getTargetId(),
                report.getReason(),
                report.getStatus(),
                report.getCreatedAt()
        );
    }
}
