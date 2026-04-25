package app.pagemate.reading;

import app.pagemate.auth.OAuthProvider;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.reading.dto.ReadingRecordRequest;
import app.pagemate.reading.dto.ReadingRecordResponse;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ReadingRecordServiceTest {

    @Mock ReadingRecordRepository recordRepository;
    @Mock UserRepository userRepository;

    @InjectMocks ReadingRecordService service;

    private User user;
    private ReadingRecord record;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("kakao_001")
                .nickname("김독서")
                .handle("kimbook")
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        record = ReadingRecord.builder()
                .user(user)
                .bookTitle("아주 희미한 빛으로도")
                .author("최은영")
                .rating(5)
                .coverColor("sage")
                .isPublic(true)
                .readAt(LocalDate.of(2026, 3, 15))
                .build();
        ReflectionTestUtils.setField(record, "id", 10L);
    }

    // ─── getMyRecords ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getMyRecords")
    class GetMyRecords {

        @Test
        @DisplayName("성공 - 내 독서 기록 전체 반환")
        void success() {
            given(recordRepository.findByUserIdOrderByReadAtDesc(eq(1L), any()))
                    .willReturn(new PageImpl<>(List.of(record), PageRequest.of(0, 20), 1));

            var result = service.getMyRecords(1L, 0, 20);

            assertThat(result.content()).hasSize(1);
            assertThat(result.content().get(0).bookTitle()).isEqualTo("아주 희미한 빛으로도");
            assertThat(result.totalElements()).isEqualTo(1);
        }
    }

    // ─── getUserRecords ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getUserRecords")
    class GetUserRecords {

        @Test
        @DisplayName("성공 - 공개 기록만 반환")
        void success() {
            given(userRepository.existsById(1L)).willReturn(true);
            given(recordRepository.findByUserIdAndIsPublicTrueOrderByReadAtDesc(eq(1L), any()))
                    .willReturn(new PageImpl<>(List.of(record), PageRequest.of(0, 20), 1));

            var result = service.getUserRecords(1L, 0, 20);

            assertThat(result.content()).hasSize(1);
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 유저 → USER_NOT_FOUND")
        void userNotFound() {
            given(userRepository.existsById(99L)).willReturn(false);

            assertThatThrownBy(() -> service.getUserRecords(99L, 0, 20))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.USER_NOT_FOUND);
        }
    }

    // ─── create ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("create")
    class Create {

        @Test
        @DisplayName("성공 - 기본값(public=true, coverColor=blue) 자동 설정")
        void success_defaults() {
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(recordRepository.save(any())).willAnswer(inv -> {
                ReadingRecord r = inv.getArgument(0);
                ReflectionTestUtils.setField(r, "id", 20L);
                return r;
            });

            ReadingRecordRequest req = new ReadingRecordRequest();
            req.setBookTitle("채식주의자");
            req.setAuthor("한강");
            req.setRating(4);
            req.setReadAt(LocalDate.of(2026, 4, 1));
            // isPublic, coverColor 미설정

            ReadingRecordResponse res = service.create(1L, req);

            assertThat(res.bookTitle()).isEqualTo("채식주의자");
            assertThat(res.coverColor()).isEqualTo("blue");
            assertThat(res.isPublic()).isTrue();
        }

        @Test
        @DisplayName("성공 - 명시적 값 사용")
        void success_explicit() {
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(recordRepository.save(any())).willAnswer(inv -> {
                ReadingRecord r = inv.getArgument(0);
                ReflectionTestUtils.setField(r, "id", 21L);
                return r;
            });

            ReadingRecordRequest req = new ReadingRecordRequest();
            req.setBookTitle("파친코");
            req.setAuthor("이민진");
            req.setRating(5);
            req.setCoverColor("orange");
            req.setIsPublic(false);
            req.setMemo("대작");
            req.setReadAt(LocalDate.of(2026, 2, 10));

            ReadingRecordResponse res = service.create(1L, req);

            assertThat(res.coverColor()).isEqualTo("orange");
            assertThat(res.isPublic()).isFalse();
            assertThat(res.memo()).isEqualTo("대작");
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 유저 → USER_NOT_FOUND")
        void userNotFound() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            ReadingRecordRequest req = new ReadingRecordRequest();
            req.setBookTitle("책");
            req.setAuthor("저자");
            req.setRating(3);
            req.setReadAt(LocalDate.now());

            assertThatThrownBy(() -> service.create(99L, req))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.USER_NOT_FOUND);
        }
    }

    // ─── update ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update")
    class Update {

        @Test
        @DisplayName("성공 - 부분 수정")
        void success() {
            given(recordRepository.findById(10L)).willReturn(Optional.of(record));

            ReadingRecordRequest req = new ReadingRecordRequest();
            req.setMemo("다시 읽어도 좋았어요");
            req.setRating(4);

            ReadingRecordResponse res = service.update(1L, 10L, req);

            assertThat(res.memo()).isEqualTo("다시 읽어도 좋았어요");
            assertThat(res.rating()).isEqualTo(4);
            assertThat(res.bookTitle()).isEqualTo("아주 희미한 빛으로도"); // 기존 값 유지
        }

        @Test
        @DisplayName("실패 - 기록 없음 → READING_RECORD_NOT_FOUND")
        void notFound() {
            given(recordRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> service.update(1L, 99L, new ReadingRecordRequest()))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.READING_RECORD_NOT_FOUND);
        }

        @Test
        @DisplayName("실패 - 타인 기록 수정 → READING_RECORD_ACCESS_DENIED")
        void accessDenied() {
            given(recordRepository.findById(10L)).willReturn(Optional.of(record));

            assertThatThrownBy(() -> service.update(999L, 10L, new ReadingRecordRequest()))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.READING_RECORD_ACCESS_DENIED);
        }
    }

    // ─── delete ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete")
    class Delete {

        @Test
        @DisplayName("성공 - 본인 기록 삭제")
        void success() {
            given(recordRepository.findById(10L)).willReturn(Optional.of(record));

            service.delete(1L, 10L);

            verify(recordRepository).delete(record);
        }

        @Test
        @DisplayName("실패 - 기록 없음 → READING_RECORD_NOT_FOUND")
        void notFound() {
            given(recordRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> service.delete(1L, 99L))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.READING_RECORD_NOT_FOUND);
        }

        @Test
        @DisplayName("실패 - 타인 기록 삭제 → READING_RECORD_ACCESS_DENIED")
        void accessDenied() {
            given(recordRepository.findById(10L)).willReturn(Optional.of(record));

            assertThatThrownBy(() -> service.delete(999L, 10L))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.READING_RECORD_ACCESS_DENIED);
        }
    }
}
