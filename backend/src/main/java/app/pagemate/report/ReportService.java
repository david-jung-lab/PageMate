package app.pagemate.report;

import app.pagemate.book.BookRepository;
import app.pagemate.chat.MessageRepository;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.report.dto.ReportCreateRequest;
import app.pagemate.report.dto.ReportResponse;
import app.pagemate.review.ReviewRepository;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final MessageRepository messageRepository;
    private final ReviewRepository reviewRepository;

    /**
     * 불쾌하거나 부적절한 콘텐츠를 신고한다.
     * 접수된 신고는 PENDING 상태로 쌓이며 운영자가 확인 후 처리한다.
     */
    @Transactional
    public ReportResponse createReport(Long reporterId, ReportCreateRequest req) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));

        if (req.targetType() == ReportTargetType.USER && req.targetId().equals(reporterId)) {
            throw new PagemateException(ErrorCode.SELF_REPORT);
        }
        if (!targetExists(req.targetType(), req.targetId())) {
            throw new PagemateException(ErrorCode.REPORT_TARGET_NOT_FOUND);
        }
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(
                reporterId, req.targetType(), req.targetId())) {
            throw new PagemateException(ErrorCode.DUPLICATE_REPORT);
        }

        Report report = reportRepository.save(Report.builder()
                .reporter(reporter)
                .targetType(req.targetType())
                .targetId(req.targetId())
                .reason(req.reason())
                .detail(req.detail())
                .build());

        return ReportResponse.of(report);
    }

    private boolean targetExists(ReportTargetType type, Long targetId) {
        return switch (type) {
            case USER -> userRepository.existsByIdAndDeletedAtIsNull(targetId);
            case BOOK -> bookRepository.existsById(targetId);
            case MESSAGE -> messageRepository.existsById(targetId);
            case REVIEW -> reviewRepository.existsById(targetId);
        };
    }
}
