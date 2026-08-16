package app.pagemate.report;

import app.pagemate.auth.OAuthProvider;
import app.pagemate.book.BookRepository;
import app.pagemate.chat.MessageRepository;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.report.dto.ReportCreateRequest;
import app.pagemate.review.ReviewRepository;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportService - 콘텐츠 신고")
class ReportServiceTest {

    @Mock ReportRepository reportRepository;
    @Mock UserRepository userRepository;
    @Mock BookRepository bookRepository;
    @Mock MessageRepository messageRepository;
    @Mock ReviewRepository reviewRepository;

    @InjectMocks ReportService reportService;

    private User reporter() {
        User u = User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("reporter")
                .nickname("신고자")
                .build();
        ReflectionTestUtils.setField(u, "id", 1L);
        return u;
    }

    private ReportCreateRequest request(ReportTargetType type, Long targetId) {
        return new ReportCreateRequest(type, targetId, ReportReason.ABUSE, "욕설을 했습니다.");
    }

    @Test
    @DisplayName("성공 - 채팅 메시지를 신고하면 PENDING 으로 접수된다")
    void reportMessage() {
        given(userRepository.findById(1L)).willReturn(Optional.of(reporter()));
        given(messageRepository.existsById(10L)).willReturn(true);
        given(reportRepository.existsByReporterIdAndTargetTypeAndTargetId(
                1L, ReportTargetType.MESSAGE, 10L)).willReturn(false);
        given(reportRepository.save(any(Report.class))).willAnswer(inv -> inv.getArgument(0));

        var res = reportService.createReport(1L, request(ReportTargetType.MESSAGE, 10L));

        verify(reportRepository).save(any(Report.class));
        org.assertj.core.api.Assertions.assertThat(res.status()).isEqualTo(ReportStatus.PENDING);
    }

    @Test
    @DisplayName("실패 - 본인은 신고할 수 없다")
    void selfReport() {
        given(userRepository.findById(1L)).willReturn(Optional.of(reporter()));

        assertThatThrownBy(() -> reportService.createReport(1L, request(ReportTargetType.USER, 1L)))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.SELF_REPORT);

        verify(reportRepository, never()).save(any());
    }

    @Test
    @DisplayName("실패 - 존재하지 않는 대상은 신고할 수 없다")
    void targetNotFound() {
        given(userRepository.findById(1L)).willReturn(Optional.of(reporter()));
        given(bookRepository.existsById(99L)).willReturn(false);

        assertThatThrownBy(() -> reportService.createReport(1L, request(ReportTargetType.BOOK, 99L)))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.REPORT_TARGET_NOT_FOUND);
    }

    @Test
    @DisplayName("실패 - 같은 대상을 두 번 신고할 수 없다")
    void duplicateReport() {
        given(userRepository.findById(1L)).willReturn(Optional.of(reporter()));
        given(reviewRepository.existsById(5L)).willReturn(true);
        given(reportRepository.existsByReporterIdAndTargetTypeAndTargetId(
                1L, ReportTargetType.REVIEW, 5L)).willReturn(true);

        assertThatThrownBy(() -> reportService.createReport(1L, request(ReportTargetType.REVIEW, 5L)))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.DUPLICATE_REPORT);

        verify(reportRepository, never()).save(any());
    }
}
