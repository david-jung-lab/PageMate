package app.pagemate.report;

import app.pagemate.common.response.ApiResponse;
import app.pagemate.report.dto.ReportCreateRequest;
import app.pagemate.report.dto.ReportResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** 사용자·도서·채팅 메시지·후기 신고 */
    @PostMapping
    public ApiResponse<ReportResponse> create(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReportCreateRequest req
    ) {
        return ApiResponse.ok(reportService.createReport(userId, req));
    }
}
